import React, { useState, useEffect } from 'react';
import { buscarProdutos, buscarHistorico } from '../services/api';

export default function Relatorios() {
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const dadosProdutos = await buscarProdutos();
      const dadosHistorico = await buscarHistorico();
      setProdutos(dadosProdutos || []);
      setHistorico(dadosHistorico || []);
    }
    carregarDados();
  }, []);

  // Cálculos dos indicadores principais
  const totalItens = produtos.length;
  const quantidadeTotalEstoque = produtos.reduce((acc, p) => acc + Number(p.qtd), 0);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (Number(p.qtd) * Number(p.preco)), 0);
  const produtosEstoqueBaixo = produtos.filter(p => p.qtd <= 3);

  // Agrupamento para o gráfico de consumo/distribuição por categoria
  const categoriasMap = {};
  produtos.forEach(p => {
    const cat = p.categoria || 'Geral';
    categoriasMap[cat] = (categoriasMap[cat] || 0) + Number(p.qtd);
  });

  // Total de itens retirados com base no histórico de consumo
  const totalHistoricoConsumo = historico
    .filter(h => h.tipo === 'CONSUMO')
    .reduce((acc, h) => acc + Number(h.quantidade), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relatórios e Gráficos de Consumo</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">Acompanhe métricas financeiras, estoque crítico e o panorama visual de consumo da sua despensa.</p>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cadastros Diferentes</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{totalItens} produtos</h3>
          <p className="text-xs text-gray-400 mt-1">Variedade no catálogo</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 font-medium">Volume Total em Estoque</p>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{quantidadeTotalEstoque} unidades</h3>
          <p className="text-xs text-gray-400 mt-1">Soma de todas as quantidades</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 font-medium">Valor Total Investido</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">R$ {valorTotalEstoque.toFixed(2)}</h3>
          <p className="text-xs text-gray-400 mt-1">Capital alocado em mercadorias</p>
        </div>
      </div>

      {/* Seção de Gráficos de Consumo e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Barras de Progresso por Categoria */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">📊 Distribuição de Estoque por Categoria</h3>
          {Object.keys(categoriasMap).length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhum produto cadastrado para gerar o gráfico.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(categoriasMap).map(([cat, qtd]) => {
                const percentual = quantidadeTotalEstoque > 0 ? Math.round((qtd / quantidadeTotalEstoque) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
                      <span>{cat}</span>
                      <span>{qtd} un ({percentual}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentual}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico 2: Resumo Geral de Consumo */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">📈 Resumo de Consumo Geral</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total de saídas registradas no histórico de consumo.</p>
          </div>
          <div className="py-8 text-center space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalHistoricoConsumo} un</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Itens consumidos pela residência</p>
          </div>
          <div className="text-xs text-gray-400 text-center">
            Atualizado em tempo real com base nas baixas do estoque.
          </div>
        </div>
      </div>

      {/* Alertas de Estoque Baixo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">⚠️ Alerta de Estoque Baixo (≤ 3 unidades)</h3>
        {produtosEstoqueBaixo.length === 0 ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Parabéns! Nenhum produto com estoque crítico no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                  <th className="py-3 px-4">Nome do Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Quantidade Restante</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700 dark:text-gray-300">
                {produtosEstoqueBaixo.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-red-50/50 dark:hover:bg-red-950/20">
                    <td className="py-3 px-4 font-medium">{p.nome}</td>
                    <td className="py-3 px-4">{p.categoria}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                        {p.qtd} unidades
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}