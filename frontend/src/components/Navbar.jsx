import React, { useEffect, useRef, useState } from 'react';
import { Layers, Zap, Activity, RotateCcw, LogOut, Shield } from 'lucide-react';

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

export default function Navbar({ currency, setCurrency, currentView, setCurrentView, onRefresh, onReset, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const dashBtnRef = useRef(null);
  const auditBtnRef = useRef(null);
  const datasetBtnRef = useRef(null);
  const apiBtnRef = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let target = dashBtnRef.current;
    if (currentView === 'audit') target = auditBtnRef.current;
    if (currentView === 'dataset') target = datasetBtnRef.current;
    if (currentView === 'api') target = apiBtnRef.current;

    if (target && pillRef.current) {
      pillRef.current.style.width = `${target.offsetWidth}px`;
      pillRef.current.style.left = `${target.offsetLeft}px`;
    }
  }, [currentView]);

  const triggerSimulateTraffic = async () => {
    setSimulating(true);
    try {
      await fetch('http://127.0.0.1:8000/api/finops/simulate-traffic?count=5', {
        method: 'POST'
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Traffic simulation error", e);
    } finally {
      setTimeout(() => setSimulating(false), 700);
    }
  };

  const triggerReset = async () => {
    setResetting(true);
    try {
      await fetch('http://127.0.0.1:8000/api/finops/reset', {
        method: 'POST'
      });
      if (onReset) onReset();
      else if (onRefresh) onRefresh();
    } catch (e) {
      console.error("Reset metrics error", e);
    } finally {
      setTimeout(() => setResetting(false), 500);
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
          <Layers className="text-ember w-8 h-8 relative z-10 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
          <div className="absolute inset-0 bg-ember rounded-full blur-lg opacity-40 animate-glow-pulse" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-2xl tracking-[0.02em] leading-none bg-gradient-to-r from-white via-ember to-white bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow">
            KRYPTON <span className="text-white/40">//</span> FINOPS
          </h1>
          <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Attribution Engine Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation Tabs */}
        <div className="relative flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden p-1">
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
            ref={auditBtnRef}
            onClick={() => setCurrentView('audit')}
            className={`relative z-10 px-4 py-1.5 font-mono text-sm transition-colors duration-300 rounded-md ${currentView === 'audit' ? 'text-ember' : 'text-gray-400 hover:text-white'}`}
          >
            Reconciliation Audit
          </button>
          <button
            ref={datasetBtnRef}
            onClick={() => setCurrentView('dataset')}
            className={`relative z-10 px-4 py-1.5 font-mono text-sm transition-colors duration-300 rounded-md ${currentView === 'dataset' ? 'text-ember' : 'text-gray-400 hover:text-white'}`}
          >
            Dataset Ingestion
          </button>
          <button
            ref={apiBtnRef}
            onClick={() => setCurrentView('api')}
            className={`relative z-10 px-4 py-1.5 font-mono text-sm transition-colors duration-300 rounded-md ${currentView === 'api' ? 'text-ember' : 'text-gray-400 hover:text-white'}`}
          >
            API Integration
          </button>
        </div>

        {/* Action Buttons: Reset to 0 & Simulate Traffic */}
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          <button
            onClick={triggerReset}
            disabled={resetting}
            title="Reset all token, spend, and request counts to 0"
            className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 hover:border-red-500/50"
          >
            <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'Resetting...' : 'Reset to 0'}</span>
          </button>



          {/* Simulate Traffic Button */}
          <MagneticButton
            onClick={triggerSimulateTraffic}
            className={`crazy-btn rounded shimmer-btn ${simulating ? 'scale-95' : ''}`}
          >
            <span className="crazy-btn-inner bg-ember/10 border border-ember/30 hover:bg-ember/20 text-ember font-mono text-xs px-3.5 py-1.5 uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className={simulating ? 'animate-spin' : ''} />
              {simulating ? 'Simulating...' : 'Simulate Traffic'}
            </span>
          </MagneticButton>
        </div>

        {/* Currency Selector */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
          {['USD', 'INR', 'EUR', 'GBP'].map(curr => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-3 py-1.5 font-mono text-xs transition-all duration-300 ${currency === curr ? 'bg-ember/20 text-ember border-b-2 border-ember shadow-[inset_0_0_10px_rgba(232,96,46,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Admin Session Badge & Sign Out Button */}
        {onLogout && (
          <button
            id="admin-logout-btn"
            onClick={onLogout}
            title="Sign out of Admin Session"
            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/50 hover:bg-red-500/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 font-mono text-xs flex items-center gap-1.5 transition-all duration-200 group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-semibold text-gray-200">admin</span>
            <LogOut size={13} className="text-gray-400 group-hover:text-red-400 transition-colors ml-0.5" />
          </button>
        )}

        <div className="hidden 2xl:flex items-center gap-1.5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Activity size={12} className="text-ember animate-pulse" />
          Live
        </div>
      </div>
    </nav>
  );
}
