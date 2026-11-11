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
    console.error('Erro ao buscar produtos:', erro.message || erro);
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
    console.error('Erro ao cadastrar produto:', erro.message || erro);
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
    console.error('Erro ao editar produto:', erro.message || erro);
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
    console.error('Erro ao repor estoque:', erro.message || erro);
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
    console.error('Erro ao registrar consumo:', erro.message || erro);
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
    console.error('Erro ao deletar produto:', erro.message || erro);
    return null;
  }
}

export async function buscarHistorico() {
  try {
    const resposta = await fetch(`${API_URL}/historico`);
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar histórico:', erro.message || erro);
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
    console.error('Erro ao limpar histórico:', erro.message || erro);
    return null;
  }
}

export async function buscarCategorias() {
  try {
    const resposta = await fetch(`${API_URL}/categorias`);
    return await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar categorias:', erro.message || erro);
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
// FUNÇÕES SUPABASE: ENDEREÇOS E AVALIAÇÕES
// ==========================================

export async function buscarEndereco() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('enderecos')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (erro) {
    console.error('Erro ao buscar endereço no Supabase:', erro.message || JSON.stringify(erro));
    return null;
  }
}

export async function salvarEndereco(dadosEndereco) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const payload = {
      user_id: user.id,
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

    const { data, error } = await supabase
      .from('enderecos')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return { dados: data };
  } catch (erro) {
    console.error('Erro ao salvar endereço no Supabase:', erro.message || JSON.stringify(erro));
    return { erro: erro.message || 'Não foi possível salvar o endereço.' };
  }
}

export async function buscarAvaliacao() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch (erro) {
    console.error('Erro ao buscar avaliação no Supabase:', erro.message || JSON.stringify(erro));
    return null;
  }
}

export async function salvarAvaliacao(estrelas, comentario) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const existente = await buscarAvaliacao();
    let res;

    if (existente) {
      res = await supabase
        .from('avaliacoes')
        .update({ estrelas, comentario, criado_em: new Date().toISOString() })
        .eq('id', existente.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from('avaliacoes')
        .insert({ user_id: user.id, estrelas, comentario })
        .select()
        .single();
    }

    if (res.error) throw res.error;
    return { dados: res.data };
  } catch (erro) {
    console.error('Erro ao salvar avaliação no Supabase:', erro.message || JSON.stringify(erro));
    return { erro: erro.message || 'Não foi possível salvar a avaliação.' };
  }
}

export async function deletarAvaliacao() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { erro: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('avaliacoes')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    return { ok: true };
  } catch (erro) {
    console.error('Erro ao excluir avaliação no Supabase:', erro.message || JSON.stringify(erro));
    return { erro: erro.message || 'Não foi possível excluir a avaliação.' };
  }
}