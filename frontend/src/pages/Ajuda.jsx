import React from 'react';

export default function Ajuda() {
  const canaisContato = [
    {
      nome: 'WhatsApp',
      descricao: 'Atendimento rápido e direto via mensagem',
      icone: (
        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
      cor: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400',
      link: 'https://wa.me/5567998047098?text=Olá,%20preciso%20de%20suporte%20no%20sistema%20GestãoFácil!',
      botaoTexto: 'Enviar Mensagem'
    },
    {
      nome: 'Instagram',
      descricao: 'Acompanhe novidades e bastidores do projeto',
      icone: (
        <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      cor: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400',
      link: 'https://www.instagram.com/victor.hugo.git?cplk=MWdvb2VoaHAyOWwxOA==',
      botaoTexto: 'Seguir no Instagram'
    },
    {
      nome: 'Facebook',
      descricao: 'Conecte-se e tire dúvidas na rede social',
      icone: (
        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.373 14.5 5 15.5 5H18V0h-3.808C10.59 0 9 1.581 9 4.75V8z"/>
        </svg>
      ),
      cor: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400',
      link: 'https://www.facebook.com/share/1CYbyJV9xE/',
      botaoTexto: 'Acessar Facebook'
    },
    {
      nome: 'E-mail / Gmail',
      descricao: 'Envie um relato detalhado ou solicitação formal',
      icone: (
        <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.713v15.426h24v-15.426l-12 9.713z"/>
        </svg>
      ),
      cor: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400',
      link: 'https://mail.google.com/mail/?view=cm&fs=1&to=support.easymanagement@gmail.com&su=Suporte%20-%20GestãoFácil',
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

      {/* Grid de Canais de Contato Direto com Ícones Oficiais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {canaisContato.map((canal, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition hover:shadow-md ${canal.cor}`}
          >
            <div className="space-y-3">
              <div className="mb-2">{canal.icone}</div>
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