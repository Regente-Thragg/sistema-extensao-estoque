import React, { useState, useEffect } from 'react';

export default function Produtos({ produtos: produtosIniciais, onCriar, onRepor, onConsumo, onExcluir }) {
  const [produtos, setProdutos] = useState(produtosIniciais || []);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [qtd, setQtd] = useState('');
  const [preco, setPreco] = useState('');
  const [validade, setValidade] = useState('');

  const [precosReposicao, setPrecosReposicao] = useState({});
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);

  const [modalAlertaAberto, setModalAlertaAberto] = useState(false);
  const [mensagemAlerta, setMensagemAlerta] = useState('');

  useEffect(() => {
    setProdutos(produtosIniciais || []);
  }, [produtosIniciais]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !categoria || !qtd || !preco) return;

    const novoProduto = { 
      nome, 
      categoria, 
      qtd: Number(qtd), 
      preco: Number(preco), 
      validade: validade || null 
    };
    
    const resultado = await onCriar(novoProduto);
    if (resultado && !resultado.erro) {
      setProdutos([...produtos, resultado]);
      setNome(''); setCategoria(''); setQtd(''); setPreco(''); setValidade('');
    }
  };

  const handleConsumoLocal = async (produto) => {
    if (produto.qtd <= 0) {
      setMensagemAlerta(`O item "${produto.nome}" está sem estoque disponível para consumo!`);
      setModalAlertaAberto(true);
      return;
    }
    const atualizado = await onConsumo(produto.id, 1);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === produto.id ? atualizado : p));
    } else {
      setMensagemAlerta(atualizado?.erro || 'Erro ao registrar consumo.');
      setModalAlertaAberto(true);
    }
  };

  const handleReporLocal = async (produto) => {
    const novoPrecoDigitado = precosReposicao[produto.id];
    const precoEnvio = novoPrecoDigitado !== undefined && novoPrecoDigitado !== '' ? Number(novoPrecoDigitado) : null;

    const atualizado = await onRepor(produto.id, 1, precoEnvio);
    if (atualizado && !atualizado.erro) {
      setProdutos(produtos.map(p => p.id === produto.id ? atualizado : p));
      setPrecosReposicao(prev => ({ ...prev, [produto.id]: '' }));
    }
  };

  const abrirModalExcluir = (produto) => {
    setProdutoParaExcluir(produto);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;
    await onExcluir(produtoParaExcluir.id);
    setProdutos(produtos.filter(p => p.id !== produtoParaExcluir.id));
    setModalExcluirAberto(false);
    setProdutoParaExcluir(null);
  };

  const formatarValidade = (dataValidade) => {
    if (!dataValidade) return { texto: 'Não informada', classe: 'bg-gray-100 text-gray-500' };

    const partes = String(dataValidade).split('T')[0].split('-');
    if (partes.length !== 3) return { texto: 'Não informada', classe: 'bg-gray-100 text-gray-500' };

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const validadeItem = new Date(ano, mes, dia);
    if (isNaN(validadeItem.getTime())) {
      return { texto: 'Não informada', classe: 'bg-gray-100 text-gray-500' };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffTempo = validadeItem.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
    
    const diaFmt = String(dia).padStart(2, '0');
    const mesFmt = String(mes + 1).padStart(2, '0');
    const dataFormatada = `${diaFmt}/${mesFmt}/${ano}`;

    if (diffDias < 0) {
      return { texto: `Vencido (${dataFormatada})`, classe: 'bg-red-100 text-red-700 font-bold' };
    } else if (diffDias === 0) {
      return { texto: `Vence hoje! (${dataFormatada})`, classe: 'bg-red-100 text-red-700 font-bold' };
    } else if (diffDias <= 7) {
      return { texto: `Vence em ${diffDias}d (${dataFormatada})`, classe: 'bg-amber-100 text-amber-800 font-semibold' };
    } else {
      return { texto: dataFormatada, classe: 'bg-emerald-50 text-emerald-700 font-medium' };
    }
  };

  const categoriasUnicas = ['TODAS', ...new Set(produtos.map(p => p.categoria))];

  const produtosFiltrados = produtos.filter(p => {
    const correspondeNome = p.nome.toLowerCase().includes(busca.toLowerCase());
    const correspondeCategoria = categoriaFiltro === 'TODAS' || p.categoria === categoriaFiltro;
    return correspondeNome && correspondeCategoria;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 relative">
      <h1 className="text-2xl font-bold text-gray-800">Controle de Despensa e Estoque Doméstico</h1>

      {/* Formulário de Cadastro */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome do Item</label>
          <input 
            type="text" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            placeholder="Ex: Arroz 5kg" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
          <input 
            type="text" 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)} 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            placeholder="Ex: Alimentos" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
          <input 
            type="number" 
            value={qtd} 
            onChange={(e) => setQtd(e.target.value)} 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            placeholder="0" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preço Unitário (R$)</label>
          <input 
            type="number" 
            step="0.01" 
            value={preco} 
            onChange={(e) => setPreco(e.target.value)} 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
            placeholder="0.00" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Validade</label>
          <input 
            type="date" 
            value={validade} 
            onChange={(e) => setValidade(e.target.value)} 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
          />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 px-3 rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm h-[38px]">
          Cadastrar
        </button>
      </form>

      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Pesquisar por Nome</label>
          <input 
            type="text" 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)} 
            placeholder="Digite para buscar um item..." 
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Filtrar por Categoria</label>
          <select 
            value={categoriaFiltro} 
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="w-full bg-white text-gray-900 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            {categoriasUnicas.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lista de Itens ({produtosFiltrados.length} encontrados)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-3 px-3">Nome</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Quantidade</th>
                <th className="py-3 px-3">Preço Unitário</th>
                <th className="py-3 px-3">Validade</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-400">Nenhum item encontrado com os filtros atuais.</td>
                </tr>
              ) : (
                produtosFiltrados.map((p) => {
                  const statusValidade = formatarValidade(p.validade);
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-3 font-semibold text-gray-800">{p.nome}</td>
                      <td className="py-3 px-3">{p.categoria}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${p.qtd <= 3 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.qtd} un
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">R$ {Number(p.preco).toFixed(2)}</div>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Novo preço?" 
                            value={precosReposicao[p.id] || ''}
                            onChange={(e) => setPrecosReposicao({ ...precosReposicao, [p.id]: e.target.value })}
                            className="w-28 bg-white text-gray-900 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            title="Digite o novo preço unitário caso tenha alterado na reposição"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs inline-block whitespace-nowrap ${statusValidade.classe}`}>
                          {statusValidade.texto}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 min-w-[200px]">
                          <button 
                            onClick={() => handleReporLocal(p)} 
                            className="w-full sm:w-auto bg-indigo-600 text-white py-1.5 px-2.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition shadow-sm"
                            title="Repor +1"
                          >
                            + Repor
                          </button>
                          <button 
                            onClick={() => handleConsumoLocal(p)} 
                            className="w-full sm:w-auto bg-emerald-600 text-white py-1.5 px-2.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition shadow-sm"
                            title="Consumo -1"
                          >
                            - Consumo
                          </button>
                          <button 
                            onClick={() => abrirModalExcluir(p)} 
                            className="w-full sm:w-auto bg-rose-600 text-white py-1.5 px-2.5 rounded-lg text-xs font-medium hover:bg-rose-700 transition shadow-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl text-xl">⚠️</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Confirmar Exclusão</h3>
                <p className="text-xs text-gray-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              Tem certeza que deseja excluir permanentemente o item <strong className="text-gray-800">{produtoParaExcluir?.nome}</strong> do estoque?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setModalExcluirAberto(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarExclusao}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA CUSTOMIZADO */}
      {modalAlertaAberto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl text-xl">⚠️</div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Atenção ao Estoque</h3>
                <p className="text-xs text-gray-500">Operação não realizada.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed">
              {mensagemAlerta}
            </p>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setModalAlertaAberto(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}