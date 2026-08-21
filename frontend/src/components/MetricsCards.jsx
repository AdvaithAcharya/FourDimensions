import React from 'react';
import { ShieldAlert, DollarSign, Activity, Clock } from 'lucide-react';

export default function MetricsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: "Cost Saved (Pre-Flight)",
      value: stats.total_cost_saved_formatted,
      icon: DollarSign,
      color: "text-cyber-green",
      border: "glow-border-green",
      subtext: "Wallet Protection Active"
    },
    {
      title: "Threats Blocked",
      value: stats.blocked_threat_count,
      icon: ShieldAlert,
      color: "text-threat-red",
      border: "glow-border-red",
      subtext: "Tokens dropped: " + stats.total_tokens_blocked.toLocaleString()
    },
    {
      title: "Legitimate Requests",
      value: stats.total_requests,
      icon: Activity,
      color: "text-blue-400",
      border: "border-blue-500/30",
      subtext: "Tokens served: " + stats.total_tokens_processed.toLocaleString()
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
        <div key={idx} className={`glass-panel p-6 rounded-xl border-l-4 ${card.border} hover:-translate-y-1 transition-transform duration-300`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-2">{card.title}</p>
              <h3 className="font-display font-bold text-3xl tracking-wide">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-black/40 ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs font-mono text-gray-500">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
}
