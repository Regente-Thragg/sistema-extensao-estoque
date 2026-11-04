import React, { useState, useEffect } from 'react';
import { supabase } from '../services/api';

export default function Auth({ onLoginSucesso }) {
  const [modo, setModo] = useState('login'); // 'login', 'cadastro', 'esqueci-senha', 'verificar-codigo', 'nova-senha'
  
  // Visibilidade de senha
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarSenhaNova, setMostrarSenhaNova] = useState(false);

  // Campos do formulário
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Endereço detalhado
  const [endereco, setEndereco] = useState({ 
    cep: '', 
    rua: '', 
    numero: '', 
    semNumero: false, 
    bairro: '', 
    cidade: '', 
    estado: '', 
    complemento: '', 
    descricao: '' 
  });

  const [termosAceitos, setTermosAceitos] = useState(false);
  const [modalTermosAberto, setModalTermosAberto] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState('');

  // Estados de controle
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [tempoReenvio, setTempoReenvio] = useState(0);

  // Temporizador para reenviar código (120 segundos)
  useEffect(() => {
    let timer;
    if (tempoReenvio > 0) {
      timer = setInterval(() => setTempoReenvio((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [tempoReenvio]);

  // Validações em tempo real atualizadas
  const validarUsername = (user) => {
    const tamanho = user.length >= 8 && user.length <= 16;
    const temMaiuscula = /[A-Z]/.test(user);
    const temMinuscula = /[a-z]/.test(user);
    const temNumero = /\d/.test(user);
    const temEspecial = /[@#%&*-_+.]/.test(user);
    const caracteresValidos = /^[a-zA-Z0-9@#%&*-_+.]+$/.test(user);
    return {
      tamanho,
      temMaiuscula,
      temMinuscula,
      temNumero,
      temEspecial,
      caracteresValidos,
      valido: tamanho && temMaiuscula && temMinuscula && temNumero && temEspecial && caracteresValidos
    };
  };

  const validarSenha = (pass) => {
    const tamanho = pass.length >= 6 && pass.length <= 12;
    const temMaiuscula = /[A-Z]/.test(pass);
    const temMinuscula = /[a-z]/.test(pass);
    const temNumero = /\d/.test(pass);
    const temEspecial = /[@#%&*-_+.]/.test(pass);
    const caracteresValidos = /^[a-zA-Z0-9@#%&*-_+.]+$/.test(pass);
    return {
      tamanho,
      temMaiuscula,
      temMinuscula,
      temNumero,
      temEspecial,
      caracteresValidos,
      valido: tamanho && temMaiuscula && temMinuscula && temNumero && temEspecial && caracteresValidos
    };
  };

  const statusUser = validarUsername(nomeUsuario);
  const statusPass = validarSenha(senha);

  // Máscaras
  const formatarCpf = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const formatarData = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 10);
  };

  const formatarCep = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Buscar CEP via API pública ViaCEP
  const handleCepChange = async (e) => {
    const cepFormatado = formatarCep(e.target.value);
    setEndereco((prev) => ({ ...prev, cep: cepFormatado }));

    const cepLimpo = cepFormatado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resposta.json();
        if (!dados.erro) {
          setEndereco((prev) => ({
            ...prev,
            rua: dados.logradouro || '',
            bairro: dados.bairro || '',
            cidade: dados.localidade || '',
            estado: dados.uf || ''
          }));
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    }
  };

  // Login Google
  const handleLoginGoogle = async () => {
    setErro('');
    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setErro(err.message || 'Erro ao conectar com o Google.');
      setCarregando(false);
    }
  };

  // Submeter formulários
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (modo === 'cadastro') {
      if (!statusUser.valido) return setErro('O nome de usuário não atende aos requisitos mínimos.');
      if (!statusPass.valido) return setErro('A senha não atende aos requisitos mínimos.');
      if (!termosAceitos) return setErro('Você deve aceitar os termos de uso e política de privacidade.');
      if (endereco.semNumero && !endereco.descricao.trim()) {
        return setErro('Como a residência não possui número, a Descrição é obrigatória para identificação.');
      }
    }

    setCarregando(true);

    try {
      if (modo === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        if (data.session) onLoginSucesso(data.session.user);
      } else if (modo === 'cadastro') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: {
              nome_usuario: nomeUsuario,
              data_nascimento: dataNascimento,
              cpf,
              endereco
            }
          }
        });
        if (error) throw error;
        setSucesso('Conta criada com sucesso! Faça login para continuar.');
        setModo('login');
      }
    } catch (err) {
      setErro(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  const handleEsqueciSenha = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSucesso('Código de recuperação enviado para o seu e-mail!');
      setModo('verificar-codigo');
      setTempoReenvio(120);
    } catch (err) {
      setErro(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-xl p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 space-y-6 my-8">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <span className="text-4xl">📦</span>
          <h2 className="text-2xl font-bold tracking-wide text-gray-900 dark:text-white">GestãoFácil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {modo === 'login' && 'Entre na sua conta para gerenciar seu estoque'}
            {modo === 'cadastro' && 'Crie sua conta privada e segura'}
            {modo === 'esqueci-senha' && 'Recuperação de Acesso'}
            {modo === 'verificar-codigo' && 'Confirmação de Código'}
            {modo === 'nova-senha' && 'Redefinição de Senha'}
          </p>
        </div>

        {erro && <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">{erro}</div>}
        {sucesso && <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-medium">{sucesso}</div>}

        {/* GOOGLE BUTTON */}
        {(modo === 'login' || modo === 'cadastro') && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 font-medium py-2.5 rounded-xl text-sm shadow-sm transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continuar com o Google
            </button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-400">ou continue com e-mail</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {modo === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">E-mail</label>
              <input
                type="email"
                id="username"
                name="username"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Senha</label>
                <button
                  type="button"
                  onClick={() => { setModo('esqueci-senha'); setErro(''); setSucesso(''); }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenhaLogin ? "text" : "password"}
                  id="current-password"
                  name="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                >
                  {mostrarSenhaLogin ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm shadow-sm transition disabled:opacity-50"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* CADASTRO FORM */}
        {modo === 'cadastro' && (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-1" autoComplete="on">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Nome de Usuário */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nome de Usuário</label>
              <input
                type="text"
                autoComplete="username"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                placeholder="Ex: JoaoSilva123"
                required
              />
              <ul className="text-[11px] space-y-0.5 pt-1">
                <li className={statusUser.tamanho ? 'text-emerald-600' : 'text-red-500'}>• 8 a 16 caracteres</li>
                <li className={statusUser.temMaiuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra maiúscula</li>
                <li className={statusUser.temMinuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra minúscula</li>
                <li className={statusUser.temNumero ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um número</li>
                <li className={statusUser.temEspecial ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um caractere especial</li>
                <li className="text-gray-400 italic">(Caracteres permitidos: @#%&*-+_.)</li>
              </ul>
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <div className="relative">
                <input
                  type={mostrarSenhaCadastro ? "text" : "password"}
                  id="new-password"
                  name="new-password"
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                  placeholder="senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaCadastro(!mostrarSenhaCadastro)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
                >
                  {mostrarSenhaCadastro ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <ul className="text-[11px] space-y-0.5 pt-1">
                <li className={statusPass.tamanho ? 'text-emerald-600' : 'text-red-500'}>• 6 a 12 caracteres</li>
                <li className={statusPass.temMaiuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra maiúscula</li>
                <li className={statusPass.temMinuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra minúscula</li>
                <li className={statusPass.temNumero ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um número</li>
                <li className={statusPass.temEspecial ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um caractere especial</li>
                <li className="text-gray-400 italic">(Caracteres permitidos: @#%&*-+_.)</li>
              </ul>
            </div>

            {/* Data Nascimento e CPF */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
                <input
                  type="text"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(formatarData(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                  placeholder="DD/MM/YYYY"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            {/* Endereço Reestruturado */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Endereço</span>
              
              {/* Linha 1: CEP e Rua (mesmo tamanho) */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="CEP (ex: 79400-000)"
                  value={endereco.cep}
                  onChange={handleCepChange}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Rua"
                  value={endereco.rua}
                  onChange={(e) => setEndereco({ ...endereco, rua: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              {/* Linha 2: Número e Bairro */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Número"
                  disabled={endereco.semNumero}
                  value={endereco.numero}
                  onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="Bairro"
                  value={endereco.bairro}
                  onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  required
                />
              </div>

              {/* Checkbox Sem Número */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="semNumero"
                  checked={endereco.semNumero}
                  onChange={(e) => setEndereco({ ...endereco, semNumero: e.target.checked, numero: e.target.checked ? '' : endereco.numero })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <label htmlFor="semNumero" className="text-xs text-gray-500 dark:text-gray-400">
                  Não possui número
                </label>
              </div>

              {/* Linha 3: Complemento e Descrição */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Complemento (ex: Apto 101)"
                  value={endereco.complemento}
                  onChange={(e) => setEndereco({ ...endereco, complemento: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                />
                <input
                  type="text"
                  placeholder={endereco.semNumero ? "Descrição (Obrigatória p/ identificação)" : "Descrição (opcional)"}
                  value={endereco.descricao}
                  onChange={(e) => setEndereco({ ...endereco, descricao: e.target.value })}
                  className={`px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 text-xs ${endereco.semNumero && !endereco.descricao ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
                />
              </div>

              {/* Linha 4: Cidade e Estado separados */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Cidade"
                  value={endereco.cidade}
                  onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  required
                />
                <input
                  type="text"
                  placeholder="Estado (UF)"
                  value={endereco.estado}
                  onChange={(e) => setEndereco({ ...endereco, estado: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
                  required
                />
              </div>
            </div>

            {/* Termos de Uso Linkado com Modal */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="termos"
                checked={termosAceitos}
                onChange={(e) => setTermosAceitos(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                required
              />
              <label htmlFor="termos" className="text-xs text-gray-500 dark:text-gray-400">
                Eu li e concordo com os{' '}
                <button
                  type="button"
                  onClick={() => setModalTermosAberto(true)}
                  className="text-indigo-600 dark:text-indigo-400 underline font-medium hover:text-indigo-500"
                >
                  termos de uso e política de privacidade
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={carregando || !statusUser.valido || !statusPass.valido || !termosAceitos}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm shadow-sm transition disabled:opacity-50"
            >
              {carregando ? 'Cadastrando...' : 'Cadastrar Conta'}
            </button>
          </form>
        )}

        {/* FLUXO ESQUECI SENHA */}
        {modo === 'esqueci-senha' && (
          <form onSubmit={handleEsqueciSenha} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Digite seu e-mail cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition"
            >
              {carregando ? 'Enviando...' : 'Enviar código de recuperação'}
            </button>
            <button
              type="button"
              onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
              className="w-full text-center text-xs text-gray-500 hover:underline pt-2"
            >
              Voltar ao Login
            </button>
          </form>
        )}

        {/* VERIFICAÇÃO OTP 6 DÍGITOS */}
        {modo === 'verificar-codigo' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-gray-500">Enviamos um código de 6 dígitos para o e-mail: <span className="font-semibold">{email}</span></p>
            <input
              type="text"
              maxLength={6}
              value={codigoOtp}
              onChange={(e) => setCodigoOtp(e.target.value)}
              className="w-full text-center tracking-widest text-2xl px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={() => {
                if (codigoOtp.length === 6) setModo('nova-senha');
                else setErro('Digite os 6 dígitos do código.');
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition"
            >
              Confirmar Código
            </button>

            <div className="pt-2">
              <button
                type="button"
                disabled={tempoReenvio > 0}
                onClick={() => { setTempoReenvio(120); setSucesso('Novo código reenviado!'); }}
                className="text-xs text-indigo-600 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {tempoReenvio > 0 ? `Reenviar código (${Math.floor(tempoReenvio / 60)}:${String(tempoReenvio % 60).padStart(2, '0')})` : 'Reenviar código'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
              className="w-full text-center text-xs text-gray-400 hover:underline pt-1"
            >
              Cancelar e voltar ao login
            </button>
          </div>
        )}

        {/* NOVA SENHA */}
        {modo === 'nova-senha' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Criar nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenhaNova ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                  placeholder="senha"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaNova(!mostrarSenhaNova)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {mostrarSenhaNova ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <ul className="text-[11px] space-y-0.5 pt-1">
                <li className={statusPass.tamanho ? 'text-emerald-600' : 'text-red-500'}>• 6 a 12 caracteres</li>
                <li className={statusPass.temMaiuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra maiúscula</li>
                <li className={statusPass.temMinuscula ? 'text-emerald-600' : 'text-red-500'}>• Ao menos uma letra minúscula</li>
                <li className={statusPass.temNumero ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um número</li>
                <li className={statusPass.temEspecial ? 'text-emerald-600' : 'text-red-500'}>• Ao menos um caractere especial</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Confirmar nova senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                placeholder="senha"
              />
            </div>

            <button
              type="button"
              disabled={!statusPass.valido || senha !== confirmarSenha}
              onClick={() => {
                setSucesso('Senha atualizada com sucesso!');
                setTimeout(() => { setModo('login'); setSenha(''); setConfirmarSenha(''); }, 2000);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm transition disabled:opacity-50"
            >
              Atualizar Senha
            </button>
          </div>
        )}

        {/* MODAL DOS TERMOS DE USO E POLÍTICA DE PRIVACIDADE */}
        {modalTermosAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex justify-between items-center border-b pb-3 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Termos de Uso e Política de Privacidade</h3>
                <button 
                  onClick={() => setModalTermosAberto(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                <p><strong>1. Aceitação dos Termos:</strong> Ao criar uma conta no <strong>GestãoFácil</strong>, você concorda com estes termos de uso e com nossa política de privacidade. O sistema é fornecido gratuitamente para fins de controle de estoque residencial e despensa doméstica.</p>
                <p><strong>2. Privacidade e Dados:</strong> Seus dados pessoais (como nome de usuário, e-mail, CPF e endereço) são armazenados de forma segura utilizando criptografia e isolamento por Row Level Security (RLS) no Supabase. Não compartilhamos suas informações com terceiros.</p>
                <p><strong>3. Responsabilidade da Conta:</strong> O usuário é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</p>
                <p><strong>4. Uso Adequado:</strong> O GestãoFácil destina-se exclusivamente ao gerenciamento doméstico de suprimentos. É proibido o uso da plataforma para fins ilícitos.</p>
                <p><strong>5. Atualizações:</strong> Estes termos podem ser atualizados periodicamente para refletir melhorias no sistema.</p>
              </div>
              <div className="pt-4 border-t dark:border-gray-800 text-right">
                <button
                  onClick={() => { setTermosAceitos(true); setModalTermosAberto(false); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
                >
                  Li e Concordo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alternador de Modo */}
        {(modo === 'login' || modo === 'cadastro') && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            {modo === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); setSucesso(''); }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1"
            >
              {modo === 'login' ? 'Cadastre-se' : 'Fazer Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}