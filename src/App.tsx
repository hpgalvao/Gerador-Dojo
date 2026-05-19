/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import Login from './components/Login';
import { motion } from 'motion/react';
import { Server, ExternalLink } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    if (!auth) {
      setFirebaseError(true);
      setLoading(false);
      return;
    }

    try {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }, (err) => {
        console.error("Auth State Error:", err);
        if (err.message?.includes('API key')) {
          setFirebaseError(true);
        }
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("Firebase auth check failed:", e);
      setFirebaseError(true);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (firebaseError || !db || !auth) {
    return (
      <div className="min-h-screen bg-[#0F0F10] text-white font-sans flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0,transparent_100%)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <Server className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Erro de Conexão <span className="text-amber-500">Firebase</span></h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8 font-medium">
            Não foi possível estabelecer uma conexão segura com o banco de dados. Isso ocorre devido a uma <span className="text-white font-bold">API Key inválida</span> ou ausência de configuração.
          </p>
          
          <div className="bg-black/40 rounded-2xl p-6 mb-8 text-left border border-zinc-800 space-y-4">
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20 text-[10px] font-black text-amber-500">1</div>
              <p className="text-xs text-zinc-400">Verifique se o Firebase está configurado no menu de Configurações.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20 text-[10px] font-black text-amber-500">2</div>
              <p className="text-xs text-zinc-400">Certifique-se de que as <span className="font-bold text-white">API Keys</span> são válidas e não possuem espaços.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20 text-[10px] font-black text-amber-500">3</div>
              <p className="text-xs text-zinc-400">Tente atualizar a página após corrigir as chaves.</p>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            Tentar Novamente <ExternalLink size={14} />
          </button>
        </motion.div>
      </div>
    );
  }

  const adminPath = import.meta.env.VITE_ADMIN_PATH || "/admin";

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path={adminPath} 
          element={user ? <AdminPanel /> : <Login />} 
        />
        <Route path="/lp/:city/:modality" element={<LandingPage />} />
        <Route path="/chat/:city/:modality" element={<ChatPage />} />
        <Route path="/:city/:modality" element={<LandingPage />} /> {/* Legado */}
        <Route path="/" element={<Navigate to={adminPath} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
