import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import HistoricoGeral from './pages/HistoricoGeral';
import { buscarProdutos, buscarHistorico, criarProduto, reporEstoque, registrarVenda, deletarProduto } from './services/api';

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  
  // Estado para controlar se a barra lateral está aberta ou fechada em celulares/telas menores
  const [sidebarAberta, setSidebarAberta] = useState(false);
  
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
    <div className="flex min-h-screen bg-gray-50 text-gray-800 relative">
      
      {/* Botão flutuante para abrir o menu em telas pequenas caso ele esteja fechado */}
      {!sidebarAberta && (
        <button
          onClick={() => setSidebarAberta(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center justify-center"
          title="Abrir Menu"
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Menu Lateral Esquerdo */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static
        ${sidebarAberta ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">GestãoFácil</h2>
                <p className="text-xs text-slate-400">Despensa em Casa</p>
              </div>
            </div>
            
            {/* Botão de fechar (seta) ao lado direito de GestãoFácil */}
            <button
              onClick={() => setSidebarAberta(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition"
              title="Fechar Menu"
            >
              ◀
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => { setTelaAtiva('dashboard'); setSidebarAberta(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => { setTelaAtiva('produtos'); setSidebarAberta(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'produtos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>🍎</span> Itens e Estoque
            </button>

            <button
              onClick={() => { setTelaAtiva('relatorios'); setSidebarAberta(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                telaAtiva === 'relatorios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📈</span> Relatórios
            </button>

            <button
              onClick={() => { setTelaAtiva('historico'); setSidebarAberta(false); }}
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

      {/* Fundo escurecido ao abrir o menu no celular */}
      {sidebarAberta && (
        <div 
          onClick={() => setSidebarAberta(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
        />
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
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