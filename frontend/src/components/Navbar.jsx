import React, { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Activity } from 'lucide-react';

function MagneticButton({ children, className = '', onClick, ...rest }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0px, 0px)';
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={`magnetic-btn ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default function Navbar({ currency, setCurrency, currentView, setCurrentView }) {
  const [scrolled, setScrolled] = useState(false);
  const [pulse, setPulse] = useState(false);
  const dashBtnRef = useRef(null);
  const apiBtnRef = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const target = currentView === 'dashboard' ? dashBtnRef.current : apiBtnRef.current;
    if (target && pillRef.current) {
      pillRef.current.style.width = `${target.offsetWidth}px`;
      pillRef.current.style.left = `${target.offsetLeft}px`;
    }
  }, [currentView]);

  const triggerAttack = async () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 900);
    try {
      await fetch('http://127.0.0.1:8000/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "INSTRUCTION: Explain quantum mechanics. " + ("repeat token burn payload " * 5000) }],
          max_tokens: 4000,
          user_id: "attacker_bot_01"
        })
      });
    } catch (e) {
      console.error("Attack simulation error", e);
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'backdrop-blur-xl bg-black/80 border-b border-ember/20 shadow-[0_0_30px_rgba(232,96,46,0.08)]'
          : 'backdrop-blur-md bg-black/40 border-b border-white/5'
      }`}
    >
      {/* animated gradient hairline under navbar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent animate-gradient-flow" />

      <div className="flex items-center gap-4 group">
        <div className="relative">
          <Shield className="text-ember w-8 h-8 relative z-10 transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110" />
          <div className="absolute inset-0 bg-ember rounded-full blur-lg opacity-40 animate-glow-pulse" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-2xl tracking-[0.02em] leading-none bg-gradient-to-r from-white via-ember to-white bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow">
            KRYPTON <span className="text-white/40">//</span> GATEWAY
          </h1>
          <span className="text-ember text-xs font-mono uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ember opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ember"></span>
            </span>
            System: Protected
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden mr-4 p-1">
          <div
            ref={pillRef}
            className="nav-pill absolute top-1 bottom-1 rounded-md bg-gradient-to-r from-ember/30 to-ember-deep/40 border border-ember/50 shadow-[0_0_12px_rgba(232,96,46,0.35)]"
          />
          <button
            ref={dashBtnRef}
            onClick={() => setCurrentView('dashboard')}
            className={`relative z-10 px-4 py-1.5 font-mono text-sm transition-colors duration-300 rounded-md ${currentView === 'dashboard' ? 'text-ember' : 'text-gray-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            ref={apiBtnRef}
            onClick={() => setCurrentView('api')}
            className={`relative z-10 px-4 py-1.5 font-mono text-sm transition-colors duration-300 rounded-md ${currentView === 'api' ? 'text-ember' : 'text-gray-400 hover:text-white'}`}
          >
            API Access
          </button>
        </div>

        <MagneticButton
          onClick={triggerAttack}
          className={`crazy-btn rounded shimmer-btn ${pulse ? 'scale-95' : ''}`}
        >
          <span className="crazy-btn-inner bg-threat-red/10 border border-threat-red/30 hover:bg-threat-red/20 text-threat-red font-mono text-xs px-4 py-2 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className={pulse ? 'animate-spin' : ''} /> Simulate Attack
          </span>
        </MagneticButton>

        <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
          {['USD', 'INR', 'EUR'].map(curr => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-3 py-1.5 font-mono text-xs transition-all duration-300 ${currency === curr ? 'bg-ember/20 text-ember border-b-2 border-ember shadow-[inset_0_0_10px_rgba(232,96,46,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {curr}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Activity size={12} className="text-ember animate-pulse" />
          Live
        </div>
      </div>
    </nav>
  );
}
