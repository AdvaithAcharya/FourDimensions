import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Users, Layers } from 'lucide-react';

export default function CompanyCommandCenter({ currency = 'USD', refreshSignal = 0 }) {
  const [data, setData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/company/analytics?currency=${currency}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch company analytics", e);
    }
  }, [currency]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 2000);
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshSignal]);

  if (!data) return null;

  const isZero = (data.active_tenants || 0) === 0 || (data.company_total_tokens_processed || 0) === 0;

  return (
    <div className="mt-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-wide flex items-center gap-3">
            <Building2 className="text-ember" />
            ENTERPRISE TEAM CHARGEBACK & SHOWBACK
          </h3>
          <p className="text-gray-400 font-mono text-xs mt-1">
            Department-level spend attribution, token consumption, and budget share allocation
          </p>
        </div>
      </div>

      {/* Top Section: Company Aggregated Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-ember/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Global Org Spend</p>
          <h4 className="font-display text-2xl font-bold text-white">{data.company_total_saved_formatted || "$0.00"}</h4>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Total Token Volume</p>
          <h4 className="font-display text-2xl font-bold text-white">{(data.company_total_tokens_processed || 0).toLocaleString()}</h4>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Active Cost Centers</p>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl font-bold text-white">{data.active_tenants || 0}</h4>
            <Users size={14} className="text-emerald-400" />
          </div>
        </div>
        
        <div className="glass-panel p-4 rounded-xl border border-white/5 bg-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 blur-xl rounded-full" />
          <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest mb-1">Attribution Confidence</p>
          <div className="flex items-center gap-2">
            <h4 className="font-display text-2xl font-bold text-purple-400">
              {data.attribution_confidence_pct != null ? `${Number(data.attribution_confidence_pct).toFixed(1)}%` : '0.0%'}
            </h4>
            <span className="text-[10px] font-mono text-gray-500">
              {data.unattributed_cost_usd > 0
                ? `${data.unattributed_cost_pct}% Unattributed`
                : (isZero ? '0 records' : 'Complete 3-Dim')}
            </span>
          </div>
        </div>
      </div>

      {/* Team Breakdown Table with Budget Progress Bar */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 bg-black/40">
          <h4 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Layers size={16} className="text-ember" />
            Department Allocation Table
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-black/30 text-gray-400 uppercase border-b border-white/5">
              <tr>
                <th className="px-5 py-3.5">Department / Team</th>
                <th className="px-5 py-3.5">Requests</th>
                <th className="px-5 py-3.5">Tokens Incurred</th>
                <th className="px-5 py-3.5">Total Attributed Cost</th>
                <th className="px-5 py-3.5 w-64">Spend Distribution Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(data.tenants || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500 font-mono text-xs">
                    Ledger reset to $0.00 baseline. Click "Simulate Traffic" or send an inbound API call to attribute spend.
                  </td>
                </tr>
              ) : (
                (data.tenants || []).map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-ember" />
                      {t.key}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{t.request_count}</td>
                    <td className="px-5 py-3.5 text-gray-300">{(t.total_tokens || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-bold text-ember">{t.total_cost_formatted}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
                          <div
                            className="bg-gradient-to-r from-ember to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, t.percentage))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-gray-400 w-12 text-right">
                          {t.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
