import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import HistoricoGeral from './pages/HistoricoGeral';
import { buscarProdutos, buscarHistorico, criarProduto, reporEstoque, registrarVenda, deletarProduto } from './services/api';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  
  // Estados globais centralizados na aplicação
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Carrega os dados do servidor APENAS UMA VEZ quando a aplicação inicia
  useEffect(() => {
    async function carregarDadosGlobais() {
      try {
        const [dadosProdutos, dadosHistorico] = await Promise.all([
          buscarProdutos(),
          buscarHistorico()
        ]);
        setProdutos(dadosProdutos);
        setHistorico(dadosHistorico);
      } catch (erro) {
        console.error('Erro ao carregar dados globais:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDadosGlobais();
  }, []);

  // Funções de ação que atualizam o banco e sincronizam o estado global instantaneamente
  const handleCriarProduto = async (novoProduto) => {
    const resultado = await criarProduto(novoProduto);
    if (resultado && !resultado.erro) {
      setProdutos([...produtos, resultado]);
      // Atualiza também o histórico global buscando novamente ou adicionando
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico);
    }
    return resultado;
  };

  const handleRepor = async (id, qtd, preco) => {
    const atualizado = await reporEstoque(id, qtd, preco);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico);
    }
    return atualizado;
  };

  const handleConsumo = async (id, qtd) => {
    const atualizado = await registrarVenda(id, qtd);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico);
    }
    return atualizado;
  };

  const handleExcluir = async (id) => {
    const resposta = await deletarProduto(id);
    if (resposta && !resposta.erro) {
      setProdutos(produtos.filter(p => p.id !== id));
    }
    return resposta;
  };

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500 font-medium">
        Carregando sistema GestãoFácil...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Menu Lateral Esquerdo */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-white">GestãoFácil</h2>
              <p className="text-xs text-slate-400">Despensa em Casa</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setTelaAtiva('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => setTelaAtiva('produtos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'produtos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🍎</span> Itens e Estoque
            </button>

            <button
              onClick={() => setTelaAtiva('relatorios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'relatorios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📈</span> Relatórios
            </button>

            <button
              onClick={() => setTelaAtiva('historico')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'historico' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🔔</span> Histórico Geral
            </button>
          </nav>
        </div>

        <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4">
          Projeto Extensão - TSI
        </div>
      </aside>

      {/* Conteúdo Principal enviando os dados em memória (sem refetch ao trocar de aba) */}
      <main className="flex-1 overflow-y-auto">
        {telaAtiva === 'dashboard' && <Dashboard produtos={produtos} historico={historico} />}
        {telaAtiva === 'produtos' && (
          <Produtos 
            produtos={produtos} 
            onCriar={handleCriarProduto} 
            onRepor={handleRepor} 
            onConsumo={handleConsumo} 
            onExcluir={handleExcluir} 
          />
        )}
        {telaAtiva === 'relatorios' && <Relatorios produtos={produtos} />}
        {telaAtiva === 'historico' && <HistoricoGeral historicoInicial={historico} />}
      </main>
    </div>
  );
}