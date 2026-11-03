export const exportarParaCSV = (dados, nomeArquivo = 'relatorio_estoque.csv') => {
  if (!dados || !dados.length) return;

  // 1. Pega os cabeçalhos das colunas a partir das chaves do objeto
  const headers = Object.keys(dados[0]).join(',');

  // 2. Mapeia cada linha de dados
  const rows = dados.map(item => 
    Object.values(item)
      .map(valor => `"${String(valor ?? '').replace(/"/g, '""')}"`) // Trata aspas duplas e vírgulas
      .join(',')
  );

  // 3. Junta os cabeçalhos com as linhas em formato UTF-8 (com BOM para abrir correto no Excel)
  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');

  // 4. Cria o link de download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};