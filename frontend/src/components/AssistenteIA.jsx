import React, { useState, useRef, useEffect } from 'react';

// Ícone animado de IA: três estrelas que "piscam" em sequência, uma ultrapassando a outra
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

export default function AssistenteIA({ produtos }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { 
      remetente: 'ia', 
      texto: 'Olá! Sou seu assistente de IA do GestãoFácil. Posso te ajudar a gerenciar a despensa por texto, áudio ou analisando imagens. O que deseja fazer?' 
    }
  ]);
  
  const [entradaTexto, setEntradaTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [arquivoAnexado, setArquivoAnexado] = useState(null);

  const mensagensFimRef = useRef(null);

  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const falarTexto = (texto) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const iniciarOuvido = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

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
        setArquivoAnexado({
          nome: arquivo.name,
          tipo: arquivo.type,
          dados: leitor.result
        });
      };
      leitor.readAsDataURL(arquivo);
    }
  };

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!entradaTexto.trim() && !arquivoAnexado) return;

    const textoAtual = entradaTexto;
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

      if (!apiKey) {
        throw new Error("Chave da API do Gemini não configurada no arquivo .env");
      }

      const contextoEstoque = JSON.stringify(produtos);
      const promptSistema = `Você é o assistente inteligente do sistema "GestãoFácil", um aplicativo de controle de despensa residencial e estoque desenvolvido para a Atividade de Extensão universitária. Aqui está o estoque atual em formato JSON: ${contextoEstoque}. Responda de forma prestativa, educada e concisa em português do Brasil. Ajude o usuário a gerenciar itens, sugerir receitas com base nos produtos disponíveis ou tirar dúvidas.`;

      const partesConteudo = [
        { text: promptSistema },
        { text: `Usuário perguntou: ${textoAtual || "Analise esta imagem em relação ao estoque da despensa."}` }
      ];

      if (anexoAtual) {
        const [cabecalho, dadosBase64] = anexoAtual.dados.split(',');
        const mimeType = cabecalho.match(/:(.*?);/)?.[1] || 'image/jpeg';

        partesConteudo.push({
          inline_data: {
            mime_type: mimeType,
            data: dadosBase64
          }
        });
      }

      // Requisição padrão utilizando a chave via parâmetro 'key' na URL
      const respostaApi = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: partesConteudo }]
        })
      });

      const dados = await respostaApi.json();
      
      if (dados.error) {
        throw new Error(dados.error.message || "Erro retornado pela API do Gemini");
      }

      const respostaIA = dados.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar sua solicitação no momento.";

      setMensagens([...novasMensagens, { remetente: 'ia', texto: respostaIA }]);
      falarTexto(respostaIA);

    } catch (erro) {
      console.error("Erro ao falar com a IA:", erro);
      const msgErro = `Ops! Erro ao conectar com o assistente: ${erro.message}`;
      setMensagens([...novasMensagens, { remetente: 'ia', texto: msgErro }]);
    } finally {
      setCarregando(false);
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] transition-colors">
          <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <div>
                <h3 className="font-bold text-sm">Assistente GestãoFácil</h3>
                <p className="text-[10px] text-indigo-200">Pronto para te ajudar por voz, texto e imagem</p>
              </div>
            </div>
            <button onClick={() => setAberto(false)} className="text-indigo-200 hover:text-white text-lg font-bold p-1">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {mensagens.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.remetente === 'usuario' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
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

          <form onSubmit={enviarMensagem} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex items-center gap-2">
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