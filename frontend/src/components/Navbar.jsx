import React from 'react';
import { Shield, Zap, Server, Activity } from 'lucide-react';

export default function Navbar({ currency, setCurrency, currentView, setCurrentView }) {
  const triggerAttack = async () => {
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
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between border-b-0 border-white/10">
      <div className="flex items-center gap-4">
        <Shield className="text-cyber-green w-8 h-8" />
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-2xl tracking-[0.02em] leading-none">KRYPTON // GATEWAY</h1>
          <span className="text-cyber-green text-xs font-mono uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></span>
            System: Protected
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden mr-4">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${currentView === 'dashboard' ? 'bg-cyber-green/20 text-cyber-green border-b-2 border-cyber-green' : 'text-gray-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentView('api')}
            className={`px-4 py-2 font-mono text-sm transition-colors ${currentView === 'api' ? 'bg-cyber-green/20 text-cyber-green border-b-2 border-cyber-green' : 'text-gray-400 hover:text-white'}`}
          >
            API Access
          </button>
        </div>
        
        <button 
          onClick={triggerAttack}
          className="bg-threat-red/10 border border-threat-red/30 hover:bg-threat-red/20 text-threat-red font-mono text-xs px-4 py-2 rounded uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <Zap size={14} /> Simulate Attack
        </button>
        
        <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
          {['USD', 'INR', 'EUR'].map(curr => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-3 py-1.5 font-mono text-xs transition-colors ${currency === curr ? 'bg-cyber-green/20 text-cyber-green border-b-2 border-cyber-green' : 'text-gray-400 hover:text-white'}`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
