/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LandingPageConfig, ChatStep, ChatOption } from '../types';
import { THEMES } from '../themes';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ChevronLeft, MoreVertical, Camera, Phone, Video, Info, Image as ImageIcon, CheckCircle2, Play, Volume2, ExternalLink, Server } from 'lucide-react';

export default function ChatPage() {
  const { city, modality } = useParams();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; content: string; type?: string; mediaUrl?: string; options?: ChatOption[] }[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [completed, setCompleted] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const [protocol] = useState(() => `${modality?.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [isShaking, setIsShaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const idleTime = Date.now() - lastInteraction;
      if (!completed && !isTyping && idleTime > 60000 && idleTime < 65000) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 1000);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [lastInteraction, completed, isTyping]);

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !db) {
      setFirebaseError(true);
      setLoading(false);
      return;
    }
    if (!city || !modality) return;

    const cleanCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const cleanModality = modality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${cleanCity}-${cleanModality}`;

    const q = query(
      collection(db, 'landing_pages'),
      where('slug', '==', slug),
      where('type', '==', 'chat')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as LandingPageConfig;
        setConfig({ ...data, id: snapshot.docs[0].id });
      }
      setLoading(false);
    }, (error: any) => {
      console.error("Chat Flow Snapshot Error:", error);
      if (error.code === 'auth/invalid-api-key' || (error.message && error.message.includes('API key'))) {
        setFirebaseError(true);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [city, modality]);

  const currentTheme = THEMES.find(t => t.id === config?.theme) || THEMES[0];
  const primaryColor = config?.primaryColor || currentTheme.primary;

  useEffect(() => {
    if (config?.chatConfig?.steps && messages.length === 0) {
      processStep(0);
    }
  }, [config]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const processStep = async (index: number) => {
    if (completed) return;
    
    setIsTyping(true);
    
    if (!config?.chatConfig?.steps[index]) {
      // Final persistence logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsTyping(false);
      setCompleted(true);
      saveLead();
      return;
    }

    const step = config.chatConfig.steps[index];
    
    // Send bot message to UI
    const botMsg = { 
      role: 'bot' as const, 
      content: step.message, 
      type: step.type,
      mediaUrl: step.mediaUrl,
      options: step.options 
    };

    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);
    setCurrentStepIndex(index);
    
    if (step.type === 'media') {
       // Progress to next step after media
       setTimeout(() => {
         const nextIndex = findNextIndex(step);
         processStep(nextIndex);
       }, 5000);
    }
  };

  const findNextIndex = (currentStep: ChatStep, choiceValue?: string) => {
    if (choiceValue) {
      const selectedOption = currentStep.options?.find(o => o.value === choiceValue);
      if (selectedOption?.nextStepId) {
        const index = config?.chatConfig?.steps.findIndex(s => s.id === selectedOption.nextStepId);
        if (index !== -1) return index!;
      }
    }
    
    if (currentStep.nextStepId) {
      const index = config?.chatConfig?.steps.findIndex(s => s.id === currentStep.nextStepId);
      if (index !== -1) return index!;
    }

    return currentStepIndex + 1;
  };

  const handleUserInput = (value: string, label?: string) => {
    const currentStep = config?.chatConfig?.steps[currentStepIndex];
    if (!currentStep) return;

    // Validation
    if (currentStep.validationType === 'email') {
      if (!value.includes('@') || value.length < 5) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { role: 'bot', content: "Ops, esse e-mail parece inválido. Pode conferir por favor? 📧" }]);
        }, 1000);
        return;
      }
    }
    if (currentStep.validationType === 'phone') {
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
         setIsTyping(true);
         setTimeout(() => {
           setIsTyping(false);
           setMessages(prev => [...prev, { role: 'bot', content: "Preciso de um número válido com DDD para te chamar depois! 📱" }]);
         }, 1000);
        return;
      }
    }
    if (currentStep.validationType === 'name' && value.trim().length < 2) {
       return;
    }

    setLastInteraction(Date.now());

    // Save response
    const key = currentStep.validationType !== 'none' && currentStep.validationType ? currentStep.validationType : currentStep.message;
    const newResponses = { ...responses, [key]: label || value };
    setResponses(newResponses);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: label || value }]);
    setInputValue('');

    const nextIndex = findNextIndex(currentStep, value);
    processStep(nextIndex);
  };

  const saveLead = async () => {
    if (!config) return;
    
    const leadData = {
      name: responses.name || 'Anônimo',
      email: responses.email || '',
      phone: responses.phone || '',
      ...responses,
      city: config.city,
      modality: config.modality,
      campaignCode: config.campaignCode,
      academyName: config.academyName,
      type: 'chat',
      protocol,
      chatHistory: messages.map(m => ({ 
        role: m.role, 
        message: m.content, 
        timestamp: new Date().toISOString() 
      })),
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'leads'), leadData);

    if (config.webhookUrl) {
      fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      }).catch(e => console.warn("Webhook error:", e));
    }
  };

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center font-sans text-white">
        <Server className="text-red-500 mb-6" size={48} />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-4">Erro de Transmissão</h1>
        <p className="opacity-50 text-xs uppercase tracking-widest max-w-xs mb-8">O sinal com a central foi perdido. Verifique as credenciais do banco de dados.</p>
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">Restabelecer Conexão</button>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderTopColor: primaryColor }} /></div>;
  
  if (!config) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center" style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}>
      <h1 className="text-4xl font-black mb-4">404</h1>
      <p className="opacity-50 uppercase tracking-widest text-xs">Fluxo de conversa não encontrado.</p>
    </div>
  );

  return (
    <div 
      className={`flex flex-col h-screen font-sans max-w-lg mx-auto border-x border-zinc-900 relative shadow-2xl transition-all duration-300 ${isShaking ? 'translate-x-2' : ''}`}
      style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
    >
      {/* Background Image with Overlay */}
      {config.chatConfig?.backgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: `url(${config.chatConfig.backgroundImageUrl})` }}
        />
      )}

      {/* Header (Instagram Style) */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <ChevronLeft size={28} className="cursor-pointer" onClick={() => window.history.back()} />
          <div className="relative">
            <img 
              src={config.chatConfig?.contactPhotoUrl || config.logoUrl || "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=100&h=100&fit=crop"} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover border border-zinc-800"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">{config.chatConfig?.contactName || config.academyName}</h2>
            <p className="text-[10px] text-emerald-500 font-medium">Ativo agora</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-zinc-300">
          <Phone size={20} />
          <Video size={24} />
          <Info size={22} />
        </div>
      </header>

      {/* Messaging Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth z-10"
      >
        <div className="flex flex-col items-center py-10 opacity-50">
          <img 
            src={config.chatConfig?.contactPhotoUrl || config.logoUrl || "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=100&h=100&fit=crop"} 
            alt="Avatar Large" 
            className="w-20 h-20 rounded-full object-cover mb-4 grayscale"
          />
          <h3 className="text-xl font-black italic">{config.chatConfig?.contactName || config.academyName}</h3>
          <p className="text-[10px] uppercase tracking-widest mt-2">{config.modality} • {config.city}</p>
          <button className="mt-4 px-4 py-1.5 bg-zinc-900 rounded-lg text-xs font-bold">Ver Perfil</button>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {msg.role === 'bot' && (
                <img 
                  src={config.chatConfig?.contactPhotoUrl || config.logoUrl || "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=100&h=100&fit=crop"} 
                  className="w-6 h-6 rounded-full object-cover mb-1" 
                  alt="bot"
                />
              )}
              <div className="max-w-[75%] space-y-2">
                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'text-white rounded-br-none' 
                    : 'text-white rounded-bl-none'
                }`} style={{ backgroundColor: msg.role === 'user' ? primaryColor : (currentTheme.secondary || '#27272a'), color: msg.role === 'user' ? '#000' : 'inherit' }}>
                  {msg.content}
                </div>

                {/* Media Content */}
                {msg.type === 'media' && msg.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video w-full">
                    {msg.mediaUrl.includes('youtube.com') || msg.mediaUrl.includes('youtu.be') ? (
                      <iframe 
                        src={`${msg.mediaUrl.replace('watch?v=', 'embed/')}?autoplay=1&mute=1`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                      />
                    ) : msg.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || msg.mediaUrl.includes('firebasestorage') ? (
                      <video src={msg.mediaUrl} controls autoPlay muted className="w-full" />
                    ) : (
                      <img src={msg.mediaUrl} className="w-full" referrerPolicy="no-referrer" />
                    )}
                  </div>
                )}

                {msg.type === 'link' && (
                  <div className="space-y-3">
                     <a 
                       href={config?.chatConfig?.steps.find(s => s.message === msg.content)?.linkUrl || '#'} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block bg-zinc-800 p-4 rounded-xl border border-zinc-700 hover:border-blue-500 transition-all group"
                     >
                        <div className="flex items-center justify-between gap-4">
                           <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center shrink-0">
                              <ExternalLink size={20} className="text-blue-500" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{config?.chatConfig?.steps.find(s => s.message === msg.content)?.linkLabel || 'Acessar Link'}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{config?.chatConfig?.steps.find(s => s.message === msg.content)?.linkUrl}</p>
                           </div>
                        </div>
                     </a>
                     <button 
                       onClick={() => {
                          const currentStep = config?.chatConfig?.steps[currentStepIndex];
                          if (currentStep) {
                            const nextIndex = findNextIndex(currentStep);
                            processStep(nextIndex);
                          }
                       }}
                       style={{ backgroundColor: primaryColor }}
                       className="w-full py-2 text-black rounded-xl text-[10px] font-black uppercase tracking-widest"
                     >
                        Continuar conversa →
                     </button>
                  </div>
                )}

                {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-700" style={{ backgroundColor: currentTheme.secondary }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <Volume2 size={20} className="text-black" />
                    </div>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: currentTheme.bg }}>
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5 }}
                        className="h-full" 
                        style={{ backgroundColor: primaryColor }}
                       />
                    </div>
                  </div>
                )}

                {/* Interaction Elements */}
                {!completed && msg.role === 'bot' && i === messages.length - 1 && (
                  <div className="flex flex-col gap-2 mt-4">
                    {msg.type === 'buttons' && msg.options?.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleUserInput(opt.value, opt.label)}
                        className="w-full py-3 bg-transparent border border-zinc-700 hover:bg-zinc-800 rounded-2xl text-xs font-bold transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}

                    {msg.type === 'image_options' && (
                      <div className="grid grid-cols-3 gap-2">
                        {msg.options?.map((opt, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleUserInput(opt.value, opt.label)}
                            className="flex flex-col items-center gap-2 p-2 rounded-xl border transition-all hover:opacity-80"
                            style={{ backgroundColor: currentTheme.secondary, borderColor: currentTheme.border }}
                          >
                            <img src={opt.imageUrl} className="w-full aspect-square object-cover rounded-lg" alt={opt.label} />
                            <span className="text-[9px] font-black uppercase text-center">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.type === 'listbox' && (
                       <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 space-y-1">
                          {msg.options?.map((opt, idx) => (
                            <button 
                              key={idx}
                              onClick={() => handleUserInput(opt.value, opt.label)}
                              className="w-full text-left px-4 py-2 hover:bg-zinc-800 rounded-lg text-xs"
                            >
                              {opt.label}
                            </button>
                          ))}
                       </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start items-end gap-2">
             <img 
               src={config.chatConfig?.contactPhotoUrl || config.logoUrl || "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=100&h=100&fit=crop"} 
               className="w-6 h-6 rounded-full object-cover mb-1" 
               alt="bot"
             />
             <div className="bg-zinc-800 px-4 py-2 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                </div>
             </div>
          </div>
        )}

         {completed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-10 space-y-6"
          >
             <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Protocolo</span>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border" style={{ color: primaryColor, backgroundColor: `${primaryColor}1A`, borderColor: `${primaryColor}33` }}>{protocol}</span>
             </div>

             <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative">
                <CheckCircle2 size={40} className="text-black" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
             </div>
             <div className="text-center space-y-2 px-6">
                <h4 className="text-2xl font-black italic uppercase tracking-tight">Quase tudo pronto!</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Para garantir sua vaga e tirar todas as dúvidas, vou te chamar agora mesmo no WhatsApp. 
                  <span className="block mt-2 font-bold text-white">Fica de olho no seu celular! 📱</span>
                </p>
             </div>
             <button 
                onClick={() => {
                  const whatsappMsg = `Olá! Tenho interesse na aula de ${config.modality} em ${config.city}. Meu protocolo é: ${protocol}`;
                  window.location.href = `https://wa.me/${config.whatsappNumber?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`;
                }}
                className="w-full max-w-xs py-5 bg-emerald-500 text-black rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
              >
               Chamar no WhatsApp Agora
             </button>
             <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Inscrição realizada com sucesso</p>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black border-t border-zinc-900 z-10">
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
          <div className="p-2 bg-blue-600 rounded-full shrink-0">
             <Camera size={16} className="text-white" />
          </div>
          <input 
            type="text" 
            placeholder="Mensagem..." 
            className="flex-1 bg-transparent border-none outline-none text-sm py-2 disabled:opacity-50"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              const currentStep = config?.chatConfig?.steps[currentStepIndex];
              
              if (currentStep?.validationType === 'phone') {
                const digits = val.replace(/\D/g, '');
                if (digits.length <= 11) {
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7) {
                    const isMobile = digits.length === 11;
                    const splitPos = isMobile ? 7 : 6;
                    formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, splitPos)}-${digits.slice(splitPos)}`;
                  }
                  setInputValue(formatted);
                }
              } else if (currentStep?.validationType === 'name') {
                setInputValue(val.replace(/[0-9]/g, ''));
              } else {
                setInputValue(val);
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && inputValue && handleUserInput(inputValue)}
            disabled={completed || isTyping || (config.chatConfig?.steps[currentStepIndex]?.type !== 'text' && messages.length > 0)}
          />
          {inputValue ? (
            <button onClick={() => handleUserInput(inputValue)} className="text-blue-500 font-bold text-sm mr-2 hover:scale-110 transition-transform">
              Enviar
            </button>
          ) : (
            <div className="flex gap-4 pr-2 text-zinc-300">
               <ImageIcon size={20} />
               <Volume2 size={20} />
               <Play size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
