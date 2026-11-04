import React, { useState } from 'react';
import { supabase } from '../services/api'; // Certifique-se de que o cliente do Supabase está exportado de services/api ou do seu arquivo supabase

export default function Auth({ onLoginSucesso }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');
    setCarregando(true);

    try {
      if (isLogin) {
        // Login com Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
        if (data.session) {
          onLoginSucesso(data.session.user);
        }
      } else {
        // Cadastro com Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
        });
        if (error) throw error;
        setMensagemSucesso('Conta criada com sucesso! Verifique seu e-mail se necessário ou faça login.');
        if (data.session) {
          onLoginSucesso(data.session.user);
        } else {
          setIsLogin(true);
        }
      }
    } catch (err) {
      setErro(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 space-y-6">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <span className="text-4xl">📦</span>
          <h2 className="text-2xl font-bold tracking-wide text-gray-900 dark:text-white">GestãoFácil</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Entre na sua conta para gerenciar seu estoque' : 'Crie sua conta gratuita e privada'}
          </p>
        </div>

        {/* Mensagens de Erro ou Sucesso */}
        {erro && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs font-medium">
            {erro}
          </div>
        )}

        {mensagemSucesso && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-xl text-xs font-medium">
            {mensagemSucesso}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm shadow-sm transition disabled:opacity-50"
          >
            {carregando ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar Conta')}
          </button>
        </form>

        {/* Alternador de Modo */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1"
          >
            {isLogin ? 'Cadastre-se' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  );
}