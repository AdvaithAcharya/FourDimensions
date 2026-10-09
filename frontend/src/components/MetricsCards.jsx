import React, { useRef } from 'react';
import { DollarSign, Flame, Clock, Users } from 'lucide-react';

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

export default function MetricsCards({ summary }) {
  if (!summary) return null;

  const totalRequests = summary.total_requests || 0;
  const isZero = totalRequests === 0;

  const cards = [
    {
      title: "Total LLM Spend",
      value: summary.total_cost_formatted || "$0.00",
      icon: DollarSign,
      color: "text-ember",
      border: "glow-border-ember",
      subtext: isZero
        ? "0 requests logged · Zero Baseline"
        : `Avg ${summary.avg_cost_per_request || '$0.00'}/req · Decimal Verified`
    },
    {
      title: "Total Tokens Processed",
      value: (summary.total_tokens || 0).toLocaleString(),
      icon: Flame,
      color: "text-amber-400",
      border: "border-amber-500/30",
      subtext: `${(summary.total_prompt_tokens || 0).toLocaleString()} in / ${(summary.total_completion_tokens || 0).toLocaleString()} out`
    },
    {
      title: "Top Cost Driver",
      value: isZero ? "None (0 active)" : (summary.top_team && summary.top_team !== "N/A" ? summary.top_team : "None"),
      icon: Users,
      color: "text-blue-400",
      border: "border-blue-500/30",
      subtext: isZero ? "0 requests logged · 0 active teams" : `Feature: ${summary.top_feature || 'General'}`
    },
    {
      title: "Mean Gateway Latency",
      value: isZero ? "0 ms" : `${summary.avg_latency_ms || 0} ms`,
      icon: Clock,
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      subtext: isZero ? "0 active models · Gateway Idle" : `Model Lead: ${summary.top_model || 'gpt-4o'}`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <TiltCard key={idx} className={`glass-panel p-6 rounded-xl border-l-4 ${card.border} group relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-current opacity-[0.04] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500" style={{ color: card.color.includes('ember') ? '#e8602e' : card.color.includes('amber') ? '#f59e0b' : card.color.includes('blue') ? '#60a5fa' : '#34d399' }} />
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
