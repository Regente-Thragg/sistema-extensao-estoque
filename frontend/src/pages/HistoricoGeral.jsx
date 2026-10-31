import React, { useState, useEffect, useRef } from 'react';
import { limparHistorico } from '../services/api';

export default function HistoricoGeral({ historicoInicial }) {
  const [historico, setHistorico] = useState(historicoInicial || []);
  const [abaAtiva, setAbaAtiva] = useState('compra');
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalLimpezaAberto, setModalLimpezaAberto] = useState(false);
  
  // Estado para a chavinha (toggle) de incluir o total gasto na limpeza manual
  const [limparGastoMensal, setLimparGastoMensal] = useState(false);

  // Armazena o total do mês congelado/preservado caso o usuário decida não apagar o gasto mensal
  const [gastoMensalPreservado, setGastoMensalPreservado] = useState(() => {
    const salvo = localStorage.getItem('gasto_mensal_preservado');
    return salvo ? JSON.parse(salvo) : null;
  });

  const menuRef = useRef(null);

  useEffect(() => {
    setHistorico(historicoInicial || []);
  }, [historicoInicial]);

  // Fecha o menu dropdown ao clicar fora
  useEffect(() => {
    function handleClickFora(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Identifica o mês e ano corrente
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // Compras do mês vindas diretamente do histórico atual
  const comprasDoMesAtual = historico.filter(item => {
    if (item.tipo !== 'COMPRA') return false;
    const dataItem = new Date(item.data_registro);
    return dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual;
  });

  // Se o histórico foi limpo mas temos um valor preservado salvo, usamos ele. Caso contrário, usamos o do mês.
  const comprasConsideradas = historico.length === 0 && gastoMensalPreservado !== null 
    ? gastoMensalPreservado 
    : comprasDoMesAtual;

  // Cálculo do total gasto no mês corrente
  const totalGastoMes = comprasConsideradas.reduce((acc, item) => {
    const qtd = Number(item.quantidade) || 0;
    const preco = Number(item.preco_unitario) || 0;
    return acc + (qtd * preco);
  }, 0);

  const itensFiltrados = historico.filter(item => {
    if (abaAtiva === 'compra') return item.tipo === 'COMPRA';
    if (abaAtiva === 'consumo') return item.tipo === 'CONSUMO';
    return true;
  });

  // Confirmação da Limpeza Manual
  const confirmarLimpezaManual = async () => {
    // Se o usuário DESLIGOU a chavinha, salvamos o gasto atual antes de apagar o banco
    if (!limparGastoMensal) {
      const snapshotAtual = comprasDoMesAtual;
      setGastoMensalPreservado(snapshotAtual);
      localStorage.setItem('gasto_mensal_preservado', JSON.stringify(snapshotAtual));
    } else {
      // Se a chavinha está LIGADA, limpamos também o preservado
      setGastoMensalPreservado(null);
      localStorage.removeItem('gasto_mensal_preservado');
    }

    const resultado = await limparHistorico();
    if (resultado && !resultado.erro) {
      setHistorico([]);
      setModalLimpezaAberto(false);
      setMenuAberto(false);
    } else {
      alert('Erro ao limpar o histórico.');
    }
  };

  return (
    <div className="p-8 space-y-6 relative">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Histórico Geral (Notificações)</h1>
        
        <div className="flex items-center gap-3">
          {/* Botão Dropdown "Limpar Histórico de Notificações" */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium shadow-sm flex items-center gap-2 transition"
            >
              <span>🗑️ Limpar Histórico de Notificações</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${menuAberto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Caixa Dropdown com o aviso, toggle e botão */}
            {menuAberto && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-5 z-50 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 text-sm">Gerenciamento do Histórico</h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 border border-amber-100 p-3 rounded-xl text-amber-900">
                    💡 Este sistema conta com um limpador automático que realiza a limpeza a cada três meses. Caso deseje, você também pode efetuar a limpeza manualmente.
                  </p>
                </div>

                {/* Switch / Toggle para incluir o gasto mensal */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-xs font-medium text-gray-700">Zerar total gasto do mês?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={limparGastoMensal} 
                      onChange={(e) => setLimparGastoMensal(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button
                  onClick={() => setModalLimpezaAberto(true)}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 px-4 rounded-xl text-xs transition shadow-sm"
                >
                  Limpar todo o histórico de notificações
                </button>
              </div>
            )}
          </div>

          {/* Contador de Registros */}
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Registros:</span>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {historico.length}
            </span>
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setAbaAtiva('compra')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm ${
            abaAtiva === 'compra'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          🛒 Histórico de Compras ({historico.filter(i => i.tipo === 'COMPRA').length})
        </button>

        <button
          onClick={() => setAbaAtiva('consumo')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm ${
            abaAtiva === 'consumo'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          📦 Histórico de Consumo ({historico.filter(i => i.tipo === 'CONSUMO').length})
        </button>

        <button
          onClick={() => setAbaAtiva('gastoMes')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm ${
            abaAtiva === 'gastoMes'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          💵 Total Gasto no Mês (R$ {totalGastoMes.toFixed(2)})
        </button>
      </div>

      {/* Renderização do Conteúdo de Acordo com a Aba Ativa */}
      {abaAtiva === 'gastoMes' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Balanço Financeiro - Mês Corrente</h3>
              <p className="text-xs text-gray-500 mt-1">Soma de todas as compras e reposições efetuadas no mês atual.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-2xl text-right">
              <span className="text-xs block font-medium uppercase tracking-wider text-amber-600">Total Acumulado</span>
              <span className="text-2xl font-black">R$ {totalGastoMes.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-700">Itens Comprados neste Mês ({comprasConsideradas.length})</h4>

            {comprasConsideradas.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhum gasto registrado para este mês até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {comprasConsideradas.map((item, index) => (
                  <div key={item.id || index} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">🛒</span>
                      <div>
                        <h5 className="font-semibold text-gray-800 text-sm">{item.produto_nome}</h5>
                        <p className="text-xs text-gray-400">{formatarData(item.data_registro)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                        +{item.quantidade} un
                      </span>
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        R$ {(Number(item.quantidade) * Number(item.preco_unitario || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">
            {abaAtiva === 'compra' ? 'Registro de Compras e Reposições' : 'Registro de Consumos Domésticos'}
          </h3>

          {itensFiltrados.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              Nenhum registro encontrado nesta aba até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {itensFiltrados.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50/30 transition shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full text-white ${item.tipo === 'COMPRA' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                      {item.tipo === 'COMPRA' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{item.produto_nome}</h4>
                      <p className="text-xs text-gray-500">
                        {item.tipo === 'COMPRA' ? 'Adicionado ao estoque' : 'Retirado para uso'} • {formatarData(item.data_registro)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      item.tipo === 'COMPRA' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.tipo === 'COMPRA' ? `+${item.quantidade} un` : `-${item.quantidade} un`}
                    </span>
                    {item.preco_unitario && (
                      <p className="text-xs font-semibold text-gray-600 mt-1">
                        R$ {Number(item.preco_unitario).toFixed(2)} un
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA MANUAL */}
      {modalLimpezaAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl text-xl">🗑️</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Limpeza Manual do Histórico</h3>
                <p className="text-xs text-gray-500">Ação de gerenciamento geral.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              Tem certeza que deseja apagar <strong className="text-gray-800">todo o histórico de notificações</strong>? 
              {limparGastoMensal ? (
                <span className="block mt-1 text-rose-700 font-medium">⚠️ O total gasto no mês corrente também será zerado.</span>
              ) : (
                <span className="block mt-1 text-emerald-700 font-medium">🛡️ O total gasto no mês corrente será preservado (conforme sua configuração).</span>
              )}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setModalLimpezaAberto(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarLimpezaManual}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}