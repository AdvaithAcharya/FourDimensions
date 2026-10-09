import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MetricsCards from './components/MetricsCards';
import Integration from './components/Integration';
import FinOpsChartsGrid from './components/FinOpsChartsGrid';
import CompanyCommandCenter from './components/CompanyCommandCenter';
import UsageAuditTable from './components/UsageAuditTable';
import ValidationModal from './components/ValidationModal';
import DatasetUploadView from './components/DatasetUploadView';
import ParticleField from './components/ParticleField';
import CursorGlow from './components/CursorGlow';
import { ShieldCheck, Sparkles } from 'lucide-react';

const TICKER_ITEMS = [
  'COMMVAULT CHALLENGE PS-404',
  'MONGODB ATLAS CLOUD PERSISTENCE ACTIVE (CLUSTER1)',
  'MULTI-TENANT ATTRIBUTION ENGINE',
  'EXACT DECIMAL FIXED-POINT ACCOUNTING',
  'ZERO FLOATING-POINT DRIFT (Δ = 0.00000000)',
  'MULTI-CURRENCY GLOBAL SHOWBACK',
  'SIMULATED PROVIDER INTERFACE',
  'HIGH-FIDELITY USAGE OBSERVABILITY',
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
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshSignal, setRefreshSignal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, logsRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/finops/summary?currency=${currency}`),
        fetch(`http://127.0.0.1:8000/api/finops/logs?limit=50&currency=${currency}`)
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (e) {
      console.error("FinOps dashboard fetch error:", e);
    }
  }, [currency]);

  const handleReset = useCallback(async () => {
    const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥';
    // Instantly zero out all counts and metrics for instant feedback
    setSummary({
      total_cost_usd: 0.0,
      total_cost_formatted: `${symbol}0.00`,
      total_requests: 0,
      total_tokens: 0,
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      avg_latency_ms: 0.0,
      avg_cost_per_request: `${symbol}0.00`,
      top_team: "None",
      top_feature: "None",
      top_model: "None",
      selected_currency: currency,
      currency_symbol: symbol
    });
    setLogs([]);
    setRefreshSignal(prev => prev + 1);

    await fetchData();
  }, [currency, fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1500);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-amoled-black text-white selection:bg-ember/30 relative">
      {/* Background Ambient Effects */}
      <ParticleField />
      <CursorGlow />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-ember/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0" />

      <Navbar
        currency={currency}
        setCurrency={setCurrency}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onRefresh={fetchData}
        onReset={handleReset}
      />

      <main className="relative z-10">
        <Ticker />

        <div className="container mx-auto px-6 pb-12">
          <div className="text-center mb-16 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-ember/30 bg-ember/5 text-ember font-mono text-xs uppercase tracking-widest mb-6 animate-float">
              <Sparkles size={13} className="animate-glow-pulse" />
              Commvault Challenge PS-404 · Enterprise LLM FinOps
            </div>

            <h2
              data-text="LLM FINOPS OBSERVABILITY & ATTRIBUTION"
              className="glitch-text font-display font-bold text-4xl md:text-6xl tracking-[0.03em] mb-6 leading-[1.08] bg-gradient-to-r from-white via-ember to-white bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-flow"
            >
              LLM FINOPS OBSERVABILITY & ATTRIBUTION
            </h2>

            <p className="text-gray-400 font-mono text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
              Real-time token cost estimation, multi-tenant chargeback attribution across Team, Feature, and Model,
              backed by an exact Decimal accounting ledger with 100% verified mathematical reconciliation.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-ember font-mono text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={14} className="animate-glow-pulse" />
                Simulated Provider Interface Ready
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                MongoDB Atlas Connected (Cluster1)
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-400">
                Tiktoken Tokenizer Active
              </span>
              <span className="text-gray-600">·</span>
              <span className="text-ember">
                Multi-Currency Active ({currency})
              </span>
            </div>
          </div>

          {currentView === 'dashboard' && (
            <>
              <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
                <MetricsCards summary={summary} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
                <CompanyCommandCenter currency={currency} refreshSignal={refreshSignal} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
                <FinOpsChartsGrid currency={currency} refreshSignal={refreshSignal} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                <UsageAuditTable logs={logs} />
              </div>
            </>
          )}

          {currentView === 'audit' && (
            <div className="animate-fade-up">
              <ValidationModal currency={currency} />
            </div>
          )}

          {currentView === 'dataset' && (
            <div className="animate-fade-up">
              <DatasetUploadView currency={currency} onCommitSuccess={fetchData} refreshSignal={refreshSignal} />
            </div>
          )}

          {currentView === 'api' && (
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
