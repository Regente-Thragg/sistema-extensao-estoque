import React from 'react';

export default function Ajuda() {
  // Substitua com os seus links e informações reais de contato
  const canaisContato = [
    {
      nome: 'WhatsApp',
      descricao: 'Atendimento rápido e direto via mensagem',
      icone: '💬',
      cor: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400',
      link: 'https://wa.me/qr/T2FK45XGPZXXJ1',
      botaoTexto: 'Enviar Mensagem'
    },
    {
      nome: 'Instagram',
      descricao: 'Acompanhe novidades e bastidores do projeto',
      icone: '📸',
      cor: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400',
      link: 'https://www.instagram.com/gamma_jack_2005?vrfl=MWdvb2VoaHAyOWwxOA==',
      botaoTexto: 'Seguir no Instagram'
    },
    {
      nome: 'Facebook',
      descricao: 'Conecte-se e tire dúvidas na rede social',
      icone: '👥',
      cor: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400',
      link: 'https://www.facebook.com/share/1A7v7vHeKm/',
      botaoTexto: 'Acessar Facebook'
    },
    {
      nome: 'E-mail / Gmail',
      descricao: 'Envie um relato detalhado ou solicitação formal',
      icone: '✉️',
      cor: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400',
      link: 'mailto:shikigamispm@gmail.com?subject=Suporte%20-%20GestãoFácil',
      botaoTexto: 'Enviar E-mail'
    }
  ];

  const duvidasFrequentes = [
    {
      pergunta: 'Como faço para cadastrar uma nova categoria?',
      resposta: 'Na página "Itens e Estoque", clique no botão "+ Adicionar Categoria" localizado logo acima do seletor de categorias no formulário de cadastro.'
    },
    {
      pergunta: 'Como o sistema calcula o estoque baixo?',
      resposta: 'O sistema sinaliza automaticamente qualquer item que possua 3 unidades ou menos restantes no estoque com um alerta visual em destaque.'
    },
    {
      pergunta: 'Onde posso acompanhar o histórico de consumo?',
      resposta: 'Basta acessar a aba "Histórico Geral" no menu lateral para visualizar o registro cronológico de todas as entradas (compras) e saídas (consumos).'
    },
    {
      pergunta: 'O sistema funciona no modo escuro?',
      resposta: 'Sim! Você pode alternar para o Modo Escuro utilizando o botão de tema configurado na interface, garantindo conforto visual em qualquer ambiente.'
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span>❓</span> Central de Ajuda e Suporte
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Precisa de suporte com o sistema ou quer entrar em contato com o desenvolvedor? Escolha um canal abaixo.
        </p>
      </div>

      {/* Grid de Canais de Contato Direto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {canaisContato.map((canal, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition hover:shadow-md ${canal.cor}`}
          >
            <div className="space-y-3">
              <span className="text-3xl block">{canal.icone}</span>
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{canal.nome}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{canal.descricao}</p>
            </div>
            <div className="pt-6">
              <a 
                href={canal.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full inline-block text-center py-2 px-4 rounded-xl text-xs font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-xs border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {canal.botaoTexto} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de Perguntas Frequentes (FAQ) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">💡 Perguntas Frequentes (FAQ)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {duvidasFrequentes.map((faq, index) => (
            <div key={index} className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-2">
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{faq.pergunta}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{faq.resposta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé Informativo Acadêmico */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 text-center space-y-2">
        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Sistema GestãoFácil - Atividades de Extensão I</h4>
        <p className="text-xs text-indigo-700 dark:text-indigo-400">
          Desenvolvido com foco em eficiência residencial e gestão inteligente de suprimentos.
        </p>
      </div>
    </div>
  );
}