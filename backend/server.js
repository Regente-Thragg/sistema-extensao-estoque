const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Configuração (segredos vêm de variáveis de ambiente, nunca do código)
// ---------------------------------------------------------------------------
if (!process.env.DB_PASSWORD) {
  console.error('Defina a variável de ambiente DB_PASSWORD (senha do banco do Supabase).');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'aws-0-us-east-1.pooler.supabase.com',
  user: process.env.DB_USER || 'postgres.baukinwjwktzcsmpvcka',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
  ssl: { rejectUnauthorized: false }
});

// URL e chave "publishable" do Supabase são públicas (já ficam no front-end)
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://baukinwjwktzcsmpvcka.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_dm9fZ0459USH7rGlDzGE1w_8-apyI2l';

// ---------------------------------------------------------------------------
// Autenticação: descobre QUEM está chamando a partir do token do Supabase
// ---------------------------------------------------------------------------
const cacheTokens = new Map(); // token -> { email, expira }
const TTL_CACHE_MS = 60 * 1000;

async function emailDoToken(token) {
  const emCache = cacheTokens.get(token);
  if (emCache && emCache.expira > Date.now()) return emCache.email;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000)
  });
  if (r.status === 401 || r.status === 403) return null; // token inválido ou expirado
  if (!r.ok) throw new Error(`Supabase Auth respondeu ${r.status}`);

  const user = await r.json();
  const email = user && user.email ? String(user.email).trim().toLowerCase() : null;
  if (!email) return null;

  if (cacheTokens.size > 500) cacheTokens.clear();
  cacheTokens.set(token, { email, expira: Date.now() + TTL_CACHE_MS });
  return email;
}

async function autenticar(req, res, next) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return res.status(401).json({ erro: 'Autenticação necessária.' });
  try {
    const email = await emailDoToken(m[1].trim());
    if (!email) return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' });
    req.usuarioEmail = email; // todas as consultas abaixo filtram por este valor
    next();
  } catch (err) {
    console.error('Erro ao validar sessão:', err.message);
    res.status(503).json({ erro: 'Não foi possível validar a sessão. Tente novamente.' });
  }
}

// Rota pública só para checar se o servidor está de pé
app.get('/health', (req, res) => res.json({ ok: true }));

// Tudo em /api exige usuário logado
app.use('/api', autenticar);

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
class ErroHttp extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

function responderErro(res, err, mensagemPadrao, contexto) {
  if (err instanceof ErroHttp) return res.status(err.status).json({ erro: err.message });
  if (err.code === '22P02') return res.status(404).json({ erro: 'Registro não encontrado.' }); // id inválido
  console.error(`${contexto}:`, err.message);
  res.status(500).json({ erro: mensagemPadrao });
}

// Roda várias queries como uma operação só (ou tudo grava, ou nada grava)
async function transacao(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

// Converte para número. Vazio -> padrao. Inválido -> NaN.
function numero(valor, padrao = null) {
  if (valor === undefined || valor === null || valor === '') return padrao;
  const n = Number(valor);
  return Number.isFinite(n) ? n : NaN;
}

// Limpa automaticamente registros do histórico com mais de 3 meses (vale para todos)
async function limparHistoricoAntigo() {
  try {
    const resultado = await pool.query(`DELETE FROM historico WHERE data_registro < NOW() - INTERVAL '3 months'`);
    if (resultado.rowCount > 0) {
      console.log(`[Limpeza Automática] ${resultado.rowCount} registros antigos de histórico foram removidos (limpeza trimestral).`);
    }
  } catch (err) {
    console.error('Erro ao executar limpeza automática do histórico:', err.message);
  }
}

// ---------------------------------------------------------------------------
// PRODUTOS (sempre filtrados pelo usuário logado)
// ---------------------------------------------------------------------------

// 1. Buscar os produtos do usuário
app.get('/api/produtos', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM produtos WHERE usuario_email = $1 ORDER BY id ASC',
      [req.usuarioEmail]
    );
    res.json(resultado.rows);
  } catch (err) {
    responderErro(res, err, 'Erro ao buscar produtos no banco.', 'Erro ao buscar produtos');
  }
});

// 2. Criar produto (registra a entrada inicial no histórico como COMPRA)
app.post('/api/produtos', async (req, res) => {
  try {
    const { categoria, qtd, preco, validade } = req.body;
    const nome = String(req.body.nome || '').trim();
    const quantidade = numero(qtd, 0);
    const precoUnit = numero(preco, 0);

    if (!nome) return res.status(400).json({ erro: 'O nome do produto é obrigatório.' });
    if (!(quantidade >= 0) || !(precoUnit >= 0)) {
      return res.status(400).json({ erro: 'Quantidade e preço devem ser números válidos.' });
    }

    const novo = await transacao(async (db) => {
      const r = await db.query(
        'INSERT INTO produtos (nome, categoria, qtd, preco, validade, usuario_email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [nome, categoria, quantidade, precoUnit, validade || null, req.usuarioEmail]
      );
      await db.query(
        'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario, usuario_email) VALUES ($1, $2, $3, $4, $5)',
        ['COMPRA', nome, quantidade, precoUnit, req.usuarioEmail]
      );
      return r.rows[0];
    });

    res.status(201).json(novo);
  } catch (err) {
    responderErro(res, err, 'Erro ao cadastrar produto no banco.', 'Erro ao cadastrar produto');
  }
});

// 3. Editar produto (somente os campos enviados)
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const b = req.body || {};
    const sets = [];
    const valores = [];
    const campo = (coluna, valor) => {
      valores.push(valor);
      sets.push(`${coluna} = $${valores.length}`);
    };

    if (b.nome !== undefined) {
      const nome = String(b.nome).trim();
      if (!nome) throw new ErroHttp(400, 'O nome do produto não pode ficar vazio.');
      campo('nome', nome);
    }
    if (b.categoria !== undefined) campo('categoria', b.categoria);
    if (b.qtd !== undefined) {
      const q = numero(b.qtd, NaN);
      if (!(q >= 0)) throw new ErroHttp(400, 'Quantidade inválida.');
      campo('qtd', q);
    }
    if (b.preco !== undefined) {
      const p = numero(b.preco, NaN);
      if (!(p >= 0)) throw new ErroHttp(400, 'Preço inválido.');
      campo('preco', p);
    }
    if (b.validade !== undefined) campo('validade', b.validade || null);

    if (sets.length === 0) throw new ErroHttp(400, 'Nenhum campo para atualizar.');

    valores.push(req.params.id, req.usuarioEmail);
    const resultado = await pool.query(
      `UPDATE produtos SET ${sets.join(', ')} WHERE id = $${valores.length - 1} AND usuario_email = $${valores.length} RETURNING *`,
      valores
    );
    if (resultado.rows.length === 0) throw new ErroHttp(404, 'Produto não encontrado.');
    res.json(resultado.rows[0]);
  } catch (err) {
    responderErro(res, err, 'Erro ao editar produto.', 'Erro ao editar produto');
  }
});

// 4. Repor estoque (soma unidades, atualiza preço e registra COMPRA)
app.put('/api/produtos/:id/repor', async (req, res) => {
  try {
    const qtdAdicionada = numero(req.body.qtd, 1);
    const precoInformado = numero(req.body.preco, null);
    if (!(qtdAdicionada > 0)) throw new ErroHttp(400, 'Quantidade inválida.');
    if (Number.isNaN(precoInformado) || (precoInformado !== null && precoInformado < 0)) {
      throw new ErroHttp(400, 'Preço inválido.');
    }

    const atualizado = await transacao(async (db) => {
      const atual = await db.query(
        'SELECT * FROM produtos WHERE id = $1 AND usuario_email = $2 FOR UPDATE',
        [req.params.id, req.usuarioEmail]
      );
      if (atual.rows.length === 0) throw new ErroHttp(404, 'Produto não encontrado.');

      const p = atual.rows[0];
      const novaQtd = Number(p.qtd) + qtdAdicionada;
      const novoPreco = precoInformado !== null ? precoInformado : p.preco;

      const r = await db.query(
        'UPDATE produtos SET qtd = $1, preco = $2 WHERE id = $3 AND usuario_email = $4 RETURNING *',
        [novaQtd, novoPreco, req.params.id, req.usuarioEmail]
      );
      await db.query(
        'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario, usuario_email) VALUES ($1, $2, $3, $4, $5)',
        ['COMPRA', p.nome, qtdAdicionada, novoPreco, req.usuarioEmail]
      );
      return r.rows[0];
    });

    res.json(atualizado);
  } catch (err) {
    responderErro(res, err, 'Erro ao repor estoque.', 'Erro ao repor estoque');
  }
});

// 5. Registrar consumo (subtrai unidades e registra CONSUMO)
app.put('/api/produtos/:id/venda', async (req, res) => {
  try {
    const qtdConsumida = numero(req.body.qtd, 1);
    if (!(qtdConsumida > 0)) throw new ErroHttp(400, 'Quantidade inválida.');

    const atualizado = await transacao(async (db) => {
      const atual = await db.query(
        'SELECT * FROM produtos WHERE id = $1 AND usuario_email = $2 FOR UPDATE',
        [req.params.id, req.usuarioEmail]
      );
      if (atual.rows.length === 0) throw new ErroHttp(404, 'Produto não encontrado.');

      const p = atual.rows[0];
      if (Number(p.qtd) < qtdConsumida) throw new ErroHttp(400, 'Estoque insuficiente!');

      const r = await db.query(
        'UPDATE produtos SET qtd = $1 WHERE id = $2 AND usuario_email = $3 RETURNING *',
        [Number(p.qtd) - qtdConsumida, req.params.id, req.usuarioEmail]
      );
      await db.query(
        'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario, usuario_email) VALUES ($1, $2, $3, $4, $5)',
        ['CONSUMO', p.nome, qtdConsumida, p.preco, req.usuarioEmail]
      );
      return r.rows[0];
    });

    res.json(atualizado);
  } catch (err) {
    responderErro(res, err, 'Erro ao registrar consumo.', 'Erro ao registrar consumo');
  }
});

// 6. Excluir produto (só se for do próprio usuário)
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const resultado = await pool.query(
      'DELETE FROM produtos WHERE id = $1 AND usuario_email = $2 RETURNING *',
      [req.params.id, req.usuarioEmail]
    );
    if (resultado.rows.length === 0) throw new ErroHttp(404, 'Produto não encontrado para exclusão.');
    res.json({ mensagem: 'Produto excluído com sucesso do banco!', produto: resultado.rows[0] });
  } catch (err) {
    responderErro(res, err, 'Erro ao deletar produto do banco.', 'Erro ao deletar produto');
  }
});

// ---------------------------------------------------------------------------
// HISTÓRICO (sempre filtrado pelo usuário logado)
// ---------------------------------------------------------------------------

// 7. Buscar o histórico do usuário (executa a limpeza trimestral)
app.get('/api/historico', async (req, res) => {
  try {
    await limparHistoricoAntigo();
    const resultado = await pool.query(
      'SELECT * FROM historico WHERE usuario_email = $1 ORDER BY data_registro DESC',
      [req.usuarioEmail]
    );
    res.json(resultado.rows);
  } catch (err) {
    responderErro(res, err, 'Erro ao buscar histórico.', 'Erro ao buscar histórico');
  }
});

// 8. Limpar o histórico do próprio usuário (nunca o dos outros)
app.delete('/api/historico', async (req, res) => {
  try {
    await pool.query('DELETE FROM historico WHERE usuario_email = $1', [req.usuarioEmail]);
    res.json({ mensagem: 'Histórico limpo com sucesso!' });
  } catch (err) {
    responderErro(res, err, 'Erro ao limpar histórico.', 'Erro ao limpar histórico');
  }
});

// ---------------------------------------------------------------------------
// CATEGORIAS (as do usuário + as globais, que têm usuario_email vazio)
// ---------------------------------------------------------------------------

// 9. Buscar categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM categorias WHERE usuario_email = $1 OR usuario_email IS NULL ORDER BY nome ASC',
      [req.usuarioEmail]
    );
    res.json(resultado.rows);
  } catch (err) {
    responderErro(res, err, 'Erro ao buscar categorias no banco.', 'Erro ao buscar categorias');
  }
});

// 10. Cadastrar categoria personalizada
app.post('/api/categorias', async (req, res) => {
  try {
    const nome = String((req.body && req.body.nome) || '').trim();
    if (!nome) throw new ErroHttp(400, 'O nome da categoria é obrigatório.');

    const duplicada = await pool.query(
      'SELECT 1 FROM categorias WHERE lower(nome) = lower($1) AND (usuario_email = $2 OR usuario_email IS NULL) LIMIT 1',
      [nome, req.usuarioEmail]
    );
    if (duplicada.rows.length > 0) throw new ErroHttp(400, 'Esta categoria já existe!');

    const resultado = await pool.query(
      'INSERT INTO categorias (nome, usuario_email) VALUES ($1, $2) RETURNING *',
      [nome, req.usuarioEmail]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ erro: 'Esta categoria já existe!' });
    }
    responderErro(res, err, 'Erro ao cadastrar categoria no banco.', 'Erro ao cadastrar categoria');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} conectado ao Supabase com sucesso!`);
  limparHistoricoAntigo();
});