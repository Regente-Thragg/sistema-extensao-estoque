import React, { useState, useEffect } from 'react';
import { buscarProdutos } from '../services/api';

export default function Relatorios() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      const dados = await buscarProdutos();
      setProdutos(dados);
    }
    carregarDados();
  }, []);

  // Cálculos dos indicadores
  const totalItens = produtos.length;
  const quantidadeTotalEstoque = produtos.reduce((acc, p) => acc + Number(p.qtd), 0);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (Number(p.qtd) * Number(p.preco)), 0);
  const produtosEstoqueBaixo = produtos.filter(p => p.qtd <= 3);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios e Indicadores do Negócio</h1>
      <p className="text-sm text-gray-600">Acompanhe métricas financeiras e operacionais para otimizar o capital de giro e evitar rupturas no estoque.</p>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Cadastros Diferentes</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalItens} produtos</h3>
          <p className="text-xs text-gray-400 mt-1">Variedade no catalogo</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Volume Total em Estoque</p>
          <h3 className="text-2xl font-bold text-indigo-600 mt-1">{quantidadeTotalEstoque} unidades</h3>
          <p className="text-xs text-gray-400 mt-1">Soma de todas as quantidades</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Valor Total Investido</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">R$ {valorTotalEstoque.toFixed(2)}</h3>
          <p className="text-xs text-gray-400 mt-1">Capital alocado em mercadorias</p>
        </div>
      </div>

      {/* Alertas de Estoque Baixo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800">⚠️ Alerta de Estoque Baixo (≤ 3 unidades)</h3>
        {produtosEstoqueBaixo.length === 0 ? (
          <p className="text-sm text-emerald-600 font-medium">Parabéns! Nenhum produto com estoque crítico no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="py-3 px-4">Nome do Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Quantidade Restante</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {produtosEstoqueBaixo.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-red-50">
                    <td className="py-3 px-4 font-medium">{p.nome}</td>
                    <td className="py-3 px-4">{p.categoria}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">
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