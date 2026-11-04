import React, { useState, useEffect } from 'react';

export default function Configuracoes() {
  const [nomeResidencia, setNomeResidencia] = useState('Despensa em Casa');
  const [limiteEstoque, setLimiteEstoque] = useState(3);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const resSalva = localStorage.getItem('gestao_residencia');
    const limiteSalvo = localStorage.getItem('gestao_limite_baixo');
    if (resSalva) setNomeResidencia(resSalva);
    if (limiteSalvo) setLimiteEstoque(Number(limiteSalvo));
  }, []);

  const handleSalvar = (e) => {
    e.preventDefault();
    localStorage.setItem('gestao_residencia', nomeResidencia);
    localStorage.setItem('gestao_limite_baixo', limiteEstoque);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configurações e Perfil</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Personalize os dados da sua residência e ajuste os parâmetros operacionais do sistema.</p>
      </div>

      {salvo && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-medium">
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSalvar} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 max-w-xl">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome da Residência / Projeto
          </label>
          <input
            type="text"
            value={nomeResidencia}
            onChange={(e) => setNomeResidencia(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Limite Padrão para Estoque Baixo (unidades)
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={limiteEstoque}
            onChange={(e) => setLimiteEstoque(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-xs text-gray-400">Produtos com quantidade igual ou inferior a este valor aparecerão destacados nos alertas de estoque crítico.</p>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-sm transition"
        >
          Salvar Alterações
        </button>
      </form>
    </div>
  );
}