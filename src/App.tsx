/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import AdminPanel from './components/AdminPanel';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import Login from './components/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
