/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LandingPageConfig, Lead } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Send, CheckCircle, Image as ImageIcon, Video, Star, Phone, User, Mail, MapPin } from 'lucide-react';

export default function LandingPage() {
  const { city, modality } = useParams();
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [lead, setLead] = useState({ name: '', email: '', phone: '' });

  const campaign = searchParams.get('utm_campaign') || config?.campaignCode || 'direto';

  useEffect(() => {
    async function fetchConfig() {
      if (!city || !modality) return;
      const cleanCity = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const cleanModality = modality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const slug = `${cleanCity}-${cleanModality}`;
      
      try {
        const q = query(collection(db, 'landing_pages'), where('slug', '==', slug));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Busca o primeiro que combine com o tipo LP ou que não tenha tipo (legado)
          const doc = querySnapshot.docs.find(d => {
            const t = d.data().type;
            return t === 'lp' || !t;
          });
          if (doc) {
            setConfig(doc.data() as LandingPageConfig);
          }
        }
      } catch (error) {
        console.error("Error fetching LP config:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [city, modality]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      const leadData: Lead = {
        ...lead,
        city: config.city,
        modality: config.modality,
        campaignCode: campaign,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'leads'), leadData);

      // Trigger Webhook if present
      if (config.webhookUrl) {
        try {
          fetch(config.webhookUrl, {
            method: 'POST',
            mode: 'no-cors', // Many CRM webhooks don't return CORS headers
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...leadData,
              academyName: config.academyName,
              source: window.location.href,
              submittedAt: new Date().toISOString()
            })
          }).catch(e => console.warn("Webhook background error:", e));
        } catch (webhookErr) {
          console.error("Webhook error:", webhookErr);
        }
      }

      setFormSubmitted(true);
    } catch (error) {
      console.error("Error submitting lead:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center font-sans">
        <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
        <p className="text-zinc-400 max-w-md">Não conseguimos encontrar uma landing page para {modality} em {city}. Verifique a URL ou crie uma no painel administrador.</p>
        <a href="/admin" className="mt-8 px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors">Voltar ao Painel</a>
      </div>
    );
  }

  const primaryColor = config.primaryColor || '#f59e0b';
  const whatsappUrl = `https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=Olá! Gostaria de saber mais sobre as aulas de ${config.modality} em ${config.city}`;

  const pageTitle = config?.title || `${modality} em ${city} | Aula Experimental Grátis`;
  const pageDesc = config?.description || `Inscreva-se para aulas de ${modality} em ${city}. Venha conhecer nossa unidade e transforme sua vida.`;

  return (
    <div className="min-h-screen bg-[#0F0F10] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Structured Data for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": config?.academyName || `Dojô ${config?.modality || modality} ${config?.city || city}`,
            "description": pageDesc,
            "image": config?.logoUrl || "",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": config?.city || city,
              "addressRegion": "BR"
            },
            "telephone": config?.whatsappNumber
          })}
        </script>
      </Helmet>

      {/* Navbar */}
      <nav className="px-6 md:px-12 py-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent fixed top-0 w-full z-50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt={config.academyName} className="h-10 md:h-12 w-auto object-contain" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 bg-amber-500 flex items-center justify-center rounded-lg rotate-3 shadow-lg shadow-amber-500/30">
              <span className="text-black font-black text-xl italic font-display">BJJ</span>
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight uppercase hidden sm:block">
            {config.academyName || `Dojô ${config.city}`}
          </h1>
        </div>
        <div className="flex gap-4 md:gap-8 text-xs font-bold uppercase tracking-widest">
          <a href="#" className="text-amber-500">Início</a>
          <a href="#espaco" className="hover:text-amber-400 transition-colors">Dojô</a>
          <a href="#contato" className="hover:text-amber-400 transition-colors">Agendar</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col pt-32 lg:pt-20">
        <section className="relative px-6 md:px-12 pb-20 flex flex-col lg:flex-row items-center gap-12 lg:min-h-[80vh]">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[1000px] bg-gradient-to-br from-amber-950/20 via-zinc-950 to-transparent blur-3xl -z-10" />

          {/* Left Column: Copy */}
          <div className="w-full lg:w-3/5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-block py-1 px-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest text-amber-500 uppercase"
            >
              📍 {config.city} • {config.modality}
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter font-display"
            >
              {config.title.split(' ').map((word, i) => (
                <span key={i} className={i % 3 === 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 italic block mt-2" : "block"}>
                  {word}{' '}
                </span>
              ))}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed"
            >
              Transforme sua vida através do <span className="text-white font-semibold underline decoration-amber-500 underline-offset-4">{config.modality}</span>. Disciplina, técnica e comunidade em {config.city}.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <a 
                href="#contato"
                style={{ backgroundColor: primaryColor }}
                className="px-8 py-5 text-black font-black text-lg rounded-xl shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all text-center uppercase tracking-tight"
              >
                {config.ctaText}
              </a>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-5 bg-zinc-800/50 border border-white/10 text-white font-bold text-lg rounded-xl backdrop-blur-sm hover:bg-zinc-800 transition-all text-center flex items-center justify-center gap-2"
              >
                <MessageCircle size={22} />
                WhatsApp
              </a>
            </motion.div>

            {/* Features Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-12"
            >
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="text-amber-500 font-black text-xl mb-1 font-display">+500</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Alunos Ativos</div>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="text-amber-500 font-black text-xl mb-1 font-display">100%</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Black Belts</div>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm hidden md:block">
                <div className="text-amber-500 font-black text-xl mb-1 font-display">24/7</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Vagas Limitadas</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Lead Form */}
          <div className="w-full lg:w-2/5 mt-12 lg:mt-0">
            {config.showForm && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                id="contato"
                className="bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-[32px] shadow-2xl relative"
              >
                <div className="absolute -top-4 -right-4 bg-amber-500 text-black font-black px-4 py-2 rounded-lg -rotate-12 shadow-lg text-sm z-10">
                  AULA GRÁTIS
                </div>
                
                <AnimatePresence mode="wait">
                  {formSubmitted ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-10"
                    >
                      <CheckCircle size={64} className="mx-auto mb-6 text-emerald-500" />
                      <h3 className="text-3xl font-bold mb-4">Vaga Reservada!</h3>
                      <p className="text-zinc-400 mb-8">Em breve um instrutor entrará em contato pelo seu WhatsApp.</p>
                      <button 
                        onClick={() => setFormSubmitted(false)}
                        className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                      >
                        Enviar outro contato
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form">
                      <h3 className="text-2xl font-bold mb-8 text-center">Inicie sua <span className="text-amber-500 italic">Jornada</span></h3>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black">Seu Nome</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:border-amber-500 outline-none placeholder:text-zinc-700 transition-colors"
                            placeholder="Ex: Roberto Silva"
                            value={lead.name}
                            onChange={e => setLead({...lead, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black">E-mail</label>
                          <input 
                            required
                            type="email" 
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:border-amber-500 outline-none placeholder:text-zinc-700 transition-colors"
                            placeholder="seu@email.com"
                            value={lead.email}
                            onChange={e => setLead({...lead, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-black">WhatsApp</label>
                          <input 
                            required
                            type="tel" 
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-4 text-sm focus:border-amber-500 outline-none placeholder:text-zinc-700 transition-colors"
                            placeholder="(11) 99999-9999"
                            value={lead.phone}
                            onChange={e => setLead({...lead, phone: e.target.value})}
                          />
                        </div>
                        <div className="pt-4">
                          <button 
                            type="submit"
                            style={{ backgroundColor: primaryColor }}
                            className="w-full py-5 text-black font-black rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest text-sm shadow-xl shadow-amber-500/10"
                          >
                            Agendar Agora
                          </button>
                        </div>
                        <p className="text-[10px] text-center text-zinc-600 px-4">
                          🔒 Seus dados estão seguros e serão usados apenas para contato comercial do Dojô.
                        </p>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Testimonial Mini-Card */}
                {config.testimonials && config.testimonials.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-zinc-800">
                    <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <User className="text-zinc-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm italic text-zinc-300 italic leading-relaxed font-serif">"{config.testimonials[0].text}"</p>
                        <p className="text-[10px] text-amber-500 font-bold uppercase mt-2">{config.testimonials[0].name}, {config.testimonials[0].role}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Video Section */}
        {config.videoUrl && (
          <section className="py-24 px-6 bg-zinc-950/80 border-y border-white/5">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-3xl font-black mb-12 text-center uppercase tracking-tighter">O Caminho do <span className="text-amber-500 italic">Guerreiro</span></h3>
              <motion.div 
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.95 }}
                className="aspect-video rounded-[40px] overflow-hidden bg-zinc-900 shadow-2xl border border-white/5 relative group ring-8 ring-zinc-900"
              >
                <iframe 
                  src={config.videoUrl.replace('watch?v=', 'embed/')} 
                  className="w-full h-full"
                  title="Dojo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Images Section */}
        {config.images && config.images.length > 0 && (
          <section id="espaco" className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                  <span className="text-amber-500 font-bold uppercase tracking-[0.2em] text-xs">A Academia</span>
                  <h2 className="text-5xl font-black tracking-tighter mt-2 font-display">NOSSO <span className="text-zinc-700 italic">QG</span></h2>
                </div>
                <p className="text-zinc-500 max-w-sm text-sm border-l-2 border-amber-500/30 pl-4 italic">Estrutura premium focada na alta performance e segurança de nossos alunos.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {config.images.map((img, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ y: -10 }}
                    className="aspect-[4/5] rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl relative"
                  >
                    <img src={img} alt={`Studio ${i}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {config.testimonials && config.testimonials.length > 1 && (
          <section className="py-32 px-6 bg-zinc-900/20">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black mb-20 text-center italic uppercase tracking-[0.3em] flex items-center justify-center gap-6">
                <div className="h-px bg-zinc-800 flex-1 hidden md:block"></div>
                <Star className="text-amber-500 fill-amber-500" size={20} /> DOJO TALK <Star className="text-amber-500 fill-amber-500" size={20} />
                <div className="h-px bg-zinc-800 flex-1 hidden md:block"></div>
              </h2>
              <div className="grid gap-12">
                {config.testimonials.slice(1).map((t, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-zinc-900/50 p-10 rounded-[40px] border border-white/5 relative group hover:border-amber-500/20 transition-colors"
                  >
                    <p className="text-2xl md:text-3xl italic mb-10 leading-snug font-serif">"{t.text}"</p>
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                        <User size={32} className="text-zinc-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold tracking-tight uppercase">{t.name}</p>
                        <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Campaign Footer Bar */}
      <div className="bg-zinc-950 px-12 py-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] text-zinc-600 gap-4 mt-20 md:mt-0 font-mono">
        <div>Propriedade: {config.academyName} • {config.city}</div>
        <div className="flex gap-6">
          <span className="text-amber-500/50">Campanha: {campaign}</span>
          <span>Tecnologia por <a href="https://github.com/hpgalvao/Gerador-Dojo" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2">Helio P. Galvão</a></span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Sistema de Leads Ativo
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 right-8 z-50 group flex items-center gap-4"
      >
        <span className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 shadow-2xl">
          Falar Agora
        </span>
        <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all ring-4 ring-[#0F0F10]">
          <MessageCircle size={32} className="text-white" />
        </div>
      </a>
      <div className="text-center py-6 bg-black text-[8px] text-zinc-800 uppercase tracking-[0.4em] font-mono border-t border-white/5">
        Built by <a href="https://selectone.com.br" target="_blank" className="hover:text-amber-500 transition-colors">SelectOne</a> & <a href="https://goldenfight.com.br" target="_blank" className="hover:text-amber-500 transition-colors">Golden Fight</a>
      </div>
    </div>
  );
}
