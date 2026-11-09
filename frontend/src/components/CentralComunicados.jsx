import React from 'react';

export default function CentralComunicados({ aberto, onFechar, usuarioEmail }) {
  if (!aberto) return null;

  // Busca dados de exclusão do localStorage se existirem
  let solicitacaoExclusao = null;
  try {
    const salvo = localStorage.getItem(`exclusao_pendente_${usuarioEmail || 'anon'}`);
    if (salvo) solicitacaoExclusao = JSON.parse(salvo);
  } catch {}

  const mensagensSistema = [
    {
      id: 1,
      autor: 'Sistema GestãoFácil',
      data: '08/11/2026 - 18:30',
      tipo: 'atualizacao',
      titulo: '🚀 Nova Atualização v1.3 Disponível!',
      texto: 'O Painel de Otimização e Desempenho 100% nativo foi integrado. Agora você pode monitorar a taxa de rede, status de conexão online/offline e calcular o cache real gravado no navegador.'
    },
    {
      id: 2,
      autor: 'Suporte Técnico',
      data: '05/11/2026 - 14:15',
      tipo: 'atualizacao',
      titulo: '🛡️ Sistema de Permissões com Desfoque Visual',
      texto: 'Adicionamos a aba Outras Configurações com proteção contra acessos não autorizados. Se o usuário negar a permissão, a aba é bloqueada com efeito blur.'
    }
  ];

  if (solicitacaoExclusao) {
    mensagensSistema.unshift({
      id: 99,
      autor: 'Suporte Técnico (support.easymanagement@gmail.com)',
      data: new Date(solicitacaoExclusao.timestampSolicitacao).toLocaleString(),
      tipo: 'alerta',
      titulo: '⏳ Solicitação de Exclusão de Conta em Análise',
      texto: `Sua solicitação de exclusão foi recebida com sucesso e enviada ao desenvolvedor. O prazo de 24 horas está em andamento. Motivo informado: "${solicitacaoExclusao.motivo}".`
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end backdrop-blur-xs transition-opacity">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-gray-200 dark:border-gray-800">
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Central de Mensagens do Sistema</h3>
              <p className="text-[11px] text-gray-500">Comunicados oficiais e changelog de atualizações</p>
            </div>
          </div>
          <button onClick={onFechar} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white text-sm font-bold">✕</button>
        </div>

        {/* Lista de Mensagens do Chat (Somente Leitura) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensagensSistema.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{msg.autor}</span>
                <span>{msg.data}</span>
              </div>
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                msg.tipo === 'alerta' 
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                <h4 className="font-bold">{msg.titulo}</h4>
                <p>{msg.texto}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé Infomativo (Sem campo de escrita do usuário) */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center">
          <div className="p-2.5 rounded-xl bg-gray-200/60 dark:bg-gray-900/60 border border-gray-300/50 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400 italic">
            🔒 Este canal transmite apenas mensagens oficiais enviadas pelo desenvolvedor do sistema.
          </div>
        </div>

      </div>
    </div>
  );
}