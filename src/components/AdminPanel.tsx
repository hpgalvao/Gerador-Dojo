/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { THEMES } from '../themes';

import { auth, db } from '../lib/firebase';
import { LandingPageConfig, Lead, Testimonial, ChatConfig, ChatStep, PageType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Layout, Users, Trash2, Edit2, ExternalLink, Save, X, 
  PlusCircle, Trash, Copy, Sparkles, Server, Settings, LogOut, 
  MessageSquare, Image as ImageIcon, List, Film, CheckCircle2, ChevronDown, ChevronUp, GripVertical, Info, Eye, Search, History, Upload, Grid
} from 'lucide-react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')                   // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '')     // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim()                              // trim leading or trailing whitespace
    .toLowerCase()                       // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '')         // remove non-alphanumeric characters
    .replace(/\s+/g, '-')                // replace spaces with hyphens
    .replace(/-+/g, '-');                // remove consecutive hyphens
};

const ImageManager = ({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (url: string) => void }) => {
  const [tab, setTab] = useState<'upload' | 'gallery'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<{name: string, url: string}[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen && tab === 'gallery') {
      fetchGallery();
    }
  }, [isOpen, tab]);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setGallery(data);
    } catch (err) {
      console.error("Gallery fetch error:", err);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.addEventListener('load', () => setPreviewUrl(reader.result?.toString() || null));
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (completedCrop) {
        formData.append('crop', JSON.stringify(completedCrop));
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        onSelect(data.url);
        onClose();
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erro ao enviar imagem.");
    } finally {
       setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
           <div className="flex gap-4">
              <button 
                onClick={() => setTab('upload')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'upload' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                Upload
              </button>
              <button 
                onClick={() => setTab('gallery')}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'gallery' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                Galeria
              </button>
           </div>
           <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-white">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           {tab === 'upload' ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                 {!previewUrl ? (
                   <label className="w-full max-w-sm aspect-video border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                         <Upload size={24} className="text-zinc-500 group-hover:text-amber-500" />
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-bold">Clique para selecionar</p>
                         <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Imagens até 5MB</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={onFileSelect} />
                   </label>
                 ) : (
                   <div className="w-full space-y-6">
                      <div className="max-h-[50vh] overflow-hidden rounded-2xl flex justify-center bg-black/40 p-4">
                        <ReactCrop
                          crop={crop}
                          onChange={c => setCrop(c)}
                          onComplete={c => setCompletedCrop(c)}
                        >
                          <img 
                            ref={imgRef}
                            src={previewUrl} 
                            style={{ maxHeight: '45vh' }} 
                            onLoad={onImageLoad}
                          />
                        </ReactCrop>
                      </div>
                      <div className="flex gap-4 justify-center">
                         <button 
                           onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                           className="px-8 py-4 bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-700"
                         >
                            Trocar Imagem
                         </button>
                         <button 
                           onClick={handleUpload}
                           disabled={uploading}
                           className="px-12 py-4 bg-amber-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-400 disabled:opacity-50 flex items-center gap-2"
                         >
                            {uploading ? 'Processando...' : 'Cortar e Salvar'}
                            <Save size={16} />
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {gallery.map((img, i) => (
                    <div 
                      key={i} 
                      onClick={() => { onSelect(img.url); onClose(); }}
                      className="aspect-square bg-black/50 rounded-2xl overflow-hidden border border-zinc-800 cursor-pointer group hover:border-amber-500 transition-all relative"
                    >
                       <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                       <div className="absolute inset-0 bg-amber-500/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <Plus className="text-white" size={32} />
                       </div>
                    </div>
                 ))}
                 {gallery.length === 0 && (
                    <div className="col-span-full py-20 text-center text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                       Galeria vazia... Faça um upload primeiro.
                    </div>
                 )}
              </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const UrlInput = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const isImage = value && (value.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || value.includes('images.unsplash.com') || value.startsWith('/uploads/'));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</label>
        <div className="flex gap-4">
           {isImage && (
             <button 
               onClick={() => setShowPreview(true)}
               className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1"
             >
               <Eye size={12} /> Preview
             </button>
           )}
           <button 
             onClick={() => setShowManager(true)}
             className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all flex items-center gap-1"
           >
             <Upload size={12} /> Upload / Galeria
           </button>
        </div>
      </div>
      <div className="relative">
        <input 
          type={type} 
          className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all text-xs"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
        />
      </div>

      <ImageManager 
        isOpen={showManager} 
        onClose={() => setShowManager(false)} 
        onSelect={onChange} 
      />

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowPreview(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[80vh] bg-zinc-900 p-2 rounded-3xl overflow-hidden border border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <img src={value} alt="Preview" className="max-w-full max-h-[75vh] object-contain rounded-2xl" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black rounded-full"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChatFlowEditor = ({ config, onChange, onUpdatePage }: { config: ChatConfig; onChange: (c: ChatConfig) => void; onUpdatePage: (p: any) => void }) => {
  const addStep = () => {
    const newSteps = [...(config?.steps || []), { id: Math.random().toString(36).substr(2, 6), type: 'text' as const, message: 'Nova pergunta...' }];
    onChange({ ...config, steps: newSteps });
  };

  const updateStep = (index: number, step: ChatStep) => {
    const newSteps = [...config.steps];
    newSteps[index] = step;
    onChange({ ...config, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    onChange({ ...config, steps: newSteps });
  };

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nome do Contato</label>
            <input 
              type="text" 
              className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-bold text-white"
              value={config?.contactName || ''}
              onChange={e => onChange({...config, contactName: e.target.value})}
              placeholder="Ex: Mestre Helio"
            />
          </div>
          <UrlInput 
            label="Foto do Contato (URL)"
            value={config?.contactPhotoUrl || ''}
            onChange={v => onChange({...config, contactPhotoUrl: v})}
          />
          <div className="space-y-2 md:col-span-2">
            <UrlInput 
              label="Imagem de Fundo do Chat (URL)"
              value={config?.backgroundImageUrl || ''}
              onChange={v => onChange({...config, backgroundImageUrl: v})}
            />
          </div>
       </div>

       <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Script da Conversa</h3>
            <div className="flex gap-3">
              <button onClick={addStep} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all">
                <Plus size={14} /> Novo Passo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {config?.steps.map((step, idx) => (
              <div key={step.id} className="bg-zinc-900/80 border border-zinc-800 rounded-[32px] overflow-hidden">
                 <div className="px-8 py-4 bg-zinc-950/50 border-b border-zinc-900 flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono text-zinc-600">PASSO #{idx + 1} ({step.id})</span>
                    <button onClick={() => removeStep(idx)} className="p-2 text-zinc-700 hover:text-red-500 transition-all">
                      <Trash size={16} />
                    </button>
                 </div>
                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Tipo de Mensagem</label>
                          <select 
                            className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold appearance-none cursor-pointer"
                            value={step.type}
                            onChange={e => updateStep(idx, { ...step, type: e.target.value as any })}
                          >
                             <option value="text">Texto Simples (Input Livre)</option>
                             <option value="buttons">Botões de Opção</option>
                             <option value="image_options">Grade com Imagens</option>
                             <option value="listbox">Lista de Seleção</option>
                             <option value="media">Áudio / Vídeo (AutoPlay)</option>
                             <option value="link">Link Externo / Botão Único</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Validação / Campo</label>
                          <select 
                            className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold appearance-none cursor-pointer"
                            value={step.validationType || 'none'}
                            onChange={e => updateStep(idx, { ...step, validationType: e.target.value as any })}
                          >
                             <option value="none">Nenhuma (Livre)</option>
                             <option value="name">Nome do Cliente</option>
                             <option value="email">E-mail</option>
                             <option value="phone">WhatsApp / Celular</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Próximo Passo</label>
                          <input 
                            placeholder="ID do passo" 
                            className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-mono"
                            value={step.nextStepId || ''}
                            onChange={e => updateStep(idx, { ...step, nextStepId: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Mensagem do Chat</label>
                       <textarea 
                        className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-sm font-medium"
                        value={step.message}
                        onChange={e => updateStep(idx, { ...step, message: e.target.value })}
                        rows={2}
                       />
                    </div>
                    {(step.type === 'buttons' || step.type === 'image_options' || step.type === 'listbox') && (
                       <div className="space-y-4 pt-4 border-t border-zinc-900">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2 text-blue-500">Opções de Resposta e Ramificação</label>
                          <div className="space-y-3">
                             {step.options?.map((opt, optIdx) => (
                               <div key={optIdx} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/20 p-4 rounded-2xl border border-zinc-900">
                                  <input placeholder="Label" className="bg-black/45 border border-zinc-800 rounded-xl px-4 py-2 text-xs" value={opt.label} onChange={e => {
                                    const no = [...(step.options || [])]; no[optIdx].label = e.target.value; updateStep(idx, { ...step, options: no });
                                  }} />
                                  <input placeholder="Valor" className="bg-black/45 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono" value={opt.value} onChange={e => {
                                    const no = [...(step.options || [])]; no[optIdx].value = e.target.value; updateStep(idx, { ...step, options: no });
                                  }} />
                                  <input placeholder="Próximo Passo ID" className="bg-black/45 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono" value={opt.nextStepId || ''} onChange={e => {
                                    const no = [...(step.options || [])]; no[optIdx].nextStepId = e.target.value; updateStep(idx, { ...step, options: no });
                                  }} />
                                  <div className="flex gap-2">
                                     {step.type === 'image_options' && (
                                       <UrlInput 
                                          label="Img"
                                          value={opt.imageUrl || ''}
                                          onChange={v => {
                                            const no = [...(step.options || [])]; no[optIdx].imageUrl = v; updateStep(idx, { ...step, options: no });
                                          }}
                                       />
                                     )}
                                     <button onClick={() => {
                                       const no = [...(step.options || [])]; no.splice(optIdx, 1); updateStep(idx, { ...step, options: no });
                                     }} className="p-2 text-zinc-700 hover:text-red-500 self-end mb-4"><Trash size={14} /></button>
                                  </div>
                               </div>
                             ))}
                             <button onClick={() => {
                               const no = [...(step.options || []), { label: '', value: '' }]; updateStep(idx, { ...step, options: no });
                             }} className="text-[10px] font-black uppercase text-blue-500 ml-2">+ Adicionar Opção</button>
                          </div>
                       </div>
                    )}
                    {step.type === 'media' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                          <div className="space-y-2">
                             <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Tipo de Mídia</label>
                             <select className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold" value={step.mediaType} onChange={e => updateStep(idx, { ...step, mediaType: e.target.value as any })}>
                                <option value="video">Vídeo</option>
                                <option value="audio">Áudio</option>
                             </select>
                          </div>
                          <UrlInput 
                              label="URL do Arquivo"
                              value={step.mediaUrl || ''}
                              onChange={v => updateStep(idx, { ...step, mediaUrl: v })}
                              placeholder="https://..."
                           />
                       </div>
                    )}
                    {step.type === 'link' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                          <div className="space-y-2">
                             <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Rótulo do Botão</label>
                             <input 
                               type="text" 
                               className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold"
                               value={step.linkLabel || ''}
                               onChange={e => updateStep(idx, { ...step, linkLabel: e.target.value })}
                               placeholder="Ex: Abrir Site"
                             />
                          </div>
                          <UrlInput 
                              label="URL do Link"
                              value={step.linkUrl || ''}
                              onChange={v => updateStep(idx, { ...step, linkUrl: v })}
                              placeholder="https://..."
                           />
                       </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
       </div>
    </div>
  );
};

export default function AdminPanel() {
  const [pages, setPages] = useState<LandingPageConfig[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'pages' | 'leads' | 'settings'>('pages');
  const [isEditing, setIsEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<LandingPageConfig> | null>(null);
  const [originalPage, setOriginalPage] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<LandingPageConfig | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSlugWarning, setShowSlugWarning] = useState(false);
  const [deleteCaptcha, setDeleteCaptcha] = useState('');
  const [mathCaptcha, setMathCaptcha] = useState({ a: 0, b: 0, sum: 0 });
  const [showSeedChoice, setShowSeedChoice] = useState(false);
  const [searchLeads, setSearchLeads] = useState('');
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);

  const hasUnsavedChanges = () => {
    if (!editingPage) return false;
    return JSON.stringify(editingPage) !== originalPage;
  };

  const handleCloseEditor = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      setIsEditing(false);
      setEditingPage(null);
    }
  };

  const generateMathCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setMathCaptcha({ a, b, sum: a + b });
  };

  const seedDemo = async () => {
    try {
      const city = 'Florianopolis';
      const modality = 'Muay Thai';
      const slug = `${slugify(city)}-${slugify(modality)}`;
      const demo: any = {
        type: 'chat',
        academyName: 'Dojo Central Floripa',
        city,
        modality,
        slug,
        title: 'Aula Experimental Muay Thai',
        whatsappNumber: '00000000000',
        campaignCode: 'DEMO-FLOW',
        updatedAt: new Date().toISOString(),
        chatConfig: {
          contactName: 'Mestre Helio',
          contactPhotoUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop',
          backgroundImageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
          steps: [
            { id: '1', type: 'text', message: 'Olá! Sou o Mestre Helio. Quer treinar Muay Thai com a gente em Floripa? Qual o seu nome?' },
            { 
              id: '2', 
              type: 'buttons', 
              message: 'Prazer em te conhecer! Já calçou as luvas antes ou quer começar do zero?',
              options: [
                { label: 'Já treinei', value: 'experiente', nextStepId: '3' },
                { label: 'Vou começar agora', value: 'iniciante', nextStepId: '4' }
              ]
            },
            { 
              id: '3', 
              type: 'listbox', 
              message: 'Que massa! Quanto tempo de treino você tem?',
              options: [
                { label: 'Menos de 6 meses', value: 'pouco' },
                { label: '6 meses a 2 anos', value: 'medio' },
                { label: 'Mais de 2 anos', value: 'avancado' }
              ]
            },
            { 
              id: '4', 
              type: 'image_options', 
              message: 'Top! Todo mundo começa um dia. Qual seu foco principal?',
              options: [
                { label: 'Emagrecimento', value: 'peso', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop' },
                { label: 'Defesa Pessoal', value: 'defesa', imageUrl: 'https://images.unsplash.com/photo-1552072047-39936321f274?w=200&h=200&fit=crop' },
                { label: 'Aliviar Stress', value: 'stress', imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop' }
              ]
            },
            { 
              id: '5', 
              type: 'media', 
              message: 'Olha só como são os nossos treinos aqui no Dojo Central:',
              mediaType: 'video',
              mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-performing-a-kick-in-a-karate-class-34289-large.mp4'
            },
            { 
              id: '6', 
              type: 'buttons', 
              message: 'Bora marcar uma aula experimental gratuita pra vc conhecer?',
              options: [
                { label: 'Sim, vamos!', value: 'bora', nextStepId: '7' },
                { label: 'Ainda não', value: 'depois' }
              ]
            },
            { id: '7', type: 'text', message: 'Show! Qual o seu WhatsApp para eu te mandar a agenda?' }
          ]
        }
      };
      await addDoc(collection(db, 'landing_pages'), demo);
      alert("Exemplo de Chat Flow criado com sucesso!");
      setShowSeedChoice(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao criar exemplo.");
    }
  };

  const seedDemoLP = async () => {
    try {
      const city = 'Joinville';
      const modality = 'Jiu Jitsu';
      const slug = `${slugify(city)}-${slugify(modality)}`;
      const demo: any = {
        type: 'lp',
        academyName: 'Dojô Sul Joinville',
        city,
        modality,
        slug,
        title: 'Aprenda Jiu-Jitsu de Verdade em Joinville',
        description: 'Método focado em defesa pessoal e condicionamento físico para todas as idades. Comece hoje sua jornada no Dojô Sul.',
        ctaText: 'Garantir Aula Grátis',
        whatsappNumber: '00000000000',
        campaignCode: 'DEMO-LP',
        updatedAt: new Date().toISOString(),
        primaryColor: '#cc0000',
        showForm: true,
        testimonials: [
          { name: 'Ricardo', role: 'Aluno há 2 anos', text: 'Mudei minha disposição depois que comecei no Dojô.' }
        ],
        images: ['https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80']
      };
      await addDoc(collection(db, 'landing_pages'), demo);
      alert("Exemplo de Landing Page criado com sucesso!");
      setShowSeedChoice(false);
    } catch (e) {
      console.error(e);
      alert("Erro ao criar exemplo.");
    }
  };

  const confirmDelete = async () => {
    if (!pageToDelete) return;
    
    if (parseInt(deleteCaptcha) === mathCaptcha.sum) {
      await deleteDoc(doc(db, 'landing_pages', pageToDelete.id!));
      setPageToDelete(null);
      setDeleteCaptcha('');
    } else {
      alert(`Resultado incorreto. ${mathCaptcha.a} + ${mathCaptcha.b} é igual a ${mathCaptcha.sum}.`);
      generateMathCaptcha();
      setDeleteCaptcha('');
    }
  };

  // SSH Config (Restore)
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
    const page: Partial<LandingPageConfig> = {
      type: 'lp',
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
      slug: '',
      chatConfig: {
        contactName: 'Mestre Helio',
        contactPhotoUrl: '',
        backgroundImageUrl: '',
        steps: [
          { id: '1', type: 'text', message: 'Olá! Qual o seu nome?' }
        ]
      }
    };
    setEditingPage(page);
    setOriginalPage(JSON.stringify(page));
    setIsEditing(true);
  };

  const handleEdit = (page: LandingPageConfig) => {
    setEditingPage(page);
    setOriginalPage(JSON.stringify(page));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingPage?.city || !editingPage?.modality) {
      alert("Cidade e Modalidade são obrigatórios");
      return;
    }

    const slug = editingPage.slug || `${slugify(editingPage.city)}-${slugify(editingPage.modality)}`;
    
    // Safety check for slug change
    const isNew = !editingPage.id;
    const oldPage = isNew ? null : pages.find(p => p.id === editingPage.id);
    const slugChanged = oldPage && oldPage.slug !== slug;
    
    if (slugChanged && !showSlugWarning) {
      const pageLeads = leads.filter(l => l.city === oldPage.city && l.modality === oldPage.modality);
      if (pageLeads.length > 0) {
        setShowSlugWarning(true);
        return;
      }
    }

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

  const handleDelete = async (page: LandingPageConfig) => {
    setPageToDelete(page);
    setDeleteCaptcha('');
    generateMathCaptcha();
  };

  const handleDuplicate = async (page: LandingPageConfig) => {
    const { id, ...data } = page;
    const newData = {
      ...data,
      city: `${data.city} Copia`,
      slug: `${slugify(data.city)}-copia-${Math.random().toString(36).substr(2, 4)}`,
      updatedAt: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, 'landing_pages'), newData);
      alert("Página duplicada com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao duplicar.");
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

          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={() => setShowSeedChoice(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-zinc-900 border border-amber-500/20 text-amber-500 hover:bg-zinc-800"
            >
              <Sparkles size={16} /> Gerar Exemplo Banco
            </button>
            
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
              <div className="w-px h-8 bg-zinc-800 my-auto mx-2 self-center" />
              <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-600 hover:text-red-500 transition-all"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
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
                      <div className="flex flex-col gap-2">
                        <div className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20 w-fit">
                          {page.modality}
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter w-fit border ${page.type === 'chat' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                          {page.type === 'chat' ? 'Chat Flow' : 'Classic LP'}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDuplicate(page)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all" title="Duplicar">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleEdit(page)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-all" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(page)} className="p-2.5 bg-zinc-800 hover:bg-red-500/20 rounded-xl text-zinc-400 hover:text-red-500 transition-all" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black mb-1 font-display tracking-tight uppercase italic">{page.city}</h3>
                    <p className="text-[10px] text-zinc-600 mb-6 font-mono tracking-widest">
                      Rota: {page.type === 'chat' ? '/chat' : '/lp'}/{slugify(page.city)}/{slugify(page.modality)}
                    </p>
                    <p className="text-zinc-500 text-sm line-clamp-2 mb-8 leading-relaxed italic">"{page.title}"</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href={`${page.type === 'chat' ? '/chat' : '/lp'}/${slugify(page.city)}/${slugify(page.modality)}`} 
                      target="_blank"
                      className="flex-1 bg-white text-black py-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-xl shadow-white/5"
                    >
                      Site <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}${page.type === 'chat' ? '/chat' : '/lp'}/${slugify(page.city)}/${slugify(page.modality)}`;
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
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
               <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome, e-mail ou protocolo..." 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-amber-500 transition-all text-sm"
                    value={searchLeads}
                    onChange={e => setSearchLeads(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-900">
                  <Users size={14} /> {leads.filter(l => l.name?.toLowerCase().includes(searchLeads.toLowerCase()) || l.protocol?.toLowerCase().includes(searchLeads.toLowerCase())).length} Leads Encontrados
               </div>
            </div>

            <div className="bg-zinc-900/30 rounded-[32px] border border-zinc-800 overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800">
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Protocolo</th>
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Data</th>
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Nome</th>
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Contato</th>
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Página</th>
                      <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-zinc-600">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {leads
                      .filter(lead => {
                        const term = searchLeads.toLowerCase();
                        return (
                          lead.name?.toLowerCase().includes(term) ||
                          lead.protocol?.toLowerCase().includes(term) ||
                          lead.email?.toLowerCase().includes(term) ||
                          lead.phone?.toLowerCase().includes(term)
                        );
                      })
                      .map(lead => (
                      <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-8 py-6">
                           <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
                             {lead.protocol || 'LEGADO'}
                           </span>
                        </td>
                        <td className="px-8 py-6 text-[10px] text-zinc-500 font-mono">
                          {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-sm truncate max-w-[150px]">{lead.name}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-black text-amber-500">{lead.phone}</div>
                          <div className="text-[10px] text-zinc-600 uppercase tracking-widest truncate max-w-[200px]">{lead.email}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="inline-block px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-black uppercase tracking-widest border border-zinc-700">{lead.modality}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">{lead.city}</div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setViewingLead(lead)}
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center justify-center"
                            title="Ver Conversa"
                          >
                            <MessageSquare size={16} />
                          </button>
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
                <button onClick={handleCloseEditor} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 space-y-12">
                {/* Mode Selector */}
                <div className="flex gap-4 p-2 bg-black border border-zinc-900 rounded-[30px] w-fit mx-auto">
                   <button 
                    onClick={() => setEditingPage({ ...editingPage, type: 'lp' })}
                    className={`px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${editingPage?.type === 'lp' ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-zinc-600 hover:text-white'}`}
                   >
                     <Layout size={14} /> Landing Page
                   </button>
                   <button 
                    onClick={() => setEditingPage({ ...editingPage, type: 'chat' })}
                    className={`px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${editingPage?.type === 'chat' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-zinc-600 hover:text-white'}`}
                   >
                     <MessageSquare size={14} /> Chat Flow
                   </button>
                </div>

                {/* Mandatory Route Data - HIGHLIGHTED */}
                <section className="p-8 bg-amber-500/10 border-2 border-amber-500/20 rounded-[32px] space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <Info className="text-black" size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest">Dados Obrigatórios da Rota</h3>
                      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Esses campos definem a URL e o redirecionamento.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Cidade *</label>
                      <input 
                        type="text" 
                        className={`w-full bg-black/40 border rounded-2xl px-6 py-4 outline-none transition-all font-bold text-white ${!editingPage?.city ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-amber-500'}`}
                        value={editingPage?.city}
                        onChange={e => setEditingPage({...editingPage, city: e.target.value})}
                        placeholder="Ex: Florianópolis"
                      />
                      {!editingPage?.city && <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-2">Campo necessário para a URL</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Modalidade *</label>
                      <input 
                        type="text" 
                        className={`w-full bg-black/40 border rounded-2xl px-6 py-4 outline-none transition-all font-bold text-white ${!editingPage?.modality ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-amber-500'}`}
                        value={editingPage?.modality}
                        onChange={e => {
                          const val = e.target.value;
                          const newSlug = editingPage?.campaignCode 
                            ? `${slugify(editingPage.city)}-${slugify(val)}-${slugify(editingPage.campaignCode)}`
                            : `${slugify(editingPage.city)}-${slugify(val)}`;
                          setEditingPage({...editingPage, modality: val, slug: newSlug});
                        }}
                        placeholder="Ex: Muay Thai"
                      />
                      {!editingPage?.modality && <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter ml-2">Campo necessário para a URL</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">URL Amigável (Slug) *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono text-xs text-amber-500"
                          value={editingPage?.slug}
                          onChange={e => setEditingPage({...editingPage, slug: slugify(e.target.value)})}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-30">
                           <Server size={12} />
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter ml-2">Ex: floripa-thai-promo</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Código de Campanha (Opcional)</label>
                      <input 
                        type="text" 
                        className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 transition-all font-mono text-zinc-500"
                        value={editingPage?.campaignCode}
                        onChange={e => {
                          const val = e.target.value;
                          const base = `${slugify(editingPage?.city || '')}-${slugify(editingPage?.modality || '')}`;
                          const newSlug = val ? `${base}-${slugify(val)}` : base;
                          setEditingPage({...editingPage, campaignCode: val, slug: newSlug});
                        }}
                        placeholder="Ex: GOOGLE-ADS"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">WhatsApp de Destino *</label>
                      <input 
                        type="text" 
                        className={`w-full bg-black/40 border rounded-2xl px-6 py-4 outline-none transition-all font-mono text-amber-500 ${!editingPage?.whatsappNumber ? 'border-red-500/50 focus:border-red-500' : 'border-zinc-800 focus:border-amber-500'}`}
                        value={editingPage?.whatsappNumber}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, ''); // Somente números
                          setEditingPage({...editingPage, whatsappNumber: val});
                        }}
                        placeholder="5548999999999"
                      />
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter ml-2">Formato: DDI + DDD + Número (ex: 55 48 99999 9999)</p>
                    </div>
                  </div>
                </section>

                {/* Branding & Style Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50">
                  <div className="space-y-4">
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
                      <UrlInput 
                        label="URL da Logo (PNG/SVG)"
                        value={editingPage?.logoUrl || ''}
                        onChange={v => setEditingPage({...editingPage, logoUrl: v})}
                        placeholder="https://sua-logo.com/imagem.png"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tema Visual (Paleta)</label>
                    <div className="grid grid-cols-1 gap-3">
                      {THEMES.map(theme => (
                        <button 
                          key={theme.id}
                          onClick={() => setEditingPage({...editingPage, theme: theme.id, primaryColor: theme.primary})}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${editingPage?.theme === theme.id ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-black/20 hover:bg-zinc-800/50'}`}
                        >
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary }} />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.secondary }} />
                          </div>
                          <span className={`text-xs font-bold ${editingPage?.theme === theme.id ? 'text-amber-500' : 'text-zinc-500'}`}>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {editingPage?.type === 'chat' ? (
                  <ChatFlowEditor 
                    config={editingPage.chatConfig!} 
                    onChange={(c) => setEditingPage({ ...editingPage, chatConfig: c })} 
                    onUpdatePage={(p) => setEditingPage({ ...editingPage, ...p })}
                  />
                ) : (
                  <div className="space-y-12">
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
                              if (!res.ok) {
                                throw new Error(data.error || "Falha na requisição");
                              }
                              setEditingPage({ ...editingPage, title: data.title, description: data.description });
                            } catch (e: any) {
                              alert(e.message || "Certifique-se de preencher Cidade e Modalidade primeiro.");
                            } finally {
                              setGenerating(false);
                            }
                          }}
                          className="px-6 py-3 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all disabled:opacity-50"
                         >
                           {generating ? 'Pensando...' : 'Mágica'}
                         </button>
                      </div>

                      {/* VSL (Video Sales Letter) Options */}
                      <section className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-[32px] space-y-6">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                               <Film className="text-black" size={16} />
                            </div>
                            <div>
                               <h3 className="text-xs font-black uppercase tracking-widest">VSL Strategy</h3>
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Força o cliente a assistir o vídeo antes do CTA</p>
                            </div>
                            <div className="ml-auto">
                               <button 
                                onClick={() => setEditingPage({ ...editingPage, vslEnabled: !editingPage?.vslEnabled })}
                                className={`w-12 h-6 rounded-full transition-all relative ${editingPage?.vslEnabled ? 'bg-purple-500' : 'bg-zinc-800'}`}
                               >
                                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingPage?.vslEnabled ? 'left-7' : 'left-1'}`} />
                               </button>
                            </div>
                         </div>

                         {editingPage?.vslEnabled && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-4 border-t border-purple-500/10">
                               <UrlInput 
                                 label="URL do Vídeo VSL (.mp4 ou YouTube)"
                                 value={editingPage.vslVideoUrl || ''}
                                 onChange={v => setEditingPage({ ...editingPage, vslVideoUrl: v })}
                               />
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Título da Trava (Headline)</label>
                                     <input 
                                       type="text" 
                                       className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold"
                                       value={editingPage.vslHeadline || ''}
                                       onChange={e => setEditingPage({ ...editingPage, vslHeadline: e.target.value })}
                                       placeholder="Assista ao vídeo abaixo para liberar seu acesso"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Subtítulo (Abaixo do Título)</label>
                                     <input 
                                       type="text" 
                                       className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold"
                                       value={editingPage.vslSubheadline || ''}
                                       onChange={e => setEditingPage({ ...editingPage, vslSubheadline: e.target.value })}
                                       placeholder="Isso levará apenas alguns segundos"
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Texto do Botão CTA (Após Vídeo)</label>
                                  <input 
                                    type="text" 
                                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold"
                                    value={editingPage.vslCtaText || ''}
                                    onChange={e => setEditingPage({ ...editingPage, vslCtaText: e.target.value })}
                                    placeholder="Quero garantir minha vaga →"
                                  />
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tipo de Desbloqueio</label>
                                     <select 
                                       className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-xs font-bold"
                                       value={editingPage.vslUnlockType || 'seconds'}
                                       onChange={e => setEditingPage({ ...editingPage, vslUnlockType: e.target.value as any })}
                                     >
                                        <option value="seconds">Por Tempo (Segundos)</option>
                                        <option value="end">No Final do Vídeo</option>
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Configuração de Tempo (segundos)</label>
                                     <input 
                                       type="number" 
                                       className="w-full bg-black/40 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:border-amber-500 text-sm font-mono"
                                       value={editingPage.vslAutoSkipSeconds || 0}
                                       disabled={editingPage.vslUnlockType === 'end'}
                                       onChange={e => setEditingPage({ ...editingPage, vslAutoSkipSeconds: parseInt(e.target.value) })}
                                     />
                                     <p className="text-[9px] text-zinc-600 uppercase tracking-tighter">
                                       {editingPage.vslUnlockType === 'end' 
                                         ? 'O CTA aparecerá quando o vídeo terminar.' 
                                         : 'O CTA aparecerá após os segundos configurados (após o play).'}
                                     </p>
                                  </div>
                               </div>
                            </motion.div>
                         )}
                      </section>

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

                    {/* Background Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-900/30 rounded-[32px] border border-zinc-800/50">
                       <UrlInput 
                         label="Imagem de Fundo (Padrão: Preto)"
                         value={editingPage?.backgroundImage || ''}
                         onChange={v => setEditingPage({ ...editingPage, backgroundImage: v })}
                         placeholder="URL da imagem de fundo"
                       />
                       <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Opacidade do Fundo ({((editingPage?.backgroundOpacity || 0.1) * 100).toFixed(0)}%)</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05"
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            value={editingPage?.backgroundOpacity ?? 0.1}
                            onChange={e => setEditingPage({ ...editingPage, backgroundOpacity: parseFloat(e.target.value) })}
                          />
                          <div className="flex justify-between text-[8px] text-zinc-600 font-black uppercase tracking-widest mt-1">
                             <span>Invisível</span>
                             <span>Sutil</span>
                             <span>Nítida</span>
                          </div>
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
                      <div className="grid grid-cols-1 gap-6">
                        {editingPage?.images?.map((url, i) => (
                          <div key={i} className="flex gap-4 items-end">
                            <div className="flex-1">
                              <UrlInput 
                                label={`Imagem #${i + 1}`}
                                value={url}
                                onChange={v => updateImage(i, v)}
                              />
                            </div>
                            <button onClick={() => removeImage(i)} className="p-4 bg-zinc-900 font-bold hover:bg-red-500/20 text-zinc-700 hover:text-red-500 rounded-2xl transition-all h-14">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 border-t border-zinc-900 bg-zinc-900/20 flex flex-col md:flex-row items-center justify-end gap-6 sticky bottom-0 backdrop-blur-md">
                <button 
                  onClick={handleCloseEditor}
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
          <p className="text-[9px] font-mono opacity-50 italic">Desenvolvido por Helio P. Galvão</p>
          <p className="text-[8px] font-mono tracking-widest uppercase text-zinc-700">Professor de BJJ & Dev Fullstack since 1998</p>
        </div>
      </footer>

      {/* Seed Choice Modal */}
      <AnimatePresence>
        {showSeedChoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] max-w-sm w-full space-y-6"
            >
              <h3 className="text-xl font-bold">Qual exemplo criar?</h3>
              <div className="grid gap-3">
                <button onClick={seedDemo} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold uppercase tracking-widest text-[10px]">1. Chat Flow (Interativo)</button>
                <button onClick={seedDemoLP} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold uppercase tracking-widest text-[10px]">2. Landing Page (Clássico)</button>
              </div>
              <button onClick={() => setShowSeedChoice(false)} className="w-full py-2 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Cancelar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {pageToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] max-w-md w-full space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-red-500">Excluir Página?</h3>
                <p className="text-zinc-500 text-sm">Esta ação é irreversível e removerá todos os leads associados a esta rota.</p>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 line-clamp-1">Quanto é <span className="text-white text-lg px-2">{mathCaptcha.a} + {mathCaptcha.b}</span>?</p>
                <input 
                  type="number"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-6 py-4 outline-none focus:border-red-500 transition-all font-bold text-center text-xl"
                  value={deleteCaptcha}
                  onChange={e => setDeleteCaptcha(e.target.value)}
                  placeholder="?"
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setPageToDelete(null); setDeleteCaptcha(''); }} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Manter</button>
                <button 
                  onClick={confirmDelete}
                  disabled={!deleteCaptcha}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  Excluir de Vez
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slug Change Warning */}
      <AnimatePresence>
        {showSlugWarning && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border-2 border-amber-500/50 p-8 rounded-[32px] max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <Info size={24} />
                <h3 className="text-xl font-bold uppercase italic">Cuidado: Alteração de Rota!</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Você está alterando o endereço (slug) de uma página que já possui leads/visitas. 
                <span className="block mt-2 font-bold text-white underline italic">Isso quebrará o link atual onde seus anúncios estão rodando!</span>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSlugWarning(false)} 
                  className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Voltar e Corrigir
                </button>
                <button 
                  onClick={() => { setShowSlugWarning(false); handleSave(); }}
                  className="flex-1 py-4 bg-amber-500 text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                >
                  Entendi, Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Modal */}
      <AnimatePresence>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[32px] max-w-sm w-full space-y-6"
            >
              <h3 className="text-xl font-bold">Respirar Fundo...</h3>
              <p className="text-zinc-500 text-sm">Você tem alterações não salvas. Deseja realmente sair e descartar tudo?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowUnsavedModal(false)}
                  className="flex-1 py-4 bg-zinc-800 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Continuar Editando
                </button>
                <button 
                  onClick={() => {
                    setShowUnsavedModal(false);
                    setIsEditing(false);
                    setEditingPage(null);
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                >
                  Descartar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lead Details Modal */}
      <AnimatePresence>
        {viewingLead && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[40px] flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black font-black text-xl">
                      {viewingLead.name?.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h3 className="text-xl font-bold italic uppercase tracking-tight">{viewingLead.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{viewingLead.protocol || 'Sem Protocolo'}</p>
                   </div>
                </div>
                <button onClick={() => setViewingLead(null)} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                 {/* Lead Info */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800">
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 block mb-1">WhatsApp</span>
                       <span className="text-sm font-bold text-amber-500">{viewingLead.phone}</span>
                    </div>
                    <div className="bg-black/30 p-4 rounded-2xl border border-zinc-800">
                       <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 block mb-1">E-mail</span>
                       <span className="text-xs font-medium text-white truncate">{viewingLead.email}</span>
                    </div>
                 </div>

                 {/* Content based on Lead Type */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                       {viewingLead.type === 'chat' ? <MessageSquare size={12} /> : <List size={12} />}
                       {viewingLead.type === 'chat' ? 'Resumo da Conversa' : 'Dados do Formulário'}
                    </h4>

                    {viewingLead.type === 'chat' && viewingLead.chatHistory ? (
                       <div className="space-y-3">
                          {viewingLead.chatHistory.map((item, i) => (
                             <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${item.role === 'user' ? 'bg-amber-500/10 border border-amber-500/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                   {item.message}
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="bg-black/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
                          {Object.entries(viewingLead)
                            .filter(([key]) => !['id', 'name', 'email', 'phone', 'createdAt', 'protocol', 'chatHistory', 'type', 'city', 'modality', 'campaignCode', 'academyName'].includes(key))
                            .map(([key, value]) => (
                               <div key={key} className="flex flex-col gap-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{key}</span>
                                  <span className="text-sm text-white font-medium">{value as string}</span>
                               </div>
                            ))
                          }
                       </div>
                    )}
                 </div>
              </div>

              <div className="p-8 border-t border-zinc-800 bg-zinc-950/30 flex gap-4">
                 <button 
                  onClick={() => window.open(`https://wa.me/${viewingLead.phone?.replace(/\D/g, '')}`, '_blank')}
                  className="flex-1 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all"
                 >
                    Chamar no WhatsApp
                 </button>
                 <button 
                  onClick={() => {
                    const text = `Lead: ${viewingLead.name}\nProtocolo: ${viewingLead.protocol}\nWhatsApp: ${viewingLead.phone}\nE-mail: ${viewingLead.email}\n\nResumo:\n${viewingLead.chatHistory?.map(m => `${m.role === 'user' ? 'CLIENTE' : 'BOT'}: ${m.message}`).join('\n') || 'N/A'}`;
                    navigator.clipboard.writeText(text);
                    alert("Copiado!");
                  }}
                  className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white"
                 >
                    <Copy size={20} />
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
