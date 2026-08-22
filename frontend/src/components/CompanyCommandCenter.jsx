import React, { useState, useEffect } from 'react';
import { Building2, Users, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

export default function CompanyCommandCenter({ currency = 'USD' }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/company/analytics?currency=${currency}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch company analytics", e);
      }
    };
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 1000);
    return () => clearInterval(interval);
  }, [currency]);

  if (!data) return null;

  return (
    <div className="mt-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-wide flex items-center gap-3">
            <Building2 className="text-ember" />
            COMPANY COMMAND CENTER
          </h3>
          <p className="text-gray-400 font-mono text-xs mt-1">Aggregated global metrics and per-tenant budget enforcement</p>
        </div>
      </div>

      {/* Top Section: Company Aggregated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-ember/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Total Org Savings</p>
          <div className="flex items-end gap-2">
            <h4 className="font-display text-2xl font-bold text-white">{data.company_total_saved_formatted}</h4>
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Company Token Burn</p>
          <h4 className="font-display text-2xl font-bold text-white">{(data.company_total_tokens_processed || 0).toLocaleString()}</h4>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Active Tenants</p>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl font-bold text-white">{data.active_tenants}</h4>
            <Users size={14} className="text-green-400" />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group border-b-2 border-b-threat-red">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/20 blur-xl rounded-full animate-pulse" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Locked Tenants</p>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl font-bold text-threat-red">{data.blocked_tenants}</h4>
            <AlertTriangle size={14} className="text-threat-red" />
          </div>
        </div>
      </div>
    </div>
  );
}
