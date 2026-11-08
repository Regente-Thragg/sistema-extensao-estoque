import React, { useState, useRef, useEffect } from 'react';

function EstrelasIA() {
  const caminho = 'M12 0C12.6 6.5 17.5 11.4 24 12C17.5 12.6 12.6 17.5 12 24C11.4 17.5 6.5 12.6 0 12C6.5 11.4 11.4 6.5 12 0Z';
  const estrelas = [
    { tamanho: 17, esquerda: 0, topo: 11, atraso: '0s' },
    { tamanho: 12, esquerda: 15, topo: 0, atraso: '0.4s' },
    { tamanho: 8, esquerda: 18, topo: 17, atraso: '0.8s' },
  ];

  return (
    <span className="relative inline-block shrink-0" style={{ width: 28, height: 28 }} aria-hidden="true">
      <style>{`
        @keyframes gf-estrela-ia {
          0%, 100% { transform: scale(0.5) rotate(0deg);  opacity: 0.35; }
          35%      { transform: scale(1.2) rotate(45deg); opacity: 1; }
          70%      { transform: scale(0.8) rotate(90deg); opacity: 0.7; }
        }
        .gf-estrela-ia { animation: gf-estrela-ia 2s ease-in-out infinite; transform-origin: center; }
      `}</style>
      {estrelas.map((e, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="gf-estrela-ia absolute"
          style={{ width: e.tamanho, height: e.tamanho, left: e.esquerda, top: e.topo, animationDelay: e.atraso }}
        >
          <path d={caminho} />
        </svg>
      ))}
    </span>
  );
}

const GEMINI_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELO_PRINCIPAL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-latest';
const MODELOS_RESERVA = ['gemini-3.1-flash-lite'];

// Definição das ferramentas (Function Declarations) nativas do Gemini
const declarations = [
  {
    name: "cadastrarProduto",
    description: "Cadastra um novo produto na despensa.",
    parameters: {
      type: "OBJECT",
      properties: {
        nome: { type: "STRING", description: "Nome do produto" },
        categoria: { type: "STRING", description: "Categoria do produto (ex: Alimentos, Limpeza, Bebidas)" },
        qtd: { type: "NUMBER", description: "Quantidade em unidades" },
        preco: { type: "NUMBER", description: "Preço unitário em reais" },
        validade: { type: "STRING", description: "Data de validade no formato YYYY-MM-DD (opcional)" }
      },
      required: ["nome", "categoria", "qtd", "preco"]
    }
  },
  {
    name: "reporEstoque",
    description: "Repõe a quantidade de um produto existente no estoque.",
    parameters: {
      type: "OBJECT",
      properties: {
        nomeOuId: { type: "STRING", description: "Nome ou ID do produto" },
        qtd: { type: "NUMBER", description: "Quantidade a adicionar (padrão 1)" },
        preco: { type: "NUMBER", description: "Novo preço unitário caso tenha mudado (opcional)" }
      },
      required: ["nomeOuId"]
    }
  },
  {
    name: "consumirEstoque",
    description: "Registra consumo/baixa de unidades de um produto.",
    parameters: {
      type: "OBJECT",
      properties: {
        nomeOuId: { type: "STRING", description: "Nome ou ID do produto" },
        qtd: { type: "NUMBER", description: "Quantidade a consumir (padrão 1)" }
      },
      required: ["nomeOuId"]
    }
  },
  {
    name: "editarProduto",
    description: "Edita os dados de um produto existente (nome, categoria, preço, validade).",
    parameters: {
      type: "OBJECT",
      properties: {
        nomeOuId: { type: "STRING", description: "Nome atual ou ID do produto" },
        novoNome: { type: "STRING", description: "Novo nome (opcional)" },
        categoria: { type: "STRING", description: "Nova categoria (opcional)" },
        preco: { type: "NUMBER", description: "Novo preço (opcional)" },
        validade: { type: "STRING", description: "Nova validade YYYY-MM-DD (opcional)" }
      },
      required: ["nomeOuId"]
    }
  },
  {
    name: "solicitarExclusaoProduto",
    description: "Inicia o processo de exclusão de um produto, exigindo confirmação do usuário.",
    parameters: {
      type: "OBJECT",
      properties: {
        nomeOuId: { type: "STRING", description: "Nome ou ID do produto a excluir" }
      },
      required: ["nomeOuId"]
    }
  },
  {
    name: "criarCategoria",
    description: "Cria uma nova categoria no sistema.",
    parameters: {
      type: "OBJECT",
      properties: { nome: { type: "STRING", description: "Nome da nova categoria" } },
      required: ["nome"]
    }
  },
  {
    name: "navegarTela",
    description: "Navega para uma tela específica do aplicativo (dashboard, produtos, relatorios, historico, ajuda, configuracoes).",
    parameters: {
      type: "OBJECT",
      properties: { tela: { type: "STRING", description: "Nome da tela: dashboard, produtos, relatorios, historico, ajuda, configuracoes" } },
      required: ["tela"]
    }
  },
  {
    name: "atualizarConfiguracoesSistema",
    description: "Atualiza preferências e configurações do sistema (modo escuro, limite de estoque baixo, exibição de recursos).",
    parameters: {
      type: "OBJECT",
      properties: {
        limiteEstoqueBaixo: { type: "NUMBER", description: "Novo limite numérico para alerta de estoque baixo" },
        nomeResidencia: { type: "STRING", description: "Novo nome da residência ou projeto" },
        exibirIA: { type: "BOOLEAN", description: "Exibir ou ocultar o botão flutuante da IA" },
        exibirModoEscuro: { type: "BOOLEAN", description: "Exibir ou ocultar botão de modo escuro" },
        exibirSairConta: { type: "BOOLEAN", description: "Exibir ou ocultar botão de sair da conta" }
      }
    }
  }
];

export default function AssistenteIA({ 
  produtos, 
  categorias, 
  historico, 
  acoesApp 
}) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { 
      remetente: 'ia', 
      texto: 'Olá! Sou seu assistente inteligente do GestãoFácil. Posso gerenciar estoque, categorias, navegar entre telas, alterar configurações e tirar dúvidas. O que deseja fazer?' 
    }
  ]);
  
  const [entradaTexto, setEntradaTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState(null);

  // Histórico de conversa estruturado para a API do Gemini (suporta memória multi-turn)
  const historicoGeminiRef = useRef([
    {
      role: 'user',
      parts: [{ text: 'Sistema inicializado. Contexto pronto.' }]
    },
    {
      role: 'model',
      parts: [{ text: 'Entendido. Estou pronto para ajudar com o GestãoFácil.' }]
    }
  ]);

  const mensagensFimRef = useRef(null);

  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const iniciarOuvido = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setOuvindo(true);
    recognition.onresult = (event) => {
      setEntradaTexto(event.results[0][0].transcript);
      setOuvindo(false);
    };
    recognition.onerror = () => setOuvindo(false);
    recognition.onend = () => setOuvindo(false);
    recognition.start();
  };

  const handleAnexarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      const leitor = new FileReader();
      leitor.onloadend = () => {
        setArquivoAnexado({ nome: arquivo.name, tipo: arquivo.type, dados: leitor.result });
      };
      leitor.readAsDataURL(arquivo);
    }
  };

  // Executa localmente as funções chamadas pela IA
  const executarFuncaoLocal = async (nomeFuncao, args) => {
    try {
      if (nomeFuncao === 'cadastrarProduto') {
        const res = await acoesApp.onCriarProduto({
          nome: args.nome,
          categoria: args.categoria || 'Alimentos',
          qtd: Number(args.qtd) || 1,
          preco: Number(args.preco) || 0,
          validade: args.validade || null
        });
        if (res?.erro) return { status: 'erro', mensagem: res.erro };
        return { status: 'sucesso', resultado: `Produto "${args.nome}" cadastrado com sucesso!` };
      }

      if (nomeFuncao === 'reporEstoque') {
        const p = produtos.find(item => item.id === args.nomeOuId || item.nome.toLowerCase().includes(args.nomeOuId.toLowerCase()));
        if (!p) return { status: 'erro', mensagem: `Produto "${args.nomeOuId}" não encontrado no estoque.` };
        const res = await acoesApp.onRepor(p.id, Number(args.qtd) || 1, args.preco !== undefined ? Number(args.preco) : null);
        if (res?.erro) return { status: 'erro', mensagem: res.erro };
        return { status: 'sucesso', resultado: `Estoque de "${p.nome}" reposto com sucesso!` };
      }

      if (nomeFuncao === 'consumirEstoque') {
        const p = produtos.find(item => item.id === args.nomeOuId || item.nome.toLowerCase().includes(args.nomeOuId.toLowerCase()));
        if (!p) return { status: 'erro', mensagem: `Produto "${args.nomeOuId}" não encontrado no estoque.` };
        const res = await acoesApp.onConsumo(p.id, Number(args.qtd) || 1);
        if (res?.erro) return { status: 'erro', mensagem: res.erro };
        return { status: 'sucesso', resultado: `Consumo de "${p.nome}" registrado com sucesso!` };
      }

      if (nomeFuncao === 'editarProduto') {
        const p = produtos.find(item => item.id === args.nomeOuId || item.nome.toLowerCase().includes(args.nomeOuId.toLowerCase()));
        if (!p) return { status: 'erro', mensagem: `Produto "${args.nomeOuId}" não encontrado.` };
        const dadosAtualizados = {
          nome: args.novoNome || p.nome,
          categoria: args.categoria || p.categoria,
          preco: args.preco !== undefined ? Number(args.preco) : p.preco,
          validade: args.validade || p.validade
        };
        const res = await acoesApp.onEditarProduto(p.id, dadosAtualizados);
        if (res?.erro) return { status: 'erro', mensagem: res.erro };
        return { status: 'sucesso', resultado: `Produto "${p.nome}" atualizado com sucesso!` };
      }

      if (nomeFuncao === 'solicitarExclusaoProduto') {
        const p = produtos.find(item => item.id === args.nomeOuId || item.nome.toLowerCase().includes(args.nomeOuId.toLowerCase()));
        if (!p) return { status: 'erro', mensagem: `Produto "${args.nomeOuId}" não encontrado.` };
        
        // Retorna solicitação pendente de confirmação via botão no chat
        return { 
          status: 'aguardando_confirmacao', 
          produtoId: p.id, 
          produtoNome: p.nome,
          mensagem: `Deseja realmente excluir permanentemente o produto "${p.nome}"?` 
        };
      }

      if (nomeFuncao === 'criarCategoria') {
        const res = await acoesApp.onCriarCategoria(args.nome);
        if (res?.erro) return { status: 'erro', mensagem: res.erro };
        return { status: 'sucesso', resultado: `Categoria "${args.nome}" criada com sucesso!` };
      }

      if (nomeFuncao === 'navegarTela') {
        acoesApp.onNavegar(args.tela);
        return { status: 'sucesso', resultado: `Navegou para a tela de ${args.tela}.` };
      }

      if (nomeFuncao === 'atualizarConfiguracoesSistema') {
        if (acoesApp.onAtualizarConfiguracoes) {
          acoesApp.onAtualizarConfiguracoes(args);
        }
        return { status: 'sucesso', resultado: 'Configurações atualizadas com sucesso!' };
      }

      return { status: 'erro', mensagem: 'Função desconhecida.' };
    } catch (err) {
      return { status: 'erro', mensagem: err.message };
    }
  };

  const enviarMensagem = async (e, textoCustomizado = null, acaoConfirmada = null) => {
    if (e) e.preventDefault();
    const textoAtual = textoCustomizado || entradaTexto;
    if (!textoAtual.trim() && !arquivoAnexado && !acaoConfirmada) return;

    const anexoAtual = arquivoAnexado;
    const novasMensagens = [
      ...mensagens, 
      { remetente: 'usuario', texto: textoAtual, anexo: anexoAtual }
    ];
    setMensagens(novasMensagens);
    setEntradaTexto('');
    setArquivoAnexado(null);
    setCarregando(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave da API do Gemini não configurada no .env");

      // Contexto atualizado do aplicativo em tempo real
      const contextoAtual = {
        produtos,
        categorias,
        historicoRecente: historico.slice(0, 10)
      };

      const promptInstrucao = `Você é o assistente inteligente do sistema "GestãoFácil". 
Estado atual do app: ${JSON.stringify(contextoAtual)}.
Responda de forma prestativa, educada e concisa em português do Brasil. 
Utilize as ferramentas (functions) disponíveis sempre que o usuário pedir para realizar alterações, cadastros, consultas, navegação ou ajustes. Nunca tente fazer login, logout ou excluir contas de usuário.`;

      // Monta as partes da mensagem do usuário
      const partesUsuario = [{ text: textoAtual || (acaoConfirmada ? "Executar ação confirmada." : "Analisar imagem.") }];
      if (anexoAtual) {
        const [cabecalho, dadosBase64] = anexoAtual.dados.split(',');
        const mimeType = cabecalho.match(/:(.*?);/)?.[1] || 'image/jpeg';
        partesUsuario.push({ inline_data: { mime_type: mimeType, data: dadosBase64 } });
      }

      // Adiciona ao histórico do Gemini
      historicoGeminiRef.current.push({ role: 'user', parts: partesUsuario });

      let modelos = [...new Set([MODELO_PRINCIPAL, ...MODELOS_RESERVA])];
      let respostaApi = null;
      let dados = null;

      for (const modelo of modelos) {
        respostaApi = await fetch(`${GEMINI_URL_BASE}/${modelo}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: historicoGeminiRef.current,
            system_instruction: { parts: [{ text: promptInstrucao }] },
            tools: [{ function_declarations: declarations }]
          })
        });
        dados = await respostaApi.json().catch(() => ({}));
        if (respostaApi.ok && !dados.error) break;
      }

      if (!respostaApi?.ok || dados.error) {
        throw new Error(dados.error?.message || `Erro HTTP ${respostaApi?.status}`);
      }

      const candidato = dados.candidates?.[0];
      const partesModelo = candidato?.content?.parts || [];

      // Verifica se o Gemini chamou alguma função (Function Calling)
      const chamadaFuncao = partesModelo.find(p => p.functionCall);

      if (chamadaFuncao) {
        const { name, args } = chamadaFuncao.functionCall;
        
        // Adiciona a intenção da IA no histórico
        historicoGeminiRef.current.push({ role: 'model', parts: partesModelo });

        // Executa a função localmente
        const resultadoExecucao = await executarFuncaoLocal(name, args);

        let respostaTextoFinal = "";
        let botaoConfirmacaoExclusao = null;

        if (resultadoExecucao.status === 'aguardando_confirmacao') {
          respostaTextoFinal = resultadoExecucao.mensagem;
          botaoConfirmacaoExclusao = {
            produtoId: resultadoExecucao.produtoId,
            produtoNome: resultadoExecucao.produtoNome
          };
        } else {
          // Devolve o resultado da execução para a IA gerar a resposta final ao usuário
          historicoGeminiRef.current.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: name,
                response: resultadoExecucao
              }
            }]
          });

          // Segunda chamada para a IA formular a resposta final baseada no sucesso/erro
          const respFinal = await fetch(`${GEMINI_URL_BASE}/${MODELO_PRINCIPAL}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              contents: historicoGeminiRef.current,
              system_instruction: { parts: [{ text: promptInstrucao }] },
              tools: [{ function_declarations: declarations }]
            })
          });
          const dadosFinal = await respFinal.json();
          const partesFinal = dadosFinal.candidates?.[0]?.content?.parts || [];
          respostaTextoFinal = partesFinal.map(p => p.text).filter(Boolean).join('') || resultadoExecucao.resultado;
          
          historicoGeminiRef.current.push({ role: 'model', parts: partesFinal });
        }

        setMensagens(prev => [...prev, { remetente: 'ia', texto: respostaTextoFinal, confirmacaoExclusao: botaoConfirmacaoExclusao }]);
      } else {
        // Resposta normal em texto
        const textoResposta = partesModelo.map(p => p.text).filter(Boolean).join('') || "Desculpe, não consegui processar.";
        historicoGeminiRef.current.push({ role: 'model', parts: partesModelo });
        setMensagens(prev => [...prev, { remetente: 'ia', texto: textoResposta }]);
      }

    } catch (erro) {
      console.error("Erro no Assistente IA:", erro);
      setMensagens(prev => [...prev, { remetente: 'ia', texto: `Ops! Ocorreu um erro: ${erro.message}` }]);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarExclusaoChat = async (produtoId, produtoNome) => {
    setCarregando(true);
    const res = await acoesApp.onDeletarProduto(produtoId);
    setCarregando(false);
    if (res && !res.erro) {
      setMensagens(prev => [...prev, { remetente: 'ia', texto: `✅ O produto "${produtoNome}" foi excluído permanentemente com sucesso!` }]);
    } else {
      setMensagens(prev => [...prev, { remetente: 'ia', texto: `❌ Erro ao excluir o produto "${produtoNome}".` }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition transform hover:scale-105 group"
          title="Abrir Assistente IA"
        >
          <EstrelasIA />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-semibold px-0 group-hover:px-2">
            Assistente IA
          </span>
        </button>
      )}

      {aberto && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[520px] transition-colors">
          <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="font-bold text-sm">Assistente GestãoFácil</h3>
                <p className="text-[10px] text-indigo-200">Comandos inteligentes, estoque e navegação</p>
              </div>
            </div>
            <button onClick={() => setAberto(false)} className="text-indigo-200 hover:text-white text-lg font-bold p-1">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {mensagens.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.remetente === 'usuario' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.remetente === 'usuario' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                }`}>
                  {msg.anexo && (
                    <div className="mb-2">
                      <img src={msg.anexo.dados} alt="Anexo" className="max-h-32 rounded-lg object-cover" />
                    </div>
                  )}
                  <p>{msg.texto}</p>

                  {msg.confirmacaoExclusao && (
                    <div className="mt-3 flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={() => confirmarExclusaoChat(msg.confirmacaoExclusao.produtoId, msg.confirmacaoExclusao.produtoNome)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition"
                      >
                        Sim, Excluir
                      </button>
                      <button 
                        onClick={() => setMensagens(prev => [...prev, { remetente: 'ia', texto: 'Operação de exclusão cancelada.' }])}
                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl font-medium text-xs transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
                <span className="animate-spin">⏳</span> O assistente está pensando...
              </div>
            )}
            <div ref={mensagensFimRef} />
          </div>

          {arquivoAnexado && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="truncate text-slate-600 dark:text-slate-300">📎 {arquivoAnexado.nome}</span>
              <button onClick={() => setArquivoAnexado(null)} className="text-red-500 font-bold">Remover</button>
            </div>
          )}

          <form onSubmit={(e) => enviarMensagem(e)} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex items-center gap-2">
            <button
              type="button"
              onClick={iniciarOuvido}
              className={`p-2 rounded-xl transition ${ouvindo ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
              title="Falar com o assistente (Áudio)"
            >
              🎤
            </button>

            <label className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition" title="Anexar Imagem ou Arquivo">
              📎
              <input type="file" accept="image/*" onChange={handleAnexarArquivo} className="hidden" />
            </label>

            <input
              type="text"
              value={entradaTexto}
              onChange={(e) => setEntradaTexto(e.target.value)}
              placeholder={ouvindo ? "Ouvindo sua voz..." : "Digite ou fale com a IA..."}
              className="flex-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm">
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}