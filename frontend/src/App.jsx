import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import HistoricoGeral from './pages/HistoricoGeral';
import Ajuda from './pages/Ajuda';
import Configuracoes from './pages/Configuracoes';
import AssistenteIA from './components/AssistenteIA';
import CentralComunicados from './components/CentralComunicados';
import Auth, { abriuPorLinkDeRecuperacao } from './components/Auth';
import { 
  supabase, 
  buscarProdutos, 
  buscarHistorico, 
  criarProduto, 
  atualizarProduto,
  reporEstoque, 
  registrarVenda, 
  deletarProduto, 
  buscarCategorias, 
  criarCategoria 
} from './services/api';

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
  const [centralComunicadosAberta, setCentralComunicadosAberta] = useState(false);

  const [sessao, setSessao] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  const [recuperandoSenha, setRecuperandoSenha] = useState(abriuPorLinkDeRecuperacao);
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

  // Estado para armazenar o nome da residência personalizado
  const [nomeResidencia, setNomeResidencia] = useState(() => {
    try {
      const salvo = localStorage.getItem('nomeResidencia');
      return salvo || 'Despensa em Casa';
    } catch {
      return 'Despensa em Casa';
    }
  });

  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Busca também os dados complementares da tabela 'perfis' (CPF, Nome Completo, Nome de Usuário, etc)
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (perfilData) {
          session.user.user_metadata = {
            ...session.user.user_metadata,
            nome_completo: perfilData.nome_completo || session.user.user_metadata?.nome_completo,
            nome_usuario: perfilData.nome_usuario || session.user.user_metadata?.nome_usuario,
            nomeUsuario: perfilData.nome_usuario || session.user.user_metadata?.nomeUsuario,
            cpf: perfilData.cpf || session.user.user_metadata?.cpf
          };
        }
      }
      setSessao(session);
      if (session?.user?.user_metadata?.limiteEstoqueBaixo) {
        setLimiteEstoqueBaixo(Number(session.user.user_metadata.limiteEstoqueBaixo));
      }
      setVerificandoSessao(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      if (session?.user) {
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (perfilData) {
          session.user.user_metadata = {
            ...session.user.user_metadata,
            nome_completo: perfilData.nome_completo || session.user.user_metadata?.nome_completo,
            nome_usuario: perfilData.nome_usuario || session.user.user_metadata?.nome_usuario,
            nomeUsuario: perfilData.nome_usuario || session.user.user_metadata?.nomeUsuario,
            cpf: perfilData.cpf || session.user.user_metadata?.cpf
          };
        }
      }
      setSessao(session);
      if (session?.user?.user_metadata?.limiteEstoqueBaixo) {
        setLimiteEstoqueBaixo(Number(session.user.user_metadata.limiteEstoqueBaixo));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function carregarDadosGlobais() {
      if (!sessao || recuperandoSenha) {
        setCarregando(false);
        return;
      }
      try {
        setCarregando(true);
        const [dadosProdutos, dadosHistorico, dadosCategorias] = await Promise.all([
          buscarProdutos(),
          buscarHistorico(),
          buscarCategorias()
        ]);
        setProdutos(dadosProdutos || []);
        setHistorico(dadosHistorico || []);
        setCategorias(dadosCategorias || []);
      } catch (erro) {
        console.error('Erro ao carregar dados globais:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDadosGlobais();
  }, [sessao, recuperandoSenha]);

  const handleAtualizarRecursos = (novosRecursos) => {
    setRecursosAtivos(novosRecursos);
    try { localStorage.setItem('recursosAtivos', JSON.stringify(novosRecursos)); } catch {}
  };

  const handleAtualizarResidencia = (novaResidencia) => {
    if (novaResidencia.nomeResidencia !== undefined) {
      setNomeResidencia(novaResidencia.nomeResidencia);
      try { localStorage.setItem('nomeResidencia', novaResidencia.nomeResidencia); } catch {}
    }
    if (novaResidencia.limiteEstoqueBaixo !== undefined) {
      setLimiteEstoqueBaixo(novaResidencia.limiteEstoqueBaixo);
      try { localStorage.setItem('limiteEstoqueBaixo', novaResidencia.limiteEstoqueBaixo); } catch {}
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
            ...novosDadosPerfil,
            nomeUsuario: novosDadosPerfil.nome_usuario || novosDadosPerfil.nomeUsuario || sessao.user.user_metadata?.nomeUsuario
          } 
        }
      });
    }
  };

  const handleAtualizarConfiguracoesSistema = (novasConfig) => {
    if (novasConfig.limiteEstoqueBaixo !== undefined) {
      setLimiteEstoqueBaixo(novasConfig.limiteEstoqueBaixo);
    }
    if (novasConfig.exibirIA !== undefined || novasConfig.exibirModoEscuro !== undefined || novasConfig.exibirSairConta !== undefined) {
      const atualizados = {
        exibirIA: novasConfig.exibirIA ?? recursosAtivos.exibirIA,
        exibirModoEscuro: novasConfig.exibirModoEscuro ?? recursosAtivos.exibirModoEscuro,
        exibirSairConta: novasConfig.exibirSairConta ?? recursosAtivos.exibirSairConta
      };
      setRecursosAtivos(atualizados);
      try { localStorage.setItem('recursosAtivos', JSON.stringify(atualizados)); } catch {}
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); } catch (e) {}
  }, [darkMode]);

  const alternarTema = () => setDarkMode(atual => !atual);

  // Handlers operacionais
  const handleCriarProduto = async (novoProduto) => {
    const resultado = await criarProduto(novoProduto);
    if (resultado && !resultado.erro) {
      setProdutos(prev => [...prev, resultado]);
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return resultado;
  };

  const handleEditarProduto = async (id, dados) => {
    const atualizado = await atualizarProduto(id, dados);
    if (atualizado && !atualizado.erro) {
      setProdutos(prev => prev.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return atualizado;
  };

  const handleRepor = async (id, qtd, preco) => {
    const atualizado = await reporEstoque(id, qtd, preco);
    if (atualizado && !atualizado.erro) {
      setProdutos(prev => prev.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return atualizado;
  };

  const handleConsumo = async (id, qtd) => {
    const atualizado = await registrarVenda(id, qtd);
    if (atualizado && !atualizado.erro) {
      setProdutos(prev => prev.map(p => p.id === id ? atualizado : p));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return atualizado;
  };

  const handleExcluir = async (id) => {
    const resposta = await deletarProduto(id);
    if (resposta && !resposta.erro) {
      setProdutos(prev => prev.filter(p => p.id !== id));
      const novoHistorico = await buscarHistorico();
      setHistorico(novoHistorico || []);
    }
    return resposta;
  };

  const handleCriarCategoria = async (nomeCat) => {
    const res = await criarCategoria(nomeCat);
    if (res && !res.erro) {
      setCategorias(prev => [...prev, res].sort((a, b) => a.nome.localeCompare(b.nome)));
    }
    return res;
  };

  if (verificandoSessao) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 font-medium">
        Verificando acesso ao GestãoFácil...
      </div>
    );
  }

  if (!sessao || recuperandoSenha) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <Auth
          modoInicial={recuperandoSenha ? 'nova-senha' : 'login'}
          onLoginSucesso={(user) => setSessao({ user })}
          onSenhaAtualizada={() => setRecuperandoSenha(false)}
        />
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500 font-medium">
        Carregando dados do usuário...
      </div>
    );
  }

  const classeBotaoMenu = (ativo) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      ativo ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const acoesAppParaIA = {
    onCriarProduto: handleCriarProduto,
    onEditarProduto: handleEditarProduto,
    onReporEstoque: handleRepor,
    onConsumirEstoque: handleConsumo,
    onDeletarProduto: handleExcluir,
    onCriarCategoria: handleCriarCategoria,
    onNavegar: (tela) => setTelaAtiva(tela),
    onAtualizarConfiguracoes: handleAtualizarConfiguracoesSistema
  };

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

      {/* Navegação Lateral (Sidebar) */}
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
                <p className="text-xs text-slate-400">{nomeResidencia}</p>
              </div>
            </div>
            <button onClick={() => setSidebarAberta(false)} className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 transition">◀</button>
          </div>

          <nav className="space-y-2">
            <button onClick={() => { setTelaAtiva('dashboard'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'dashboard')}><span>📊</span> Dashboard</button>
            <button onClick={() => { setTelaAtiva('produtos'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'produtos')}><span>🍎</span> Itens e Estoque</button>
            <button onClick={() => { setTelaAtiva('relatorios'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'relatorios')}><span>📈</span> Relatórios</button>
            <button onClick={() => { setTelaAtiva('historico'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'historico')}><span>🔔</span> Histórico Geral</button>
            <button onClick={() => { setTelaAtiva('ajuda'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'ajuda')}><span>❓</span> Ajuda</button>
            <button onClick={() => { setTelaAtiva('configuracoes'); setSidebarAberta(false); }} className={classeBotaoMenu(telaAtiva === 'configuracoes')}><span>⚙️</span> Configurações</button>
          </nav>
        </div>

        <div className="space-y-2">
          {recursosAtivos.exibirModoEscuro && (
            <button onClick={alternarTema} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition">
              {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
            </button>
          )}
          {recursosAtivos.exibirSairConta && (
            <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition">
              🚪 Sair da Conta
            </button>
          )}
          <div className="text-xs text-slate-500 text-center border-t border-slate-800 pt-3 mt-2">Projeto Extensão - TSI</div>
        </div>
      </aside>

      {sidebarAberta && <div onClick={() => setSidebarAberta(false)} className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" />}

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
        {telaAtiva === 'dashboard' && (
          <Dashboard 
            produtos={produtos} 
            historico={historico} 
            perfilUsuario={sessao.user.user_metadata} 
            onAbrirCentralNotificacoes={() => setCentralComunicadosAberta(true)}
          />
        )}

        {telaAtiva === 'produtos' && (
          <Produtos 
            produtos={produtos} 
            categorias={categorias}
            onCriar={handleCriarProduto} 
            onEditar={handleEditarProduto}
            onRepor={handleRepor} 
            onConsumo={handleConsumo} 
            onExcluir={handleExcluir} 
            onCriarCategoria={handleCriarCategoria}
          />
        )}
        {telaAtiva === 'relatorios' && <Relatorios produtos={produtos} limiteEstoqueBaixo={limiteEstoqueBaixo} />}
        {telaAtiva === 'historico' && <HistoricoGeral historicoInicial={historico} />}
        {telaAtiva === 'ajuda' && <Ajuda />}
        {telaAtiva === 'configuracoes' && (
          <Configuracoes 
            perfilUsuario={{ ...sessao.user.user_metadata, limiteEstoqueBaixo, nomeResidencia }} 
            recursosAtivos={recursosAtivos} 
            onAtualizarRecursos={handleAtualizarRecursos}
            onAtualizarResidencia={handleAtualizarResidencia}
            onAtualizarPerfil={handleAtualizarPerfil}
            alternarTema={alternarTema}
            darkMode={darkMode}
            onAbrirCentralNotificacoes={() => setCentralComunicadosAberta(true)}
          />
        )}
      </main>

      {/* Assistente Flutuante de IA */}
      {recursosAtivos.exibirIA && (
        <AssistenteIA 
          produtos={produtos} 
          categorias={categorias}
          historico={historico}
          acoesApp={acoesAppParaIA}
        />
      )}

      {/* Gaveta da Central de Comunicados do Sistema */}
      <CentralComunicados
        aberto={centralComunicadosAberta}
        onFechar={() => setCentralComunicadosAberta(false)}
        usuarioEmail={sessao?.user?.email}
      />
    </div>
  );
}