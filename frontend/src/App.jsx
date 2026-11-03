import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import HistoricoGeral from './pages/HistoricoGeral';
import Ajuda from './pages/Ajuda';
import AssistenteIA from './components/AssistenteIA'; // <--- Importação do Assistente Inteligente
import { buscarProdutos, buscarHistorico, criarProduto, reporEstoque, registrarVenda, deletarProduto } from './services/api';

// Lê a preferência salva; se não houver, usa a preferência do sistema operacional
function temaInicialEscuro() {
  try {
    const salvo = localStorage.getItem('theme');
    if (salvo) return salvo === 'dark';
  } catch (e) {
    // localStorage indisponível: segue para o padrão do sistema
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('dashboard');

  // Estado para controlar se a barra lateral está aberta ou fechada em celulares/telas menores
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Modo escuro
  const [darkMode, setDarkMode] = useState(temaInicialEscuro);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    } catch (e) {
      // ignora falha ao salvar
    }
  }, [darkMode]);

  const alternarTema = () => setDarkMode((atual) => !atual);

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
        Carregando sistema GestãoFácil...
      </div>
    );
  }

  const classeBotaoMenu = (ativo) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      ativo ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 relative transition-colors duration-200">

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
              className={classeBotaoMenu(telaAtiva === 'dashboard')}
            >
              <span>📊</span> Dashboard
            </button>

            <button
              onClick={() => { setTelaAtiva('produtos'); setSidebarAberta(false); }}
              className={classeBotaoMenu(telaAtiva === 'produtos')}
            >
              <span>🍎</span> Itens e Estoque
            </button>

            <button
              onClick={() => { setTelaAtiva('relatorios'); setSidebarAberta(false); }}
              className={classeBotaoMenu(telaAtiva === 'relatorios')}
            >
              <span>📈</span> Relatórios
            </button>

            <button
              onClick={() => { setTelaAtiva('historico'); setSidebarAberta(false); }}
              className={classeBotaoMenu(telaAtiva === 'historico')}
            >
              <span>🔔</span> Histórico Geral
            </button>

            <button
              onClick={() => { setTelaAtiva('ajuda'); setSidebarAberta(false); }}
              className={classeBotaoMenu(telaAtiva === 'ajuda')}
            >
              <span>❓</span> Ajuda
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {/* Alternador de tema */}
          <button
            onClick={alternarTema}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition"
            title="Alternar modo escuro"
            aria-pressed={darkMode}
          >
            {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
          </button>

          <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4">
            Projeto Extensão - TSI
          </div>
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
        {telaAtiva === 'produtos' && ( // Nota: mantido telaAtiva === 'produtos'
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
        {telaAtiva === 'ajuda' && <Ajuda />}
      </main>

      {/* Componente Flutuante do Assistente de Inteligência Artificial */}
      <AssistenteIA produtos={produtos} />

    </div>
  );
}