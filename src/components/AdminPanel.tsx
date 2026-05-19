/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LandingPageConfig, Lead, Testimonial } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Layout, Users, Trash2, Edit2, ExternalLink, Save, X, PlusCircle, Trash, Copy, Sparkles, Server, Settings } from 'lucide-react';

export default function AdminPanel() {
  const [pages, setPages] = useState<LandingPageConfig[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'pages' | 'leads' | 'settings'>('pages');
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<LandingPageConfig> | null>(null);

  // SSH Config (Mock state for persistence demo)
  const [sshConfig, setSshConfig] = useState({
    host: '',
    user: '',
    path: '/var/www/html'
  });

  useEffect(() => {
    const unsubPages = onSnapshot(query(collection(db, 'landing_pages'), orderBy('updatedAt', 'desc')), (snap) => {
      setPages(snap.docs.map(d => ({ id: d.id, ...d.data() } as LandingPageConfig)));
    });
    const unsubLeads = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc')), (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    });
    return () => { unsubPages(); unsubLeads(); };
  }, []);

  const handleCreateNew = () => {
    setEditingPage({
      academyName: 'Dojô Central',
      logoUrl: '',
      city: '',
      modality: '',
      title: 'Nova Landing Page',
      description: 'Prepare-se para transformar sua vida através do Jiu-Jitsu. Aulas para todas as idades e níveis.',
      ctaText: 'Agendar Aula Experimental',
      whatsappNumber: '',
      webhookUrl: '',
      showForm: true,
      images: [],
      testimonials: [],
      primaryColor: '#cc0000',
      campaignCode: '',
      slug: ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingPage?.city || !editingPage?.modality) {
      alert("Cidade e Modalidade são obrigatórios");
      return;
    }

    const slug = `${editingPage.city}-${editingPage.modality}`.toLowerCase().replace(/\s+/g, '-');
    const saveData = {
      ...editingPage,
      slug,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingPage.id) {
        const { id, ...data } = saveData;
        await updateDoc(doc(db, 'landing_pages', id!), data);
      } else {
        await addDoc(collection(db, 'landing_pages'), saveData);
      }
      setIsEditing(false);
      setEditingPage(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta página?")) {
      await deleteDoc(doc(db, 'landing_pages', id));
    }
  };

  const addTestimonial = () => {
    const t = editingPage?.testimonials || [];
    setEditingPage({ ...editingPage, testimonials: [...t, { name: '', text: '', role: '' }] });
  };

  const removeTestimonial = (index: number) => {
    const t = [...(editingPage?.testimonials || [])];
    t.splice(index, 1);
    setEditingPage({ ...editingPage, testimonials: t });
  };

  const addImage = () => {
    const i = editingPage?.images || [];
    setEditingPage({ ...editingPage, images: [...i, ''] });
  };

  const updateImage = (index: number, val: string) => {
    const i = [...(editingPage?.images || [])];
    i[index] = val;
    setEditingPage({ ...editingPage, images: i });
  };

  const removeImage = (index: number) => {
    const i = [...(editingPage?.images || [])];
    i.splice(index, 1);
    setEditingPage({ ...editingPage, images: i });
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-white font-sans p-6 md:p-12 selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase font-display">
              Gerador <span className="text-amber-500">Dojô</span>
            </h1>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">Painel de Controle v2.0</p>
          </div>
          
          <div className="flex bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => setActiveTab('pages')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'pages' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
            >
              <Layout size={16} /> Páginas
            </button>
            <button 
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
            >
              <Users size={16} /> Leads 
              {leads.length > 0 && <span className={`ml-2 px-1.5 rounded-md text-[10px] ${activeTab === 'leads' ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>{leads.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
            >
              <Settings size={16} /> SSH
            </button>
          </div>
        </header>

        {activeTab === 'pages' ? (
          <div className="grid gap-8">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-4 p-12 border-2 border-dashed border-zinc-800 rounded-[32px] text-zinc-600 hover:border-amber-500/50 hover:text-amber-500 transition-all bg-zinc-900/20 group"
            >
              <PlusCircle size={32} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-black uppercase tracking-[0.2em] text-lg font-display italic">Lançar Nova Landing Page</span>
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pages.map(page => (
                <motion.div 
                  layoutId={page.id}
                  key={page.id} 
                  className="bg-zinc-900/50 p-8 rounded-[32px] border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-all group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                        {page.modality}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingPage(page); setIsEditing(true); }} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(page.id!)} className="p-2.5 bg-zinc-800 hover:bg-red-500/20 rounded-xl text-zinc-400 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black mb-1 font-display tracking-tight uppercase italic">{page.city}</h3>
                    <p className="text-[10px] text-zinc-600 mb-6 font-mono tracking-widest">URL: /{page.city.toLowerCase()}/{page.modality.toLowerCase()}</p>
                    <p className="text-zinc-500 text-sm line-clamp-2 mb-8 leading-relaxed italic">"{page.title}"</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={`/${page.city.toLowerCase().replace(/\s+/g, '-')}/${page.modality.toLowerCase().replace(/\s+/g, '-')}`} 
                      target="_blank"
                      className="flex-1 bg-white text-black py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-xl shadow-white/5"
                    >
                      Site <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}/${page.city.toLowerCase().replace(/\s+/g, '-')}/${page.modality.toLowerCase().replace(/\s+/g, '-')}`;
                        navigator.clipboard.writeText(url);
                        alert("Link copiado!");
                      }}
                      className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:bg-zinc-700 transition-all hover:text-white"
                      title="Copiar Link"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'leads' ? (
          <div className="bg-zinc-900/30 rounded-[32px] border border-zinc-800 overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800">
                    <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Data</th>
                    <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Nome</th>
                    <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Contato</th>
                    <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Página</th>
                    <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Campanha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-8 py-6 text-xs text-zinc-500 font-mono">
                        {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-sm">{lead.name}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-amber-500">{lead.phone}</div>
                        <div className="text-[10px] text-zinc-600 uppercase tracking-widest">{lead.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-block px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-black uppercase tracking-widest border border-zinc-700">{lead.modality}</div>
                        <div className="text-[10px] text-zinc-500 mt-1">{lead.city}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-mono bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-800 text-zinc-500 uppercase">{lead.campaignCode || 'direto'}</span>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center text-zinc-700 italic font-medium uppercase tracking-widest text-xs">
                        Silêncio no dojô... Nenhum lead ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
            <div className="max-w-2xl mx-auto bg-zinc-900/50 p-10 rounded-[40px] border border-zinc-800 space-y-8">
               <div>
                  <h2 className="text-2xl font-bold mb-2">Configurações de Deploy</h2>
                  <p className="text-zinc-500 text-sm">Configure os acessos SSH para facilitar o comando de exportação da pasta /dist.</p>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Host / IP do Servidor</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono"
                      value={sshConfig.host}
                      onChange={e => setSshConfig({...sshConfig, host: e.target.value})}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Usuário SSH</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono"
                      value={sshConfig.user}
                      onChange={e => setSshConfig({...sshConfig, user: e.target.value})}
                      placeholder="root"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Caminho Remoto</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono"
                      value={sshConfig.path}
                      onChange={e => setSshConfig({...sshConfig, path: e.target.value})}
                      placeholder="/var/www/html/jiujitsu"
                    />
                  </div>
               </div>

               <div className="bg-black/50 p-6 rounded-2xl border border-zinc-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                    <Server size={14} /> Comando Recomendado para o PC:
                  </p>
                  <code className="text-xs break-all text-zinc-400 block whitespace-pre-wrap">
                    scp -r dist/* {sshConfig.user || 'user'}@{sshConfig.host || 'host'}:{sshConfig.path || '/remoto'}
                  </code>
               </div>
               
               <button 
                  onClick={() => alert("Configurações salvas localmente nesta sessão.")}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all"
                >
                  Salvar Configuração SSH
                </button>
            </div>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F0F10] border border-zinc-800 w-full max-w-4xl max-h-full overflow-y-auto rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="p-10 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-[#0F0F10]/80 backdrop-blur-md z-10">
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase font-display">Setup <span className="text-amber-500">Landing Page</span></h2>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mt-1">Configuração de Rota e Ativos</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-12">
                {/* Branding Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nome da Academia</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-bold text-white"
                      value={editingPage?.academyName}
                      onChange={e => setEditingPage({...editingPage, academyName: e.target.value})}
                      placeholder="Ex: Dojô Golden"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">URL da Logo (PNG/SVG)</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all text-xs"
                      value={editingPage?.logoUrl}
                      onChange={e => setEditingPage({...editingPage, logoUrl: e.target.value})}
                      placeholder="https://sua-logo.com/imagem.png"
                    />
                  </div>
                </div>

                {/* AI Assistant Button */}
                <div className="flex items-center gap-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                   <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <Sparkles className="text-black" />
                   </div>
                   <div className="flex-1">
                      <h4 className="font-bold text-sm tracking-tight">Assistente de Copywriting</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Gere textos persuasivos com Inteligência Artificial</p>
                   </div>
                   <button 
                    disabled={generating || !editingPage?.city || !editingPage?.modality}
                    onClick={async () => {
                      setGenerating(true);
                      try {
                        const res = await fetch('/api/generate-copy', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ city: editingPage?.city, modality: editingPage?.modality })
                        });
                        const data = await res.json();
                        setEditingPage({ ...editingPage, title: data.title, description: data.description });
                      } catch (e) {
                        alert("Certifique-se de preencher Cidade e Modalidade primeiro.");
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    className="px-6 py-3 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all disabled:opacity-50"
                   >
                     {generating ? 'Pensando...' : 'Mágica'}
                   </button>
                </div>
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cidade *</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-bold text-white"
                      value={editingPage?.city}
                      onChange={e => setEditingPage({...editingPage, city: e.target.value})}
                      placeholder="Ex: Curitiba"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Modalidade *</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-bold text-white"
                      value={editingPage?.modality}
                      onChange={e => setEditingPage({...editingPage, modality: e.target.value})}
                      placeholder="Ex: Muay Thai"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Título da Página (Impacto)</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-black text-xl italic font-display"
                      value={editingPage?.title}
                      onChange={e => setEditingPage({...editingPage, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Texto de Venda / Subtítulo</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-medium text-zinc-400"
                      value={editingPage?.description}
                      onChange={e => setEditingPage({...editingPage, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Action Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Texto do Botão CTA</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-bold uppercase tracking-widest text-xs"
                      value={editingPage?.ctaText}
                      onChange={e => setEditingPage({...editingPage, ctaText: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">WhatsApp (somente números)</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono text-amber-500"
                      value={editingPage?.whatsappNumber}
                      onChange={e => setEditingPage({...editingPage, whatsappNumber: e.target.value})}
                      placeholder="5511999999999"
                    />
                  </div>
                </div>

                {/* Integration Section */}
                <div className="space-y-2 p-8 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Webhook CRM (RD Station, Komo, etc)</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono text-xs text-amber-500/80"
                      value={editingPage?.webhookUrl}
                      onChange={e => setEditingPage({...editingPage, webhookUrl: e.target.value})}
                      placeholder="https://hooks.zapier.com/..."
                    />
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-2">Os dados do lead serão enviados via POST JSON para esta URL.</p>
                </div>

                {/* Styling & Media */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cor Principal Customizada</label>
                    <div className="flex gap-4">
                       <input 
                        type="color" 
                        className="h-14 w-20 rounded-xl border-2 border-zinc-800 cursor-pointer bg-transparent"
                        value={editingPage?.primaryColor}
                        onChange={e => setEditingPage({...editingPage, primaryColor: e.target.value})}
                      />
                      <input 
                        type="text" 
                        className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none font-mono text-zinc-500 uppercase"
                        value={editingPage?.primaryColor}
                        onChange={e => setEditingPage({...editingPage, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">URL Vídeo YouTube</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all text-xs"
                      value={editingPage?.videoUrl}
                      onChange={e => setEditingPage({...editingPage, videoUrl: e.target.value})}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
                  <input 
                    type="checkbox" 
                    id="showForm"
                    className="w-6 h-6 rounded-lg accent-amber-500 cursor-pointer"
                    checked={editingPage?.showForm}
                    onChange={e => setEditingPage({...editingPage, showForm: e.target.checked})}
                  />
                  <label htmlFor="showForm" className="font-black text-xs uppercase tracking-[0.2em] text-zinc-300 cursor-pointer">Ativar Captura de Leads (Formulário)</label>
                </div>

                {/* Testimonials */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Depoimentos dos Alunos</label>
                    <button onClick={addTestimonial} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-amber-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 transition-all">
                      <Plus size={14} /> Novo
                    </button>
                  </div>
                  <div className="space-y-4">
                    {editingPage?.testimonials?.map((t, i) => (
                      <div key={i} className="bg-zinc-900/80 p-6 rounded-3xl border border-zinc-800 relative group">
                        <button onClick={() => removeTestimonial(i)} className="absolute top-4 right-4 p-2 text-zinc-700 hover:text-red-500 transition-colors">
                          <Trash size={18} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Nome</label>
                            <input 
                              className="w-full bg-black/40 rounded-xl px-4 py-3 outline-none border border-zinc-800 text-sm focus:border-amber-500"
                              value={t.name}
                              onChange={e => {
                                const nt = [...editingPage.testimonials!];
                                nt[i].name = e.target.value;
                                setEditingPage({...editingPage, testimonials: nt});
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Faixa / Info</label>
                            <input 
                              className="w-full bg-black/40 rounded-xl px-4 py-3 outline-none border border-zinc-800 text-sm focus:border-amber-500"
                              value={t.role}
                              onChange={e => {
                                const nt = [...editingPage.testimonials!];
                                nt[i].role = e.target.value;
                                setEditingPage({...editingPage, testimonials: nt});
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Relato</label>
                          <textarea 
                            rows={2}
                            className="w-full bg-black/40 rounded-xl px-4 py-3 outline-none border border-zinc-800 text-sm focus:border-amber-500 italic"
                            value={t.text}
                            onChange={e => {
                              const nt = [...editingPage.testimonials!];
                              nt[i].text = e.target.value;
                              setEditingPage({...editingPage, testimonials: nt});
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Galeria de Imagens (URLs)</label>
                    <button onClick={addImage} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-amber-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 transition-all">
                      <Plus size={14} /> Nova Imagem
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {editingPage?.images?.map((url, i) => (
                      <div key={i} className="flex gap-4">
                        <input 
                          type="text" 
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-3 text-xs outline-none focus:border-amber-500 font-mono text-zinc-500"
                          value={url}
                          onChange={e => updateImage(i, e.target.value)}
                          placeholder="https://..."
                        />
                        <button onClick={() => removeImage(i)} className="p-3 bg-zinc-900 hover:bg-red-500/20 text-zinc-700 hover:text-red-500 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10 border-t border-zinc-900 bg-zinc-900/20 flex flex-col md:flex-row items-center justify-end gap-6 sticky bottom-0 backdrop-blur-md">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="w-full md:w-auto px-8 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all order-2 md:order-1"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSave}
                  className="w-full md:w-auto bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-amber-500 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.05)] order-1 md:order-2 active:scale-95"
                >
                  <Save size={18} /> Deploy do Conteúdo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 py-12 border-t border-zinc-900 bg-black/20 backdrop-blur-sm flex flex-col items-center gap-6 text-zinc-600">
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
          <a href="https://github.com/hpgalvao/Gerador-Dojo" target="_blank" className="hover:text-amber-500 transition-all flex items-center gap-2">
            GitHub Repo
          </a>
          <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
          <a href="https://selectone.com.br" target="_blank" className="hover:text-amber-500 transition-all">SelectOne</a>
          <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
          <a href="https://goldenfight.com.br" target="_blank" className="hover:text-amber-500 transition-all">Golden Fight</a>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[9px] font-mono opacity-50 italic">Desenvolvido com ❤️ por Helio P. Galvão</p>
          <p className="text-[8px] font-mono tracking-widest uppercase text-zinc-700">Professor de BJJ & Dev Fullstack since 1998</p>
        </div>
      </footer>
    </div>
  );
}
