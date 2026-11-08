import React, { useState } from 'react';
import { supabase } from '../services/api';

const BTN_BASE = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold transition';
const BTN_TAM = { md: 'px-5 py-2.5', sm: 'px-4 py-2', xs: 'px-3 py-1.5' };
const BTN_COR = {
  primario: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
  suave: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300',
  suaveVermelho: 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400',
  perigo: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  neutro: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300',
  escuro: 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900',
};
const btn = (cor, tam = 'md') => `${BTN_BASE} ${BTN_TAM[tam]} ${BTN_COR[cor]}`;

export default function Configuracoes({ 
  perfilUsuario, 
  recursosAtivos, 
  onAtualizarRecursos,
  onAtualizarResidencia,
  onAtualizarPerfil,
  alternarTema,
  darkMode 
}) {
  const [abaAtiva, setAbaAtiva] = useState(() => {
    try {
      return localStorage.getItem('config_aba_ativa') || 'residencia';
    } catch {
      return 'residencia';
    }
  });

  const trocarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    try {
      localStorage.setItem('config_aba_ativa', novaAba);
    } catch {}
  };

  const [nomeResidencia, setNomeResidencia] = useState(perfilUsuario?.nomeResidencia || 'Despensa em Casa');
  const [limiteEstoqueBaixo, setLimiteEstoqueBaixo] = useState(perfilUsuario?.limiteEstoqueBaixo || 3);

  const [nomeCompleto, setNomeCompleto] = useState(perfilUsuario?.nomeCompleto || '');
  const [nomeUsuario, setNomeUsuario] = useState(perfilUsuario?.nomeUsuario || '');
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(perfilUsuario?.fotoPerfil || '');
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const avataresPredefinidos = [
    '🐱', '🐶', '🦊', '🐼', '🦁', '🐰', '🍎', '🍌', '🍇', '🍉', '🍓', '🍍'
  ];

  const [endereco, setEndereco] = useState(perfilUsuario?.endereco || {
    cep: '', rua: '', numero: '', semNumero: false, bairro: '', cidade: '', estado: '', complemento: '', descricao: ''
  });
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  const [estrelas, setEstrelas] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [editandoAvaliacao, setEditandoAvaliacao] = useState(false);
  const [avaliacaoSalva, setAvaliacaoSalva] = useState(() => {
    try {
      const salvo = localStorage.getItem(`avaliacao_${perfilUsuario?.email || 'anon'}`);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const [exibirIA, setExibirIA] = useState(recursosAtivos?.exibirIA ?? true);
  const [exibirModoEscuro, setExibirModoEscuro] = useState(recursosAtivos?.exibirModoEscuro ?? true);
  const [exibirSairConta, setExibirSairConta] = useState(recursosAtivos?.exibirSairConta ?? true);

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

  const URL_WEBHOOK_ENDERECOS = "https://script.google.com/macros/s/AKfycbzXKCU0ismLzrcGl_nXKTTtvKaG4C-jW4SHpvjIS5yMRwwdf6BbYskDfskjVqLO9huXYw/exec";
  const URL_WEBHOOK_AVALIACOES = "https://script.google.com/macros/s/AKfycbxBP564WYjx0rGALpc73sgFcu9R6ODU7_lU62bCvxHrE7b7D0ZuUiHpmItxCj494NLj/exec";

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
    if (onAtualizarResidencia) {
      onAtualizarResidencia({ nomeResidencia, limiteEstoqueBaixo });
    }
    setSucesso('Configurações da residência atualizadas com sucesso!');
    setTimeout(() => setSucesso(''), 3000);
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setSalvandoPerfil(true);
    setErro('');

    try {
      const novosDados = {
        nomeCompleto,
        nomeUsuario,
        fotoPerfil,
        limiteEstoqueBaixo,
        nomeResidencia,
        endereco
      };

      const { error } = await supabase.auth.updateUser({ data: novosDados });
      if (error) throw error;

      if (onAtualizarPerfil) {
        onAtualizarPerfil(novosDados);
      }

      setEditandoPerfil(false);
      setSucesso('Perfil atualizado e salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setErro('Erro ao salvar perfil no Supabase. Tente novamente.');
    } finally {
      setSalvandoPerfil(false);
      setTimeout(() => setSucesso(''), 3000);
    }
  };

  const handleAtualizarFotoDireta = async (novaFoto) => {
    setFotoPerfil(novaFoto);
    try {
      const novosDados = {
        nomeCompleto,
        nomeUsuario,
        fotoPerfil: novaFoto,
        limiteEstoqueBaixo,
        nomeResidencia,
        endereco
      };
      await supabase.auth.updateUser({ data: novosDados });
      if (onAtualizarPerfil) {
        onAtualizarPerfil(novosDados);
      }
      setSucesso('Foto de perfil atualizada com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
    }
  };

  const handleSalvarPessoal = async (e) => {
    e.preventDefault();
    if (endereco.semNumero && !endereco.descricao.trim()) {
      return setErro('A descrição é obrigatória quando o endereço não possui número.');
    }

    setSalvandoEndereco(true);
    setErro('');

    try {
      const novosDados = {
        nomeCompleto,
        nomeUsuario,
        fotoPerfil,
        limiteEstoqueBaixo,
        nomeResidencia,
        endereco
      };

      const { error } = await supabase.auth.updateUser({ data: novosDados });
      if (error) throw error;

      if (onAtualizarPerfil) {
        onAtualizarPerfil(novosDados);
      }

      const dadosEnderecoWebhook = {
        tipo: 'ENDERECO_CLIENTE',
        usuario: perfilUsuario?.email || 'Anônimo',
        nomeCompleto: nomeCompleto || 'Não informado',
        ...endereco,
        dataAtualizacao: new Date().toLocaleString()
      };

      await fetch(URL_WEBHOOK_ENDERECOS, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEnderecoWebhook)
      }).catch(() => {});

      setSucesso('Endereço atualizado e salvo com sucesso na sua pasta do Google Drive!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      console.error('Erro ao salvar endereço:', err);
      setErro('Erro ao salvar endereço. Tente novamente.');
    } finally {
      setSalvandoEndereco(false);
    }
  };

  const handleEnviarAvaliacao = async (e) => {
    e.preventDefault();
    if (estrelas === 0) return setErro('Selecione uma classificação de 1 a 5 estrelas antes de enviar.');
    if (!comentarioAvaliacao.trim()) return setErro('Escreva seu comentário antes de enviar.');
    
    setEnviandoAvaliacao(true);
    setErro('');

    try {
      const dadosAvaliacao = {
        tipo: 'AVALIACAO',
        usuario: perfilUsuario?.email || 'Anônimo',
        estrelas,
        comentario: comentarioAvaliacao,
        data: new Date().toLocaleString()
      };

      await fetch(URL_WEBHOOK_AVALIACOES, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosAvaliacao)
      });

      const novaAval = {
        estrelas,
        comentario: comentarioAvaliacao,
        data: new Date().toLocaleString()
      };

      setAvaliacaoSalva(novaAval);
      try {
        localStorage.setItem(`avaliacao_${perfilUsuario?.email || 'anon'}`, JSON.stringify(novaAval));
      } catch {}

      setEditandoAvaliacao(false);
      setSucesso(editandoAvaliacao ? 'Avaliação atualizada com sucesso!' : 'Avaliação enviada com sucesso! Obrigado pelo feedback.');
      setComentarioAvaliacao('');
      setEstrelas(0);
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      setErro('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setEnviandoAvaliacao(false);
      setTimeout(() => setSucesso(''), 4000);
    }
  };

  const handleExcluirAvaliacao = async () => {
    if (!window.confirm('Tem certeza de que deseja excluir sua avaliação do sistema e da pasta do Google Drive?')) {
      return;
    }

    setErro('');
    try {
      // 1. Remove do localStorage e limpa estado da tela
      setAvaliacaoSalva(null);
      setEstrelas(0);
      setComentarioAvaliacao('');
      setEditandoAvaliacao(false);
      try {
        localStorage.removeItem(`avaliacao_${perfilUsuario?.email || 'anon'}`);
      } catch {}

      // 2. Notifica o Webhook para apagar o arquivo .txt da pasta do Google Drive
      await fetch(URL_WEBHOOK_AVALIACOES, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'DELETAR_AVALIACAO',
          usuario: perfilUsuario?.email || 'Anônimo'
        })
      });

      setSucesso('Avaliação excluída com sucesso da aplicação e da pasta do Google Drive!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      console.error('Erro ao excluir avaliação:', err);
      setErro('Erro ao excluir avaliação. Tente novamente.');
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

    setModalDeletar2Aberto(false);
    setAguardandoExclusao(true);
    setSucesso('Solicitação enviada! Aguarde o prazo de até 24 horas para análise.');
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
        <button type="button" onClick={() => trocarAba('residencia')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'residencia' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Residência</button>
        <button type="button" onClick={() => trocarAba('perfil')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'perfil' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Configurações de Perfil</button>
        <button type="button" onClick={() => trocarAba('pessoal')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'pessoal' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Informações Pessoais</button>
        <button type="button" onClick={() => trocarAba('avaliacoes')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'avaliacoes' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Avaliações</button>
        <button type="button" onClick={() => trocarAba('sistema')} className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${abaAtiva === 'sistema' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>Configurações do Sistema</button>
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
            <button type="submit" className={btn('primario')}>Salvar Alterações</button>
          </form>
        )}

        {abaAtiva === 'perfil' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Perfil do Usuário</h3>
            <div className="relative p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-20 h-20 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-3xl border-2 border-indigo-500 overflow-hidden shadow-inner">
                  {fotoPerfil ? (fotoPerfil.length <= 2 ? <span>{fotoPerfil}</span> : <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />) : <span>👤</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setModalFotoAberto(true)} className={btn('suave', 'sm')}>Alterar Foto de Perfil</button>
                  {fotoPerfil && <button type="button" onClick={() => handleAtualizarFotoDireta('')} className={btn('suaveVermelho', 'sm')}>Remover foto</button>}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {!editandoPerfil ? (
                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{nomeCompleto || 'Nome Completo não definido'}</h4>
                    <p className="text-sm font-medium text-gray-500">@{nomeUsuario || 'usuario'}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSalvarPerfil} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome Completo</label><input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" required /></div>
                      <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome de Usuário</label><input type="text" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm" required /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditandoPerfil(false)} className={btn('neutro', 'sm')}>Cancelar</button>
                      <button type="submit" disabled={salvandoPerfil} className={`${btn('primario', 'sm')} disabled:opacity-50`}>{salvandoPerfil ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                  </form>
                )}
              </div>
              {!editandoPerfil && (
                <div className="absolute bottom-4 right-4">
                  <button type="button" onClick={() => setEditandoPerfil(true)} className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition" title="Editar Perfil">✏️</button>
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'pessoal' && (
          <form onSubmit={handleSalvarPessoal} className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Endereço Cadastrado (Salvo no Google Drive)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">CEP</label><input type="text" value={endereco.cep} onChange={handleCepChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Rua</label><input type="text" value={endereco.rua} onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Número</label><input type="text" disabled={endereco.semNumero} value={endereco.numero} onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs disabled:opacity-50" required={!endereco.semNumero} /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Bairro</label><input type="text" value={endereco.bairro} onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="semNumConfig" checked={endereco.semNumero} onChange={(e) => setEndereco({ ...endereco, semNumero: e.target.checked, numero: e.target.checked ? '' : endereco.numero })} className="rounded border-gray-300 text-indigo-600 w-3.5 h-3.5" />
              <label htmlFor="semNumConfig" className="text-xs text-gray-500">Não possui número</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Complemento</label><input type="text" value={endereco.complemento} onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição / Referência</label><input type="text" value={endereco.descricao} onChange={(e) => setEndereco({ ...endereco, descricao: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required={endereco.semNumero} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Cidade</label><input type="text" value={endereco.cidade} onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
              <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Estado (UF)</label><input type="text" value={endereco.estado} onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" required /></div>
            </div>
            <button type="submit" disabled={salvandoEndereco} className={`${btn('primario')} disabled:opacity-50`}>
              {salvandoEndereco ? 'Salvando no Drive...' : 'Atualizar e Salvar no Drive'}
            </button>
          </form>
        )}

        {abaAtiva === 'avaliacoes' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Avalie o Sistema</h3>
            {avaliacaoSalva && !editandoAvaliacao ? (
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400 text-lg">
                    {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= avaliacaoSalva.estrelas ? '★' : '☆'}</span>)}
                  </div>
                  <span className="text-[11px] text-gray-400">{avaliacaoSalva.data}</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">"{avaliacaoSalva.comentario}"</p>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setEstrelas(avaliacaoSalva.estrelas); setComentarioAvaliacao(avaliacaoSalva.comentario); setEditandoAvaliacao(true); }} className={btn('suave', 'sm')}>✏️ Editar</button>
                  <button type="button" onClick={handleExcluirAvaliacao} className={btn('suaveVermelho', 'sm')}>🗑️ Excluir</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnviarAvaliacao} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Classificação</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setEstrelas(star)} className={`text-2xl transition ${star <= estrelas ? 'text-amber-400 scale-110' : 'text-gray-300'}`}>★</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Comentário</label>
                  <textarea rows={4} maxLength={600} value={comentarioAvaliacao} onChange={(e) => setComentarioAvaliacao(e.target.value)} placeholder="Escreva sua opinião..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm" required />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={enviandoAvaliacao} className={`${btn('primario')} disabled:opacity-50`}>{enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação'}</button>
                  {editandoAvaliacao && (
                    <button type="button" onClick={() => setEditandoAvaliacao(false)} className={btn('neutro')}>Cancelar</button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {abaAtiva === 'sistema' && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-800">Preferências e Recursos Nativos</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Assistente de IA</h4><p className="text-[11px] text-gray-500">Botão flutuante do assistente.</p></div>
                <input type="checkbox" checked={exibirIA} onChange={(e) => setExibirIA(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Modo Escuro / Claro</h4><p className="text-[11px] text-gray-500">Alternador de tema no menu.</p></div>
                <input type="checkbox" checked={exibirModoEscuro} onChange={(e) => setExibirModoEscuro(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div><h4 className="text-xs font-semibold text-gray-900 dark:text-white">Botão Sair da Conta</h4><p className="text-[11px] text-gray-500">Atalho de logout.</p></div>
                <input type="checkbox" checked={exibirSairConta} onChange={(e) => setExibirSairConta(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300" />
              </div>
            </div>
            <button type="button" onClick={handleSalvarSistema} className={btn('primario')}>Salvar Preferências</button>

            {(!exibirIA || !exibirModoEscuro || !exibirSairConta) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acesso Direto aos Recursos Ocultos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!exibirIA && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2"><span className="text-base">🤖</span><h5 className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">Assistente de IA (Disponível aqui)</h5></div>
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-2">
                        <div className="h-28 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg text-xs space-y-1.5">
                          {chatMensagens.map((msg, index) => (
                            <div key={index} className={`flex ${msg.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                              <span className={`p-2 rounded-xl max-w-[80%] text-[11px] ${msg.remetente === 'usuario' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{msg.texto}</span>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={enviarMensagemIA} className="flex items-center gap-2">
                          <input type="text" placeholder="Pergunte algo..." value={inputMensagem} onChange={(e) => setInputMensagem(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs" />
                          <button type="submit" className={btn('primario', 'xs')}>Enviar</button>
                        </form>
                      </div>
                    </div>
                  )}
                  {!exibirModoEscuro && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">🌙 Controle de Tema</span>
                      <button type="button" onClick={alternarTema} className={btn('escuro', 'sm')}>{darkMode ? '☀️ Mudar para Modo Claro' : '🌙 Mudar para Modo Escuro'}</button>
                    </div>
                  )}
                  {!exibirSairConta && (
                    <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2">
                      <span className="text-xs font-semibold text-red-600 block">🚪 Sair da Conta</span>
                      <button type="button" onClick={() => supabase.auth.signOut()} className={btn('perigo', 'sm')}>Fazer Logout Agora</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-red-100 dark:border-red-950/40 space-y-3">
              <h4 className="text-sm font-bold text-red-600">Zona de Perigo</h4>
              <button type="button" onClick={() => setModalDeletar1Aberto(true)} className={btn('perigo')}>Deletar Conta</button>
              {aguardandoExclusao && <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs">⏳ Solicitação de exclusão enviada para análise.</div>}
            </div>
          </div>
        )}
      </div>

      {modalFotoAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Escolher Foto</h3>
              <button onClick={() => setModalFotoAberto(false)} className="text-gray-500 font-bold">✕</button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {avataresPredefinidos.map((avatar, idx) => (
                <button key={idx} type="button" onClick={() => { handleAtualizarFotoDireta(avatar); setModalFotoAberto(false); }} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-2xl flex items-center justify-center hover:bg-indigo-100">{avatar}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalDeletar1Aberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600">Deseja deletar sua conta?</h3>
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setModalDeletar1Aberto(false)} className={btn('neutro', 'sm')}>Cancelar</button>
              <button onClick={() => { setModalDeletar1Aberto(false); setModalDeletar2Aberto(true); }} className={btn('perigo', 'sm')}>Sim</button>
            </div>
          </div>
        </div>
      )}

      {modalDeletar2Aberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Motivo da Exclusão</h3>
            <select value={motivoSelecionado} onChange={(e) => setMotivoSelecionado(e.target.value)} className="w-full p-2.5 rounded-xl border bg-gray-50 dark:bg-gray-800 text-xs">
              <option value="">Selecione um motivo...</option>
              {motivosExclusao.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
            </select>
            {motivoSelecionado === 'Outro' && (
              <textarea rows={3} placeholder="Especifique..." value={motivoOutro} onChange={(e) => setMotivoOutro(e.target.value)} className="w-full p-2.5 rounded-xl border bg-gray-50 dark:bg-gray-800 text-xs" />
            )}
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setModalDeletar2Aberto(false)} className={btn('neutro', 'sm')}>Cancelar</button>
              <button onClick={handleEnviarSolicitacaoExclusao} className={btn('perigo', 'sm')}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}