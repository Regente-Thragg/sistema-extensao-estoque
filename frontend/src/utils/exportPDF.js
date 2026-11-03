import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportarParaPDF = (produtos, titulo = 'Relatório de Inventário - GestãoFácil') => {
  const doc = new jsPDF();

  // Cabeçalho / Título do Relatório
  doc.setFontSize(18);
  doc.text(titulo, 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  // Mapeamento das colunas e linhas
  const tableColumn = ["Nome do Produto", "Categoria", "Qtd", "Valor Unit. (R$)"];
  const tableRows = [];

  produtos.forEach(item => {
    const itemData = [
      item.nome || item.nome_produto || 'Produto',
      item.categoria || 'Geral',
      item.quantidade !== undefined ? item.quantidade : (item.qtd !== undefined ? item.qtd : 0),
      item.preco ? Number(item.preco).toFixed(2) : '0.00'
    ];
    tableRows.push(itemData);
  });

  // Geração da Tabela Formatada
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // Cor violeta/azul combinando com o tema
  });

  // Salvar / Baixar o arquivo
  doc.save(`${titulo.toLowerCase().replace(/ /g, '_')}.pdf`);
};