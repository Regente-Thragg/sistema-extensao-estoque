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