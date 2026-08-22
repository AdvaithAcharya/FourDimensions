import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import Integration from './components/Integration';
import MediaChartsGrid from './components/MediaChartsGrid';
import CompanyCommandCenter from './components/CompanyCommandCenter';
import ThreatTable from './components/ThreatTable';
import ParticleField from './components/ParticleField';
import CursorGlow from './components/CursorGlow';
import IntroSequence from './components/IntroSequence';
import { ShieldCheck, Sparkles } from 'lucide-react';

const TICKER_ITEMS = [
  'OWASP LLM10 // UNBOUNDED CONSUMPTION',
  'ZERO-LATENCY HEURISTICS',
  'DENIAL-OF-WALLET PROTECTION',
  'PRE-FLIGHT TOKEN INTERCEPTION',
  'REAL-TIME THREAT TELEMETRY',
  'MULTIMODAL PAYLOAD INSPECTION',
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-black/50 backdrop-blur-sm py-2.5 mb-14">
      <div className="flex whitespace-nowrap animate-marquee w-max">
        {items.map((item, i) => (
          <span key={i} className="mx-6 font-mono text-xs tracking-widest text-gray-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ember animate-ticker-blink" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [currentView, setCurrentView] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(true);

  const fetchData = async () => {
    try {
      const statsRes = await fetch(`http://127.0.0.1:8000/api/dashboard/stats?currency=${currency}`);
      const statsData = await statsRes.json();
      setStats(statsData);

      const logsRes = await fetch(`http://127.0.0.1:8000/api/dashboard/logs?limit=20&currency=${currency}`);
      const logsData = await logsRes.json();
      setLogs(logsData);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [currency]);

  return (
    <div className="min-h-screen bg-amoled-black text-white selection:bg-ember/30 relative">
      {showIntro && <IntroSequence onComplete={() => setShowIntro(false)} />}

      {/* Background Ambient Effects */}
      <ParticleField />
      <CursorGlow />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-ember/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0" />

      <Navbar currency={currency} setCurrency={setCurrency} currentView={currentView} setCurrentView={setCurrentView} />

      <main className="relative z-10">
        <Ticker />

        <div className="container mx-auto px-6 pb-12">
          <div className="text-center mb-16 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ember/30 bg-ember/5 text-ember font-mono text-xs uppercase tracking-widest mb-6 animate-float">
              <Sparkles size={13} className="animate-glow-pulse" />
              Live Active-Defense Engine
            </div>

            <h2
              data-text="ACTIVE-DEFENSE AI GATEWAY"
              className="glitch-text font-display font-bold text-5xl md:text-7xl tracking-[0.03em] mb-6 leading-[1.05] bg-gradient-to-r from-white via-ember to-white bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow"
            >
              ACTIVE-DEFENSE AI GATEWAY
            </h2>

            <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Mitigating OWASP LLM10 Unbounded Consumption and Denial-of-Wallet attacks in real-time.
              Intercepting malicious token-burn payloads before they reach commercial LLMs.
            </p>

            <div className="flex items-center justify-center gap-2 mt-6 text-ember font-mono text-xs">
              <ShieldCheck size={14} className="animate-glow-pulse" />
              <span>Gateway online · Encrypted proxy layer active</span>
            </div>
          </div>

          {currentView === 'dashboard' ? (
            <>
              <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
                <MetricsCards stats={stats} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
                <CompanyCommandCenter currency={currency} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
                <MediaChartsGrid stats={stats} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
                <ThreatTable logs={logs} />
              </div>
            </>
          ) : (
            <div className="animate-fade-up">
              <Integration />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
