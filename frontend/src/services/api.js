import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://baukinwjwktzcsmpvcka.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dm9fZ0459USH7rGlDzGE1w_8-apyI2l';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API_URL = 'https://sistema-extensao-estoque.onrender.com/api';

export async function buscarProdutos() {
  try {
    const resposta = await fetch(`${API_URL}/produtos`);
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro);
    return [];
  }
}

export async function criarProduto(produto) {
  try {
    const resposta = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao cadastrar produto:', erro);
    return null;
  }
}

export async function atualizarProduto(id, dados) {
  try {
    const resposta = await fetch(`${API_URL}/produtos/${id}`, {
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
    console.error('Erro ao editar produto:', erro);
    return { erro: 'Não foi possível se conectar ao servidor.' };
  }
}

export async function reporEstoque(id, qtd = 1, preco = null) {
  try {
    const resposta = await fetch(`${API_URL}/produtos/${id}/repor`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtd, preco }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao repor estoque:', erro);
    return null;
  }
}

export async function registrarVenda(id, qtd = 1) {
  try {
    const resposta = await fetch(`${API_URL}/produtos/${id}/venda`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtd }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao registrar consumo:', erro);
    return null;
  }
}

export async function deletarProduto(id) {
  try {
    const resposta = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao deletar produto:', erro);
    return null;
  }
}

export async function buscarHistorico() {
  try {
    const resposta = await fetch(`${API_URL}/historico`);
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro);
    return [];
  }
}

export async function limparHistorico() {
  try {
    const resposta = await fetch(`${API_URL}/historico`, {
      method: 'DELETE',
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao limpar histórico:', erro);
    return null;
  }
}

export async function buscarCategorias() {
  try {
    const resposta = await fetch(`${API_URL}/categorias`);
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar categorias:', erro);
    return [];
  }
}

export async function criarCategoria(nome) {
  try {
    const resposta = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao cadastrar categoria:', erro);
    return null;
  }
}

export async function salvarMetadadosUsuario(dados) {
  try {
    const { error } = await supabase.auth.updateUser({ data: dados });
    if (error) return { erro: error.message };
    return { ok: true };
  } catch (erro) {
    console.error('Erro ao salvar dados do usuário:', erro);
    return { erro: 'Não foi possível salvar os dados do usuário.' };
  }
}