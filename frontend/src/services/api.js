import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://baukinwjwktzcsmpvcka.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dm9fZ0459USH7rGlDzGE1w_8-apyI2l';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_URL = 'https://sistema-extensao-estoque.onrender.com/api';

// ---------------------------------------------------------------------------
// Foto de perfil: NUNCA guardar a imagem dentro do user_metadata.
// Tudo que está no user_metadata vai dentro do token de login (JWT) e o token
// viaja em todo pedido ao backend; uma foto em base64 deixa o cabeçalho enorme
// e o servidor recusa o pedido (erro 431).
// ---------------------------------------------------------------------------
const BUCKET_AVATARES = 'avatares';

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Imagem inválida.'));
    img.src = src;
  });
}

// Recorta ao centro em quadrado, reduz e converte para JPEG
async function redimensionarImagem(dataUrl, lado = 256, qualidade = 0.8) {
  const img = await carregarImagem(dataUrl);
  const menor = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  canvas.getContext('2d').drawImage(
    img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao converter a imagem.'))), 'image/jpeg', qualidade);
  });
}

function blobParaDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error('Falha ao ler a imagem.'));
    leitor.readAsDataURL(blob);
  });
}

// Envia a foto (reduzida a 256x256) ao Storage e devolve só a URL pública
export async function enviarFotoPerfil(dataUrl) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const blob = await redimensionarImagem(dataUrl, 256, 0.8);
    const caminho = `${user.id}/avatar.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET_AVATARES)
      .upload(caminho, blob, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_AVATARES).getPublicUrl(caminho);
    return { url: `${data.publicUrl}?v=${Date.now()}` }; // ?v= evita mostrar a foto antiga em cache
  } catch (erro) {
    console.error('Erro ao enviar foto de perfil:', erro.message || erro);
    return { erro: erro.message || 'Não foi possível enviar a foto.' };
  }
}

// Contas antigas já têm a foto em base64 no perfil. Troca por URL (ou miniatura)
// e renova o token, para o cabeçalho voltar ao tamanho normal.
let reparoFotoEmAndamento = null;
async function repararFotoGrande(session) {
  const foto = session?.user?.user_metadata?.fotoPerfil;
  if (typeof foto !== 'string' || !foto.startsWith('data:')) return false;

  if (!reparoFotoEmAndamento) {
    reparoFotoEmAndamento = (async () => {
      const envio = await enviarFotoPerfil(foto);
      let nova = envio.url;
      if (!nova) {
        // Plano B (ex.: bucket ainda não criado): miniatura de 48px no próprio perfil
        try { nova = await blobParaDataUrl(await redimensionarImagem(foto, 48, 0.6)); } catch (_) { nova = ''; }
      }
      const { error } = await supabase.auth.updateUser({ data: { fotoPerfil: nova } });
      if (error) throw error;
      await supabase.auth.refreshSession();
    })()
      .catch((e) => console.error('Falha ao reduzir a foto de perfil:', e.message || e))
      .finally(() => { reparoFotoEmAndamento = null; });
  }
  await reparoFotoEmAndamento;
  return true;
}

// Todas as chamadas ao backend levam o token do usuário logado.
// O backend valida esse token e filtra os dados por usuário.
async function fetchApi(url, options = {}) {
  let { data: { session } } = await supabase.auth.getSession();
  if (await repararFotoGrande(session)) {
    ({ data: { session } } = await supabase.auth.getSession());
  }
  const headers = { ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return fetch(url, { ...options, headers });
}

// Webhooks do Google Apps Script (um por pasta do Drive)
const URL_API_AVALIACOES =
  import.meta.env.VITE_WEBHOOK_AVALIACOES_URL ||
  'https://script.google.com/macros/s/AKfycbxBP564WYjx0rGALpc73sgFcu9R6ODU7_lU62bCvxHrE7b7D0ZuUiHpmItxCj494NLj/exec';
const URL_API_ENDERECOS =
  import.meta.env.VITE_WEBHOOK_ENDERECOS_URL ||
  'https://script.google.com/macros/s/AKfycbzXKCU0ismLzrcGl_nXKTTtvKaG4C-jW4SHpvjIS5yMRwwdf6BbYskDfskjVqLO9huXYw/exec';

// Envia uma cópia ao Drive. Não bloqueia nem quebra o salvamento principal.
function enviarParaDrive(url, payload) {
  try {
    fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script não responde CORS; a resposta fica opaca
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    }).catch((e) => console.error('Falha ao enviar dados ao Drive:', e));
  } catch (e) {
    console.error('Falha ao enviar dados ao Drive:', e);
  }
}

const dataHoraBR = () => new Date().toLocaleString('pt-BR');

export async function buscarProdutos() {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos`);
    const dados = await resposta.json();
    return Array.isArray(dados) ? dados : []; // erro do servidor não pode virar lista inválida
  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro.message || erro);
    return [];
  }
}

export async function criarProduto(produto) {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao cadastrar produto:', erro.message || erro);
    return null;
  }
}

export async function atualizarProduto(id, dados) {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      return { erro: corpo?.erro || `Erro ao editar produto (HTTP ${resposta.status}).` };
    }
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao editar produto:', erro.message || erro);
    return { erro: 'Não foi possível se conectar ao servidor.' };
  }
}

export async function reporEstoque(id, qtd = 1, preco = null) {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos/${id}/repor`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtd, preco }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao repor estoque:', erro.message || erro);
    return null;
  }
}

export async function registrarVenda(id, qtd = 1) {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos/${id}/venda`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtd }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao registrar consumo:', erro.message || erro);
    return null;
  }
}

export async function deletarProduto(id) {
  try {
    const resposta = await fetchApi(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao deletar produto:', erro.message || erro);
    return null;
  }
}

export async function buscarHistorico() {
  try {
    const resposta = await fetchApi(`${API_URL}/historico`);
    const dados = await resposta.json();
    return Array.isArray(dados) ? dados : []; // erro do servidor não pode virar lista inválida
  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro.message || erro);
    return [];
  }
}

export async function limparHistorico() {
  try {
    const resposta = await fetchApi(`${API_URL}/historico`, {
      method: 'DELETE',
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao limpar histórico:', erro.message || erro);
    return null;
  }
}

export async function buscarCategorias() {
  try {
    const resposta = await fetchApi(`${API_URL}/categorias`);
    const dados = await resposta.json();
    return Array.isArray(dados) ? dados : []; // erro do servidor não pode virar lista inválida
  } catch (erro) {
    console.error('Erro ao buscar categorias:', erro.message || erro);
    return [];
  }
}

export async function criarCategoria(nome) {
  try {
    const resposta = await fetchApi(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao cadastrar categoria:', erro.message || erro);
    return null;
  }
}

export async function salvarMetadadosUsuario(dados) {
  try {
    const { error } = await supabase.auth.updateUser({ data: dados });
    if (error) return { erro: error.message };
    return { ok: true };
  } catch (erro) {
    console.error('Erro ao salvar dados do usuário:', erro.message || erro);
    return { erro: 'Não foi possível salvar os dados do usuário.' };
  }
}

// ==========================================
// FUNÇÕES: ENDEREÇOS E AVALIAÇÕES (Via User Metadata)
// ==========================================

export async function buscarEndereco() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.user_metadata?.endereco || null;
  } catch (erro) {
    console.error('Erro ao buscar endereço:', erro);
    return null;
  }
}

export async function salvarEndereco(dadosEndereco) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const enderecoLimpo = {
      cep: dadosEndereco.cep,
      rua: dadosEndereco.rua,
      numero: dadosEndereco.numero,
      sem_numero: dadosEndereco.semNumero,
      bairro: dadosEndereco.bairro,
      cidade: dadosEndereco.cidade,
      estado: dadosEndereco.estado,
      complemento: dadosEndereco.complemento,
      descricao: dadosEndereco.descricao,
      atualizado_em: new Date().toISOString()
    };

    const metadataAtual = user.user_metadata || {};
    const { error } = await supabase.auth.updateUser({
      data: { ...metadataAtual, endereco: enderecoLimpo }
    });

    if (error) throw error;
    enviarParaDrive(URL_API_ENDERECOS, {
      tipo: 'SALVAR_ENDERECO',
      dataAtualizacao: dataHoraBR(),
      usuario: user.email,
      nomeCompleto: user.user_metadata?.nome_completo || '',
      cep: enderecoLimpo.cep,
      rua: enderecoLimpo.rua,
      numero: enderecoLimpo.numero,
      semNumero: !!enderecoLimpo.sem_numero,
      bairro: enderecoLimpo.bairro,
      complemento: enderecoLimpo.complemento,
      descricao: enderecoLimpo.descricao,
      cidade: enderecoLimpo.cidade,
      estado: enderecoLimpo.estado,
    });
    return { dados: enderecoLimpo };
  } catch (erro) {
    console.error('Erro ao salvar endereço:', erro.message || erro);
    return { erro: erro.message || 'Não foi possível salvar o endereço.' };
  }
}

export async function buscarAvaliacao() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.user_metadata?.avaliacao || null;
  } catch (erro) {
    console.error('Erro ao buscar avaliação:', erro);
    return null;
  }
}

export async function salvarAvaliacao(estrelas, comentario) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const novaAvaliacao = {
      estrelas,
      comentario,
      criado_em: new Date().toISOString()
    };

    const metadataAtual = user.user_metadata || {};
    const { error } = await supabase.auth.updateUser({
      data: { ...metadataAtual, avaliacao: novaAvaliacao }
    });

    if (error) throw error;
    enviarParaDrive(URL_API_AVALIACOES, {
      tipo: 'SALVAR_AVALIACAO',
      usuario: user.email,
      estrelas,
      comentario,
      data: dataHoraBR(),
    });
    return { dados: novaAvaliacao };
  } catch (erro) {
    console.error('Erro ao salvar avaliação:', erro.message || erro);
    return { erro: erro.message || 'Não foi possível salvar a avaliação.' };
  }
}

export async function deletarAvaliacao() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    // updateUser faz merge das chaves: para remover, é preciso enviar null
    const { error } = await supabase.auth.updateUser({
      data: { avaliacao: null }
    });

    if (error) throw error;
    enviarParaDrive(URL_API_AVALIACOES, {
      tipo: 'DELETAR_AVALIACAO',
      usuario: user.email,
    });
    return { ok: true };
  } catch (erro) {
    console.error('Erro ao excluir avaliação:', erro.message || erro);
    return { erro: erro.message || 'Não foi possível excluir a avaliação.' };
  }
}