import React, { useState, useEffect } from 'react';
import { buscarProdutos, buscarHistorico } from '../services/api';

export default function Dashboard() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Carrega os dados de produtos e histórico ao abrir o Dashboard
  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        const dadosProdutos = await buscarProdutos();
        const dadosHistorico = await buscarHistorico();
        setProdutos(dadosProdutos);
        setHistorico(dadosHistorico);
      } catch (erro) {
        console.error('Erro ao carregar dados do dashboard:', erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDadosDashboard();
  }, []);

  // Cálculos dos indicadores principais
  const totalProdutos = produtos.length;
  
  // Itens com estoque baixo (quantidade menor ou igual a 3)
  const estoqueBaixo = produtos.filter(p => p.qtd <= 3).length;

  // Valor total acumulado na despensa (Quantidade * Preço Unitário)
  const valorEstoque = produtos.reduce((acc, p) => acc + (Number(p.qtd) * Number(p.preco)), 0);

  // Total de notificações/movimentações no histórico geral
  const totalNotificacoes = historico.length;

  // Filtra as últimas movimentações de forma segura
  const ultimasMovimentacoes = historico.slice(0, 5);

  if (carregando) {
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando indicadores do painel...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel de Controle - Despensa em Casa</h1>
          <p className="text-sm text-gray-500">Visão geral e indicadores do seu estoque doméstico inteligente.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs">
          Residência Ativa
        </div>
      </div>

      {/* Cards de Resumo e Indicadores Principais (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total de Itens */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total de Itens</span>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">📦</div>
          </div>
          <div className="my-4">
            <h3 className="text-3xl font-bold text-gray-800">{totalProdutos}</h3>
          </div>
          <span className="text-xs text-gray-400">Produtos cadastrados</span>
        </div>

        {/* Card 2: Estoque Baixo */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Estoque Baixo</span>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-xl shrink-0">⚠️</div>
          </div>
          <div className="my-4">
            <h3 className="text-3xl font-bold text-rose-600">{estoqueBaixo}</h3>
          </div>
          <span className="text-xs text-gray-400">Itens com 3 ou menos unidades</span>
        </div>

        {/* Card 3: Valor Total em Estoque */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Valor em Estoque</span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">💰</div>
          </div>
          <div className="my-4">
            <h3 className="text-2xl font-bold text-emerald-600">R$ {valorEstoque.toFixed(2)}</h3>
          </div>
          <span className="text-xs text-gray-400">Custo total acumulado</span>
        </div>

        {/* Card 4: Histórico / Notificações */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Notificações</span>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl shrink-0">🔔</div>
          </div>
          <div className="my-4">
            <h3 className="text-3xl font-bold text-amber-600">{totalNotificacoes}</h3>
          </div>
          <span className="text-xs text-gray-400">Registros (limpeza em 3 meses)</span>
        </div>
      </div>

      {/* Seção Inferior: Boas-vindas e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bloco de Boas-vindas e Contexto do Projeto */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Bem-vindo ao Sistema GestãoFácil</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Esta aplicação foi desenvolvida no âmbito da disciplina de Atividades de Extensão para apoiar a organização, o controle inteligente e a gestão de suprimentos da despensa residencial. 
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-2">
              Utilize o menu lateral esquerdo para navegar entre os módulos: gerencie entradas e consumos de itens em tempo real, visualize relatórios analíticos detalhados ou acompanhe o fluxo completo no <strong>Histórico Geral</strong>.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <span>✨ Sistema Atualizado</span>
            <span>•</span>
            <span>Sincronizado com Supabase</span>
            <span>•</span>
            <span>Controle Trimestral Ativo</span>
          </div>
        </div>

        {/* Bloco de Atividades Recentes (Mini Histórico) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="text-md font-bold text-gray-800 flex items-center gap-2">
            <span>⚡</span> Atividades Recentes
          </h3>

          {ultimasMovimentacoes.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {ultimasMovimentacoes.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.tipo === 'COMPRA' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></span>
                    <div>
                      <p className="font-semibold text-gray-700">{item.produto_nome}</p>
                      <span className="text-gray-400">{item.tipo === 'COMPRA' ? 'Reposição' : 'Consumo'}</span>
                    </div>
                  </div>
                  <span className={`font-bold px-2 py-1 rounded ${item.tipo === 'COMPRA' ? 'text-indigo-700 bg-indigo-50' : 'text-emerald-700 bg-emerald-50'}`}>
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