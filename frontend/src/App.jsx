import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import HistoricoGeral from './pages/HistoricoGeral';
import Ajuda from './pages/Ajuda';
import Configuracoes from './pages/Configuracoes';
import AssistenteIA from './components/AssistenteIA';
import Auth from './components/Auth';
import { supabase, buscarProdutos, buscarHistorico, criarProduto, reporEstoque, registrarVenda, deletarProduto } from './services/api';

function temaInicialEscuro() {
  try {
    const salvo = localStorage.getItem('theme');
    if (salvo) return salvo === 'dark';
  } catch (e) {}
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('dashboard');
  const [sidebarAberta, setSidebarAberta] = useState(false);
  
  const [sessao, setSessao] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const [darkMode, setDarkMode] = useState(temaInicialEscuro);

  const [recursosAtivos, setRecursosAtivos] = useState(() => {
    try {
      const salvo = localStorage.getItem('recursosAtivos');
      return salvo ? JSON.parse(salvo) : { exibirIA: true, exibirModoEscuro: true, exibirSairConta: true };
    } catch {
      return { exibirIA: true, exibirModoEscuro: true, exibirSairConta: true };
    }
  });

  const [limiteEstoqueBaixo, setLimiteEstoqueBaixo] = useState(() => {
    try {
      const salvo = localStorage.getItem('limiteEstoqueBaixo');
      return salvo ? Number(salvo) : 3;
    } catch {
      return 3;
    }
  });

  const handleAtualizarRecursos = (novosRecursos) => {
    setRecursosAtivos(novosRecursos);
    try {
      localStorage.setItem('recursosAtivos', JSON.stringify(novosRecursos));
    } catch {}
  };

  const handleAtualizarResidencia = (novaResidencia) => {
    if (novaResidencia.limiteEstoqueBaixo !== undefined) {
      setLimiteEstoqueBaixo(novaResidencia.limiteEstoqueBaixo);
      try {
        localStorage.setItem('limiteEstoqueBaixo', novaResidencia.limiteEstoqueBaixo);
      } catch {}
    }
  };

  const handleAtualizarPerfil = (novosDadosPerfil) => {
    if (sessao && sessao.user) {
      setSessao({
        ...sessao,
        user: {
          ...sessao.user,
          user_metadata: {
            ...sessao.user.user_metadata,
            ...novosDadosPerfil
          }
        }
      });
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    } catch (e) {}
  }, [darkMode]);

  const alternarTema = () => setDarkMode((atual) => !atual);

  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      if (session?.user?.user_metadata?.limiteEstoqueBaixo) {
        setLimiteEstoqueBaixo(Number(session.user.user_metadata.limiteEstoqueBaixo));
      }
      setVerificandoSessao(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (session?.user?.user_metadata?.limiteEstoqueBaixo) {
        setLimiteEstoqueBaixo(Number(session.user.user_metadata.limiteEstoqueBaixo));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function carregarDadosGlobais() {
      if (!sessao) {
        setCarregando(false);
        return;
      }
      try {
        setCarregando(true);
        const [dadosProdutos, dadosHistorico] = await Promise.all([
          buscarProdutos(),
          buscarHistorico()
        ]);
        setProdutos(dadosProdutos || []);
        setHistorico(dadosHistorico || []);
      } catch (erro) {
        console.error('Erro ao carregar dados globais:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDadosGlobais();
  }, [sessao]);

  const handleCriarProduto = async (novoProduto) => {
    const resultado = await criarProduto(novoProduto);
    if (resultado && !resultado.erro) {
      setProdutos([...produtos, resultado]);
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return resultado;
  };

  const handleRepor = async (id, qtd, preco) => {
    const atualizado = await reporEstoque(id, qtd, preco);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return atualizado;
  };

  const handleConsumo = async (id, qtd) => {
    const atualizado = await registrarVenda(id, qtd);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
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

  if (verificandoSessao) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
        Verificando acesso ao GestãoFácil...
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Auth onLoginSucesso={(user) => setSessao({ user })} />
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 font-medium">
        Carregando dados do usuário...
      </div>
    );
  }

  const classeBotaoMenu = (ativo) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      ativo ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 relative transition-colors duration-200">

      {!sidebarAberta && (
        <button
          onClick={() => setSidebarAberta(true)}
          className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2.5 rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center justify-center"
          title="Abrir Menu"
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:sticky md:top-0 md:h-screen
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

            <button
              onClick={() => setSidebarAberta(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition"
              title="Fechar Menu"
            >
              ◀
            </button>
          </div>

          <nav className="space-y-2">
            <button onClick={() => { setTelaAtiva('dashboard'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'dashboard')}>
              <span>📊</span> Dashboard
            </button>
            <button onClick={() => { setTelaAtiva('produtos'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'produtos')}>
              <span>🍎</span> Itens e Estoque
            </button>
            <button onClick={() => { setTelaAtiva('relatorios'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'relatorios')}>
              <span>📈</span> Relatórios
            </button>
            <button onClick={() => { setTelaAtiva('historico'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'historico')}>
              <span>🔔</span> Histórico Geral
            </button>
            <button onClick={() => { setTelaAtiva('ajuda'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'ajuda')}>
              <span>❓</span> Ajuda
            </button>
            <button onClick={() => { setTelaAtiva('configuracoes'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'configuracoes')}>
              <span>⚙️</span> Configurações
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {recursosAtivos.exibirModoEscuro && (
            <button
              onClick={alternarTema}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition"
              title="Alternar modo escuro"
            >
              {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
            </button>
          )}

          {recursosAtivos.exibirSairConta && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition"
            >
              🚪 Sair da Conta
            </button>
          )}

          <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-4">
            Projeto Extensão - TSI
          </div>
        </div>
      </aside>

      {sidebarAberta && (
        <div onClick={() => setSidebarAberta(false)} className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" />
      )}

      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
        {telaAtiva === 'dashboard' && <Dashboard produtos={produtos} historico={historico} perfilUsuario={sessao.user.user_metadata} />}
        {telaAtiva === 'produtos' && (
          <Produtos produtos={produtos} onCriar={handleCriarProduto} onRepor={handleRepor} onConsumo={handleConsumo} onExcluir={handleExcluir} />
        )}
        {telaAtiva === 'relatorios' && <Relatorios produtos={produtos} limiteEstoqueBaixo={limiteEstoqueBaixo} />}
        {telaAtiva === 'historico' && <HistoricoGeral historicoInicial={historico} />}
        {telaAtiva === 'ajuda' && <Ajuda />}
        {telaAtiva === 'configuracoes' && (
          <Configuracoes 
            perfilUsuario={{ ...sessao.user.user_metadata, limiteEstoqueBaixo }} 
            recursosAtivos={recursosAtivos} 
            onAtualizarRecursos={handleAtualizarRecursos}
            onAtualizarResidencia={handleAtualizarResidencia}
            onAtualizarPerfil={handleAtualizarPerfil}
            alternarTema={alternarTema}
            darkMode={darkMode}
          />
        )}
      </main>

      {recursosAtivos.exibirIA && <AssistenteIA produtos={produtos} />}

    </div>
  );
}