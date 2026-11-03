import React, { useState, useEffect } from 'react';
import { buscarProdutos, buscarHistorico } from '../services/api';

export default function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        const dadosProdutos = await buscarProdutos();
        const dadosHistorico = await buscarHistorico();
        setProdutos(dadosProdutos || []);
        setHistorico(dadosHistorico || []);
      } catch (erro) {
        console.error('Erro ao carregar dados do dashboard:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDadosDashboard();
  }, []);

  const totalProdutos = produtos.length;
  const estoqueBaixo = produtos.filter(p => p.qtd <= 3).length;
  const valorEstoque = produtos.reduce((acc, p) => acc + (Number(p.qtd) * Number(p.preco)), 0);
  const totalNotificacoes = historico.length;
  const ultimasMovimentacoes = historico.slice(0, 5);

  if (carregando) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Carregando indicadores do painel...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 text-left">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Painel de Controle - Despensa em Casa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Visão geral e indicadores do seu estoque doméstico inteligente.</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs whitespace-nowrap">
          Residência Ativa
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-6">

        {/* Card 1: Total de Itens */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Total de Itens</span>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{totalProdutos}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 block pt-1">Produtos cadastrados</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-2xl shadow-xs shrink-0">
            📦
          </div>
        </div>

        {/* Card 2: Estoque Baixo */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Estoque Baixo</span>
            <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400">{estoqueBaixo}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 block pt-1">Itens com 3 ou menos un</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-2xl shadow-xs shrink-0">
            ⚠️
          </div>
        </div>

        {/* Card 3: Valor Total em Estoque */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Valor em Estoque</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">R$ {valorEstoque.toFixed(2)}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 block pt-1">Custo total acumulado</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-2xl shadow-xs shrink-0">
            💰
          </div>
        </div>

        {/* Card 4: Histórico / Notificações */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:shadow-md transition">
          <div className="space-y-1 min-w-0 flex-1 text-left">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Notificações</span>
            <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalNotificacoes}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500 block pt-1">Registros (3 meses)</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-2xl shadow-xs shrink-0">
            🔔
          </div>
        </div>

      </div>

      {/* Seção Inferior: Boas-vindas e Atividades Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Bloco de Boas-vindas */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 space-y-4 flex flex-col justify-between text-left">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Bem-vindo ao Sistema GestãoFácil</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Esta aplicação foi desenvolvida no âmbito da disciplina de Atividades de Extensão para apoiar a organização, o controle inteligente e a gestão de suprimentos da despensa residencial.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">
              Utilize o menu lateral esquerdo para navegar entre os módulos: gerencie entradas e consumos de itens em tempo real, visualize relatórios analíticos detalhados ou acompanhe o fluxo completo no <strong>Histórico Geral</strong>.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span>✨ Sistema Atualizado</span>
            <span>•</span>
            <span>Sincronizado com Supabase</span>
            <span>•</span>
            <span>Controle Trimestral Ativo</span>
          </div>
        </div>

        {/* Bloco de Atividades Recentes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4 text-left">
          <h3 className="text-md font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>⚡</span> Atividades Recentes
          </h3>

          {ultimasMovimentacoes.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-8 text-center">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {ultimasMovimentacoes.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.tipo === 'COMPRA' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-emerald-600 dark:bg-emerald-400'}`}></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{item.produto_nome}</p>
                      <span className="text-gray-400 dark:text-gray-500">{item.tipo === 'COMPRA' ? 'Reposição' : 'Consumo'}</span>
                    </div>
                  </div>
                  <span className={`font-bold px-2 py-1 rounded shrink-0 ${
                    item.tipo === 'COMPRA'
                      ? 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10'
                      : 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10'
                  }`}>
                    {item.tipo === 'COMPRA' ? `+${item.quantidade}` : `-${item.quantidade}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}