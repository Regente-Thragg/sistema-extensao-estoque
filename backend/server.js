const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão com o Supabase usando o Shared Pooler
const pool = new Pool({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  user: 'postgres.baukinwjwktzcsmpvcka',
  password: '/#S%Jh2+NkxeW#c',
  database: 'postgres',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Função para limpar automaticamente registros do histórico com mais de 3 meses (90 dias)
async function limparHistoricoAntigo() {
  try {
    const query = `DELETE FROM historico WHERE data_registro < NOW() - INTERVAL '3 months'`;
    const resultado = await pool.query(query);
    if (resultado.rowCount > 0) {
      console.log(`[Limpeza Automática] ${resultado.rowCount} registros antigos de histórico foram removidos (limpeza trimestral).`);
    }
  } catch (err) {
    console.error('Erro ao executar limpeza automática do histórico:', err.message);
  }
}

// 1. Buscar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Erro detalhado ao buscar produtos:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar produtos no banco.' });
  }
});

// 2. Criar um novo produto (Com suporte a validade e registro automático no histórico de COMPRA)
app.post('/api/produtos', async (req, res) => {
  const { nome, categoria, qtd, preco, validade } = req.body;
  try {
    const query = 'INSERT INTO produtos (nome, categoria, qtd, preco, validade) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const valores = [nome, categoria, qtd, preco, validade || null];
    const resultado = await pool.query(query, valores);
    
    // Registra a adição inicial no histórico como COMPRA
    await pool.query(
      'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
      ['COMPRA', nome, Number(qtd), Number(preco)]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro detalhado ao cadastrar:', err.message);
    res.status(500).json({ erro: 'Erro ao cadastrar produto no banco.' });
  }
});

// 3. Rota para Repor Estoque (Soma unidades, atualiza preço e registra histórico de COMPRA)
app.put('/api/produtos/:id/repor', async (req, res) => {
  const { id } = req.params;
  const { qtd, preco } = req.body;
  try {
    const atual = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    if (atual.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });

    const p = atual.rows[0];
    const qtdAdicionada = Number(qtd || 1);
    const novaQtd = Number(p.qtd) + qtdAdicionada;
    const novoPreco = preco !== undefined && preco !== null && preco !== '' ? Number(preco) : p.preco;

    const resultado = await pool.query(
      'UPDATE produtos SET qtd = $1, preco = $2 WHERE id = $3 RETURNING *', 
      [novaQtd, novoPreco, id]
    );

    // Registra no Histórico Geral (Compra)
    await pool.query(
      'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
      ['COMPRA', p.nome, qtdAdicionada, novoPreco]
    );

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao repor estoque:', err.message);
    res.status(500).json({ erro: 'Erro ao repor estoque.' });
  }
});

// 4. Rota para Registrar Consumo (Subtrai unidades e registra histórico de CONSUMO)
app.put('/api/produtos/:id/venda', async (req, res) => {
  const { id } = req.params;
  const { qtd } = req.body;
  try {
    const atual = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    if (atual.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });

    const p = atual.rows[0];
    const qtdParaSubtrair = Number(qtd || 1);
    
    if (p.qtd < qtdParaSubtrair) {
      return res.status(400).json({ erro: 'Estoque insuficiente!' });
    }

    const novaQtd = Number(p.qtd) - qtdParaSubtrair;

    const resultado = await pool.query('UPDATE produtos SET qtd = $1 WHERE id = $2 RETURNING *', [novaQtd, id]);

    // Registra no Histórico Geral (Consumo)
    await pool.query(
      'INSERT INTO historico (tipo, produto_nome, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
      ['CONSUMO', p.nome, qtdParaSubtrair, p.preco]
    );

    res.json(resultado.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar consumo:', err.message);
    res.status(500).json({ erro: 'Erro ao registrar consumo.' });
  }
});

// 5. Excluir produto permanentemente
app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado para exclusão.' });
    }
    res.json({ mensagem: 'Produto excluído com sucesso do banco!', produto: resultado.rows[0] });
  } catch (err) {
    console.error('Erro detalhado ao deletar:', err.message);
    res.status(500).json({ erro: 'Erro ao deletar produto do banco.' });
  }
});

// 6. Buscar todo o histórico geral de movimentações (Executa limpeza trimestral)
app.get('/api/historico', async (req, res) => {
  try {
    await limparHistoricoAntigo();
    const resultado = await pool.query('SELECT * FROM historico ORDER BY data_registro DESC');
    res.json(resultado.rows);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar histórico.' });
  }
});

// 7. Rota para limpar todo o histórico manualmente
app.delete('/api/historico', async (req, res) => {
  try {
    await pool.query('DELETE FROM historico');
    res.json({ mensagem: 'Histórico limpo com sucesso!' });
  } catch (err) {
    console.error('Erro ao limpar histórico:', err.message);
    res.status(500).json({ erro: 'Erro ao limpar histórico.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} conectado ao Supabase com sucesso!`);
  limparHistoricoAntigo();
});