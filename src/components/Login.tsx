/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Lock, Mail, ChevronRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-white flex items-center justify-center p-6 selection:bg-amber-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-6 rotate-3">
            <Lock className="text-black" size={28} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase font-display">
            Acesso <span className="text-amber-500">Restrito</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Dojô Admin Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <p className="text-[10px] text-amber-200/70 leading-relaxed font-mono uppercase tracking-wider">
              <span className="text-amber-500 font-bold">Dica de Setup:</span> Como o projeto usa Firebase Auth, você deve criar seu usuário no Console do Firebase &gt; Authentication &gt; Users.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-amber-500 transition-all text-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-amber-500 transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
          >
            {loading ? 'Validando...' : 'Entrar no Dojô'} <ChevronRight size={16} />
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-800 text-center">
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed">
            Se esqueceu sua senha ou não possui acesso, <br />contate o administrador do sistema.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
