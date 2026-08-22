import React, { useRef } from 'react';
import { ShieldAlert, DollarSign, Activity, Clock } from 'lucide-react';

function TiltCard({ children, className = '' }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px) scale(1.02)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}

export default function MetricsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: "Cost Saved (Pre-Flight)",
      value: stats.total_cost_saved_formatted,
      icon: DollarSign,
      color: "text-ember",
      border: "glow-border-ember",
      subtext: "Wallet Protection Active"
    },
    {
      title: "Threats Blocked",
      value: stats.blocked_threat_count,
      icon: ShieldAlert,
      color: "text-threat-red",
      border: "glow-border-red",
      subtext: "Tokens dropped: " + (stats.total_tokens_blocked || 0).toLocaleString()
    },
    {
      title: "Legitimate Requests",
      value: stats.total_requests,
      icon: Activity,
      color: "text-blue-400",
      border: "border-blue-500/30",
      subtext: "Tokens served: " + (stats.total_tokens_processed || 0).toLocaleString()
    },
    {
      title: "Avg Gate Latency",
      value: stats.avg_latency_ms + " ms",
      icon: Clock,
      color: "text-purple-400",
      border: "border-purple-500/30",
      subtext: "tiktoken ultra-fast check"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <TiltCard key={idx} className={`glass-panel p-6 rounded-xl border-l-4 ${card.border} group relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-current opacity-[0.04] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500" style={{ color: card.color.includes('ember') ? '#e8602e' : card.color.includes('red') ? '#f43f5e' : card.color.includes('blue') ? '#60a5fa' : '#a78bfa' }} />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-2">{card.title}</p>
              <h3 className="font-display font-bold text-3xl tracking-wide">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-black/40 ${card.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
              <card.icon size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs font-mono text-gray-500 relative z-10">{card.subtext}</p>
        </TiltCard>
      ))}
    </div>
  );
}
