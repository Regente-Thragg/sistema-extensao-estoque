import React, { useState } from 'react';
import { supabase } from '../services/api';

export default function Configuracoes({ 
  perfilUsuario, 
  recursosAtivos, 
  onAtualizarRecursos,
  alternarTema,
  darkMode 
}) {
  const [abaAtiva, setAbaAtiva] = useState('residencia');

  const [nomeResidencia, setNomeResidencia] = useState(perfilUsuario?.nomeResidencia || 'Despensa em Casa');
  const [limiteEstoqueBaixo, setLimiteEstoqueBaixo] = useState(perfilUsuario?.limiteEstoqueBaixo || 3);

  const [nomeCompleto, setNomeCompleto] = useState(perfilUsuario?.nomeCompleto || '');
  const [nomeUsuario, setNomeUsuario] = useState(perfilUsuario?.nomeUsuario || '');
  const [fotoPerfil, setFotoPerfil] = useState(perfilUsuario?.fotoPerfil || '');
  const [modalFotoAberto, setModalFotoAberto] = useState(false);

  const avataresPredefinidos = [
    '🐱', '🐶', '🦊', '🐼', '🦁', '🐰', '🍎', '🍌', '🍇', '🍉', '🍓', '🍍'
  ];

  const [endereco, setEndereco] = useState(perfilUsuario?.endereco || {
    cep: '', rua: '', numero: '', semNumero: false, bairro: '', cidade: '', estado: '', complemento: '', descricao: ''
  });

  const [estrelas, setEstrelas] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  const [exibirIA, setExibirIA] = useState(recursosAtivos?.exibirIA ?? true);
  const [exibirModoEscuro, setExibirModoEscuro] = useState(recursosAtivos?.exibirModoEscuro ?? true);
  const [exibirSairConta, setExibirSairConta] = useState(recursosAtivos?.exibirSairConta ?? true);

  // Estados locais para simular o chat do Assistente de IA na tela de Configurações
  const [chatMensagens, setChatMensagens] = useState([
    { remetente: 'ia', texto: 'Olá! Sou seu assistente de IA. Como posso ajudar com sua despensa hoje?' }
  ]);
  const [inputMensagem, setInputMensagem] = useState('');

  const [modalDeletar1Aberto, setModalDeletar1Aberto] = useState(false);
  const [modalDeletar2Aberto, setModalDeletar2Aberto] = useState(false);
  const [motivoSelecionado, setMotivoSelecionado] = useState('');
  const [motivoOutro, setMotivoOutro] = useState('');
  const [aguardandoExclusao, setAguardandoExclusao] = useState(false);

  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const formatarCep = (valor) => valor.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);

  const handleCepChange = async (e) => {
    const cepFormatado = formatarCep(e.target.value);
    setEndereco((prev) => ({ ...prev, cep: cepFormatado }));
    const cepLimpo = cepFormatado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resposta.json();
        if (!dados.erro) {
          setEndereco((prev) => ({
            ...prev,
            rua: dados.logradouro || '',
            bairro: dados.bairro || '',
            cidade: dados.localidade || '',
            estado: dados.uf || ''
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  const handleSalvarResidencia = (e) => {
    e.preventDefault();
    setSucesso('Configurações da residência atualizadas com sucesso!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleSalvarPerfil = (e) => {
    e.preventDefault();
    setSucesso('Perfil atualizado com sucesso!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleSalvarPessoal = (e) => {
    e.preventDefault();
    if (endereco.semNumero && !endereco.descricao.trim()) {
      return setErro('A descrição é obrigatória quando o endereço não possui número.');
    }
    setErro('');
    setSucesso('Informações pessoais atualizadas com sucesso!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleEnviarAvaliacao = async (e) => {
    e.preventDefault();
    if (!comentarioAvaliacao.trim()) return setErro('Escreva seu comentário antes de enviar.');
    
    setEnviandoAvaliacao(true);
    setErro('');

    try {
      const dadosAvaliacao = {
        pastaDriveId: '1dHhRHTBb3gF3bLsSev30FF82BpcKx7xN',
        usuario: perfilUsuario?.email || 'Anônimo',
        estrelas,
        comentario: comentarioAvaliacao,
        data: new Date().toISOString()
      };

      console.log('Enviando avaliação para Google Drive:', dadosAvaliacao);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSucesso('Avaliação enviada com sucesso para nossa equipe! Obrigado pelo feedback.');
      setComentarioAvaliacao('');
      setEstrelas(5);
    } catch (err) {
      setErro('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviandoAvaliacao(false);
      setTimeout(() => setSucesso(''), 4000);
    }
  };

  const handleSalvarSistema = () => {
    const novosRecursos = { exibirIA, exibirModoEscuro, exibirSairConta };
    if (onAtualizarRecursos) onAtualizarRecursos(novosRecursos);
    setSucesso('Preferências do sistema salvas com sucesso!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const enviarMensagemIA = (e) => {
    e.preventDefault();
    if (!inputMensagem.trim()) return;
    const novas = [...chatMensagens, { remetente: 'usuario', texto: inputMensagem }];
    setChatMensagens(novas);
    setInputMensagem('');
    setTimeout(() => {
      setChatMensagens((prev) => [...prev, { remetente: 'ia', texto: 'Compreendido! Estou processando suas informações de estoque.' }]);
    }, 800);
  };

  const motivosExclusao = [
    'Não estou utilizando o sistema com frequência',
    'Encontrei outra ferramenta para gerenciar meu estoque',
    'Dificuldade de uso / interface complexa',
    'Problemas técnicos ou erros recorrentes',
    'Questões de privacidade e segurança de dados',
    'Criação de uma nova conta na plataforma',
    'Outro'
  ];

  const handleEnviarSolicitacaoExclusao = () => {
    const motivoFinal = motivoSelecionado === 'Outro' ? motivoOutro : motivoSelecionado;
    if (!motivoFinal) return setErro('Selecione ou informe o motivo da exclusão.');

    const relatorioExclusao = {
      destinatario: 'support.easymanagement@gmail.com',
      usuario: perfilUsuario?.email,
      nomeCompleto,
      motivo: motivoFinal,
      dataSolicitacao: new Date().toISOString()
    };

    console.log('Relatório de Exclusão enviado (DOCX) para support.easymanagement@gmail.com:', relatorioExclusao);

    setModalDeletar2Aberto(false);
    setAguardandoExclusao(true);
    setSucesso('Solicitação enviada! Aguarde o prazo de até 24 horas para análise. Você receberá um e-mail de confirmação.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações e Perfil</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Personalize os dados da sua residência, perfil e ajuste os parâmetros operacionais do sistema.
        </p>
      </div>

      {sucesso && <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-medium">{sucesso}</div>}
      {erro && <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">{erro}</div>}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        <button type="button" onClick={() => setAbaAtiva('residencia')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'residencia' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Residência</button>
        <button type="button" onClick={() => setAbaAtiva('perfil')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'perfil' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Configurações de Perfil</button>
        <button type="button" onClick={() => setAbaAtiva('pessoal')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'pessoal' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Informações Pessoais</button>
        <button type="button" onClick={() => setAbaAtiva('avaliacoes')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'avaliacoes' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Avaliações</button>
        <button type="button" onClick={() => setAbaAtiva('sistema')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'sistema' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>Configurações do Sistema</button>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
        
        {abaAtiva === 'residencia' && (
          <form onSubmit={handleSalvarResidencia} className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Parâmetros da Residência</h3>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome da Residência / Projeto</label>
              <input type="text" value={nomeResidencia} onChange={(e) => setNomeResidencia(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Limite Padrão para Estoque Baixo (unidades)</label>
              <input type="number" min="1" value={limiteEstoqueBaixo} onChange={(e) => setLimiteEstoqueBaixo(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" required />
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition shadow-sm">Salvar Alterações</button>
          </form>
        )}

        {abaAtiva === 'perfil' && (
          <form onSubmit={handleSalvarPerfil} className="space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Perfil do Usuário</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-3xl border-2 border-indigo-500 overflow-hidden shadow-inner">
                {fotoPerfil ? (fotoPerfil.length <= 2 ? <span className="select-none">{fotoPerfil}</span> : <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />) : <span>👤</span>}
              </div>
              <div className="space-y-2">
                <button type="button" onClick={() => setModalFotoAberto(true)} className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium px-4 py-2 rounded-xl text-xs transition">Alterar Foto de Perfil</button>
                {fotoPerfil && <button type="button" onClick={() => setFotoPerfil('')} className="block text-xs text-red-500 hover:underline">Remover foto de perfil</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome de Usuário</label>
                <input type="text" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" required />
              </div>
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition shadow-sm">Salvar Perfil</button>
          </form>
        )}

        {abaAtiva === 'pessoal' && (
          <form onSubmit={handleSalvarPessoal} className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Endereço Cadastrado</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">CEP</label><input type="text" value={endereco.cep} onChange={handleCepChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Rua</label><input type="text" value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Número</label><input type="text" disabled={endereco.semNumero} value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs disabled:opacity-50" required={!endereco.semNumero} /></div>
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Bairro</label><input type="text" value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="semNumConfig" checked={endereco.semNumero} onChange={(e) => setEndereco({ ...endereco, semNumero: e.target.checked, numero: e.target.checked ? '' : endereco.numero })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
              <label htmlFor="semNumConfig" className="text-xs text-gray-500 dark:text-gray-400">Não possui número</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Complemento</label><input type="text" value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" /></div>
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição / Referência</label><input type="text" value={endereco.descricao} onChange={(e) => setEndereco({ ...endereco, descricao: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required={endereco.semNumero} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Cidade</label><input type="text" value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
              <div className="space-y-1"><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Estado (UF)</label><input type="text" value={endereco.estado} onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition shadow-sm">Atualizar Endereço</button>
          </form>
        )}

        {abaAtiva === 'avaliacoes' && (
          <form onSubmit={handleEnviarAvaliacao} className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Avalie o Sistema</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sua opinião é fundamental para aprimorarmos o GestãoFácil.</p>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Classificação</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setEstrelas(star)} className={`text-2xl transition ${star <= estrelas ? 'text-amber-400 scale-110' : 'text-gray-300 dark:text-gray-700'}`}>★</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Seu Comentário</label>
                <span className={`text-[11px] ${comentarioAvaliacao.length > 600 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{comentarioAvaliacao.length}/600 caracteres</span>
              </div>
              <textarea rows={4} maxLength={600} value={comentarioAvaliacao} onChange={(e) => setComentarioAvaliacao(e.target.value)} placeholder="Escreva sua opinião, sugestões ou elogios aqui... (Você pode usar emojis do seu teclado 😊👍)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <button type="submit" disabled={enviandoAvaliacao || !comentarioAvaliacao.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition shadow-sm disabled:opacity-50">{enviandoAvaliacao ? 'Enviando...' : 'Enviar sua Avaliação'}</button>
          </form>
        )}

        {abaAtiva === 'sistema' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Preferências e Recursos Nativos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Escolha quais recursos exibir na página inicial. Ao desativar um recurso, ele continuará acessível e poderá ser usado diretamente por esta aba.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="min-w-0 flex-1 text-left"><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Assistente de IA</h4><p className="text-[11px] text-gray-500">Botão flutuante do assistente no canto inferior direito.</p></div>
                <input type="checkbox" checked={exibirIA} onChange={(e) => setExibirIA(e.target.checked)} className="w-4 h-4 shrink-0 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="min-w-0 flex-1 text-left"><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Modo Escuro / Claro</h4><p className="text-[11px] text-gray-500">Alternador de tema no menu lateral.</p></div>
                <input type="checkbox" checked={exibirModoEscuro} onChange={(e) => setExibirModoEscuro(e.target.checked)} className="w-4 h-4 shrink-0 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="min-w-0 flex-1 text-left"><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Botão Sair da Conta</h4><p className="text-[11px] text-gray-500">Atalho de logout no menu lateral.</p></div>
                <input type="checkbox" checked={exibirSairConta} onChange={(e) => setExibirSairConta(e.target.checked)} className="w-4 h-4 shrink-0 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
              </div>
            </div>

            <button type="button" onClick={handleSalvarSistema} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition shadow-sm">Salvar Preferências do Sistema</button>

            {/* ÁREA DE RECURSOS RECOLHIDOS (IA, Tema e Sair) */}
            {(!exibirIA || !exibirModoEscuro || !exibirSairConta) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acesso Direto aos Recursos Ocultos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  
                  {/* Assistente de IA Oculto com Grampo e Microfone */}
                  {!exibirIA && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🤖</span>
                        <h5 className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Assistente de IA (Disponível aqui)</h5>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-2">
                        <div className="h-28 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg text-xs space-y-1.5">
                          {chatMensagens.map((msg, index) => (
                            <div key={index} className={`flex ${msg.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                              <span className={`p-2 rounded-xl max-w-[80%] text-[11px] ${msg.remetente === 'usuario' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                {msg.texto}
                              </span>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={enviarMensagemIA} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="Pergunte algo sobre seu estoque..." 
                            value={inputMensagem} 
                            onChange={(e) => setInputMensagem(e.target.value)} 
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" 
                          />
                          <button type="button" title="Anexar arquivo" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1">
                            📎
                          </button>
                          <button type="button" title="Gravar áudio" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm px-1">
                            🎤
                          </button>
                          <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium">Enviar</button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Modo Escuro Oculto */}
                  {!exibirModoEscuro && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">🌙 Controle de Tema</span>
                      <p className="text-[11px] text-gray-500">Alternar modo claro / escuro:</p>
                      <button type="button" onClick={alternarTema} className="px-3 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-medium transition">
                        {darkMode ? '☀️ Mudar para Modo Claro' : '🌙 Mudar para Modo Escuro'}
                      </button>
                    </div>
                  )}

                  {/* Sair da Conta Oculto */}
                  {!exibirSairConta && (
                    <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2">
                      <span className="text-xs font-semibold text-red-600 block">🚪 Sair da Conta</span>
                      <p className="text-[11px] text-gray-500">Atalho rápido para logout:</p>
                      <button type="button" onClick={() => supabase.auth.signOut()} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition">
                        Fazer Logout Agora
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="pt-6 border-t border-red-100 dark:border-red-950/40 space-y-3">
              <h4 className="text-sm font-bold text-red-600">Zona de Perigo</h4>
              <p className="text-xs text-gray-500">A exclusão da conta é irreversível e passará por análise administrativa.</p>
              <button type="button" onClick={() => setModalDeletar1Aberto(true)} className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition shadow-sm">Deletar Conta</button>
              {aguardandoExclusao && <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 text-amber-700 rounded-xl text-xs">⏳ Sua solicitação de exclusão foi enviada e está aguardando prazo de até 24 horas para análise. Você receberá um e-mail de confirmação em breve.</div>}
            </div>
          </div>
        )}

      </div>

      {modalFotoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5">
            <div className="flex justify-between items-center border-b pb-3 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Escolher Foto de Perfil</h3>
              <button onClick={() => setModalFotoAberto(false)} className="text-gray-500 hover:text-gray-700 font-bold text-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Avatares Ilustrados (Animais e Frutas)</label>
                <div className="grid grid-cols-6 gap-2">
                  {avataresPredefinidos.map((avatar, index) => (
                    <button key={index} type="button" onClick={() => { setFotoPerfil(avatar); setModalFotoAberto(false); }} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 text-2xl flex items-center justify-center transition border border-gray-200 dark:border-gray-700">{avatar}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 p-3 rounded-xl text-center text-xs font-medium text-gray-700 dark:text-gray-200 transition border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-1">
                  <span>🖼️</span> Escolher na Galeria
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) { setFotoPerfil(URL.createObjectURL(e.target.files[0])); setModalFotoAberto(false); } }} />
                </label>
                <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 p-3 rounded-xl text-center text-xs font-medium text-gray-700 dark:text-gray-200 transition border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-1">
                  <span>📁</span> Escolher nos Arquivos
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) { setFotoPerfil(URL.createObjectURL(e.target.files[0])); setModalFotoAberto(false); } }} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDeletar1Aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="text-lg font-bold text-red-600">⚠️ Tem certeza que deseja deletar sua conta?</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">Esta ação iniciará o processo de exclusão permanente de todos os seus dados armazenados no GestãoFácil.</p>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setModalDeletar1Aberto(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancelar</button>
              <button type="button" onClick={() => { setModalDeletar1Aberto(false); setModalDeletar2Aberto(true); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium shadow-sm">Sim, tenho certeza</button>
            </div>
          </div>
        </div>
      )}

      {modalDeletar2Aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 my-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Motivo da Exclusão</h3>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {motivosExclusao.map((motivo, idx) => (
                <label key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 cursor-pointer border border-gray-200 dark:border-gray-700 text-xs">
                  <input type="radio" name="motivoExclusao" value={motivo} checked={motivoSelecionado === motivo} onChange={(e) => setMotivoSelecionado(e.target.value)} className="mt-0.5 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-gray-700 dark:text-gray-200">{motivo}</span>
                </label>
              ))}
              {motivoSelecionado === 'Outro' && (
                <div className="pt-2">
                  <textarea rows={3} placeholder="Especifique o seu motivo..." value={motivoOutro} onChange={(e) => setMotivoOutro(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-800">
              <button type="button" onClick={() => setModalDeletar2Aberto(false)} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium">Cancelar</button>
              <button type="button" onClick={handleEnviarSolicitacaoExclusao} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium shadow-sm">Enviar para Análise</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}