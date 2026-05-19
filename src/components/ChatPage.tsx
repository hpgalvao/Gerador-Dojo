/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { LandingPageConfig, ChatStep, ChatOption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ChevronLeft, MoreVertical, Camera, Phone, Video, Info, Image as ImageIcon, CheckCircle2, Play, Volume2 } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    });

    return () => unsub();
  }, [city, modality]);

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
    
    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsTyping(false);
    
    const newMessages = [...messages];
    
    if (step.type === 'media') {
       newMessages.push({ 
         role: 'bot', 
         content: step.message, 
         type: step.mediaType,
         mediaUrl: step.mediaUrl 
       });
       setMessages(newMessages);
       
       // Progress to next step after media
       setTimeout(() => {
         const nextIndex = findNextIndex(step);
         processStep(nextIndex);
       }, 5000);
    } else {
       newMessages.push({ 
         role: 'bot', 
         content: step.message, 
         type: step.type,
         options: step.options 
       });
       setMessages(newMessages);
       setCurrentStepIndex(index);
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

    // Save response
    const newResponses = { ...responses, [currentStep.message]: label || value };
    setResponses(newResponses);

    // Add user message to UI
    setMessages([...messages, { role: 'user', content: label || value }]);
    setInputValue('');

    const nextIndex = findNextIndex(currentStep, value);
    processStep(nextIndex);
  };

  const saveLead = async () => {
    if (!config) return;
    
    const leadData = {
      ...responses,
      city: config.city,
      modality: config.modality,
      campaign: config.campaignCode,
      academyName: config.academyName,
      type: 'chat',
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  
  if (!config) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 text-center">
      <h1 className="text-4xl font-black mb-4">404</h1>
      <p className="text-zinc-500 uppercase tracking-widest text-xs">Fluxo de conversa não encontrado.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans max-w-lg mx-auto border-x border-zinc-900 relative shadow-2xl">
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
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-zinc-800 text-white rounded-bl-none'
                }`}>
                  {msg.content}
                </div>

                {/* Media Content */}
                {msg.type === 'video' && msg.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                    <video src={msg.mediaUrl} controls autoPlay className="w-full" />
                  </div>
                )}

                {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <Volume2 size={20} className="text-black" />
                    </div>
                    <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5 }}
                        className="h-full bg-amber-500" 
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
                            className="flex flex-col items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-amber-500 transition-all"
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
                onClick={() => window.location.href = `https://wa.me/${config.whatsappNumber?.replace(/\D/g, '')}`}
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
            onChange={(e) => setInputValue(e.target.value)}
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
