import React, { useState, useEffect } from 'react';

export default function Produtos({ produtos: produtosIniciais, categorias: categoriasIniciais, onCriar, onEditar, onRepor, onConsumo, onExcluir, onCriarCategoria }) {
  const [produtos, setProdutos] = useState(produtosIniciais || []);
  const [categorias, setCategorias] = useState(categoriasIniciais || []);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [qtd, setQtd] = useState('');
  const [preco, setPreco] = useState('');
  const [validade, setValidade] = useState('');

  const [novaCategoriaModal, setNovaCategoriaModal] = useState(false);
  const [nomeNovaCategoria, setNomeNovaCategoria] = useState('');

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

  useEffect(() => {
    setCategorias(categoriasIniciais || []);
    if (categoriasIniciais && categoriasIniciais.length > 0 && !categoria) {
      setCategoria(categoriasIniciais[0].nome);
    }
  }, [categoriasIniciais]);

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
      setNome(''); setQtd(''); setPreco(''); setValidade('');
    }
  };

  const handleAdicionarCategoria = async (e) => {
    e.preventDefault();
    if (!nomeNovaCategoria.trim()) return;

    const res = await onCriarCategoria(nomeNovaCategoria.trim());
    if (res && !res.erro) {
      setCategoria(res.nome);
      setNomeNovaCategoria('');
      setNovaCategoriaModal(false);
    } else {
      setMensagemAlerta(res?.erro || 'Erro ao criar categoria.');
      setModalAlertaAberto(true);
    }
  };

  const handleConsumoLocal = async (produto) => {
    if (produto.qtd <= 0) {
      setMensagemAlerta(`O item "${produto.nome}" está sem estoque disponível!`);
      setModalAlertaAberto(true);
      return;
    }
    await onConsumo(produto.id, 1);
  };

  const handleReporLocal = async (produto) => {
    const novoPrecoDigitado = precosReposicao[produto.id];
    const precoEnvio = novoPrecoDigitado !== undefined && novoPrecoDigitado !== '' ? Number(novoPrecoDigitado) : null;
    await onRepor(produto.id, 1, precoEnvio);
    setPrecosReposicao(prev => ({ ...prev, [produto.id]: '' }));
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;
    await onExcluir(produtoParaExcluir.id);
    setModalExcluirAberto(false);
    setProdutoParaExcluir(null);
  };

  const formatarValidade = (dataValidade) => {
    if (!dataValidade) return { texto: 'Não informada', classe: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };
    const partes = String(dataValidade).split('T')[0].split('-');
    if (partes.length !== 3) return { texto: 'Não informada', classe: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };

    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);
    const validadeItem = new Date(ano, mes, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diffTempo = validadeItem.getTime() - hoje.getTime();
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;

    if (diffDias < 0) return { texto: `Vencido (${dataFormatada})`, classe: 'bg-red-100 dark:bg-red-500/20 text-red-700 font-bold' };
    if (diffDias === 0) return { texto: `Vence hoje! (${dataFormatada})`, classe: 'bg-red-100 dark:bg-red-500/20 text-red-700 font-bold' };
    if (diffDias <= 7) return { texto: `Vence em ${diffDias}d (${dataFormatada})`, classe: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 font-semibold' };
    return { texto: dataFormatada, classe: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 font-medium' };
  };

  const categoriasFiltroOpcoes = ['TODAS', ...categorias.map(c => c.nome)];
  const produtosFiltrados = produtos.filter(p => {
    const correspondeNome = p.nome.toLowerCase().includes(busca.toLowerCase());
    const correspondeCategoria = categoriaFiltro === 'TODAS' || p.categoria === categoriaFiltro;
    return correspondeNome && correspondeCategoria;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 relative text-left">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Controle de Despensa e Estoque Doméstico</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nome do Item</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" placeholder="Ex: Arroz 5kg" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Categoria</label>
          <button type="button" onClick={() => setNovaCategoriaModal(true)} className="mb-1.5 w-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-200 py-1 rounded-lg text-xs font-semibold transition text-center">+ Adicionar Categoria</button>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm">
            {categorias.map(cat => <option key={cat.id || cat.nome} value={cat.nome}>{cat.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quantidade</label>
          <input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" placeholder="0" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Preço Unitário (R$)</label>
          <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" placeholder="0.00" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Validade</label>
          <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 px-3 rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm h-[38px]">Cadastrar</button>
      </form>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Pesquisar por Nome</label>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar um item..." className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Filtrar por Categoria</label>
          <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm">
            {categoriasFiltroOpcoes.map((cat, index) => <option key={index} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Lista de Itens ({produtosFiltrados.length} encontrados)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-sm">
                <th className="py-3 px-3">Nome</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Quantidade</th>
                <th className="py-3 px-3">Preço Unitário</th>
                <th className="py-3 px-3">Validade</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 dark:text-gray-200">
              {produtosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="py-4 text-center text-gray-400">Nenhum item encontrado.</td></tr>
              ) : (
                produtosFiltrados.map((p) => {
                  const statusValidade = formatarValidade(p.validade);
                  return (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-100">{p.nome}</td>
                      <td className="py-3 px-3">{p.categoria}</td>
                      <td className="py-3 px-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${p.qtd <= 3 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.qtd} un</span></td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800 dark:text-gray-100">R$ {Number(p.preco).toFixed(2)}</div>
                          <input type="number" step="0.01" placeholder="Novo preço?" value={precosReposicao[p.id] || ''} onChange={(e) => setPrecosReposicao({ ...precosReposicao, [p.id]: e.target.value })} className="w-28 bg-white dark:bg-gray-800 text-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs" />
                        </div>
                      </td>
                      <td className="py-3 px-3"><span className={`px-2.5 py-1 rounded-full text-xs inline-block whitespace-nowrap ${statusValidade.classe}`}>{statusValidade.texto}</span></td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-row items-center justify-center gap-1.5">
                          <button onClick={() => handleReporLocal(p)} className="w-24 bg-indigo-600 text-white py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm">+ Repor</button>
                          <button onClick={() => handleConsumoLocal(p)} className="w-24 bg-emerald-600 text-white py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm">- Consumo</button>
                          <button onClick={() => { setProdutoParaExcluir(p); setModalExcluirAberto(true); }} className="w-24 bg-rose-600 text-white py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-rose-700 shadow-sm">Excluir</button>
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

      {novaCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Nova Categoria</h3>
            <form onSubmit={handleAdicionarCategoria} className="space-y-3">
              <input type="text" value={nomeNovaCategoria} onChange={(e) => setNomeNovaCategoria(e.target.value)} placeholder="Ex: Laticínios..." className="w-full bg-white dark:bg-gray-800 text-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm" autoFocus />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setNovaCategoriaModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Confirmar Exclusão</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Tem certeza que deseja excluir permanentemente o item <strong className="text-gray-800 dark:text-gray-100">{produtoParaExcluir?.nome}</strong>?</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModalExcluirAberto(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Cancelar</button>
              <button onClick={confirmarExclusao} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white shadow-sm">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}

      {modalAlertaAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Atenção</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{mensagemAlerta}</p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setModalAlertaAberto(false)} className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}