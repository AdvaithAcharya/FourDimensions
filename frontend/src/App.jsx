import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import Integration from './components/Integration';
import MediaChartsGrid from './components/MediaChartsGrid';

function App() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [currentView, setCurrentView] = useState('dashboard');

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
    <div className="min-h-screen bg-amoled-black text-white selection:bg-cyber-green/30 relative">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyber-green/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

      <Navbar currency={currency} setCurrency={setCurrency} currentView={currentView} setCurrentView={setCurrentView} />

      <main className="container mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-5xl md:text-7xl tracking-[0.03em] mb-6">
            ACTIVE-DEFENSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-green to-emerald-300">AI GATEWAY</span>
          </h2>
          <p className="text-gray-400 font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Mitigating OWASP LLM10 Unbounded Consumption and Denial-of-Wallet attacks in real-time. 
            Intercepting malicious token-burn payloads before they reach commercial LLMs.
          </p>
        </div>

        {currentView === 'dashboard' ? (
          <>
            <MetricsCards stats={stats} />
            <MediaChartsGrid stats={stats} />
          </>
        ) : (
          <Integration />
        )}
      </main>
    </div>
  );
}

export default App;
