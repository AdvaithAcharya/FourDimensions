import React, { useState } from 'react';
import { Search, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function UsageAuditTable({ logs = [], summary = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedModel, setSelectedModel] = useState('ALL');

  const teams = ['ALL', ...Array.from(new Set(logs.map(l => l.team).filter(Boolean)))];
  const models = ['ALL', ...Array.from(new Set(logs.map(l => l.model).filter(Boolean)))];

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      searchTerm === '' ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.feature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTeam = selectedTeam === 'ALL' || log.team === selectedTeam;
    const matchModel = selectedModel === 'ALL' || log.model === selectedModel;

    return matchSearch && matchTeam && matchModel;
  });

  const estimatedCostPct = summary?.estimated_cost_pct ?? 0;
  const unattributedCostUsd = summary?.unattributed_cost_usd ?? 0;
  const unattributedCostPct = summary?.unattributed_cost_pct ?? 0;

  return (
    <div className="glass-panel rounded-xl overflow-hidden mt-10 border border-white/10">
      <div className="p-5 border-b border-white/10 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-xl tracking-wide flex items-center gap-2">
              <Database size={20} className="text-ember" />
              Immutable FinOps Request Audit Ledger
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-gray-400">
              {logs.length} Records
            </span>
          </div>
          <p className="text-gray-400 font-mono text-xs mt-0.5">
            Every inbound API call logged with attribution metadata, token provenance, and exact decimal cost
          </p>

          {/* FinOps Compliance & Estimation KPI Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-3 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              KPI: <strong>{Number(estimatedCostPct).toFixed(1)}% of cost based on estimated tokens</strong>
            </span>

            {unattributedCostUsd > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-300">
                <AlertTriangle size={12} className="text-red-400" />
                Unattributed Spend: <strong>${Number(unattributedCostUsd).toFixed(4)} ({unattributedCostPct}%)</strong>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <ShieldCheck size={12} className="text-emerald-400" />
                Unattributed Spend: <strong>$0.00 (0.0%)</strong>
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter user or feature..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-ember/50 w-44"
            />
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-300 focus:outline-none focus:border-ember/50"
          >
            {teams.map(t => (
              <option key={t} value={t} className="bg-neutral-900 text-white">
                Team: {t}
              </option>
            ))}
          </select>

          {/* Model Filter */}
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-300 focus:outline-none focus:border-ember/50"
          >
            {models.map(m => (
              <option key={m} value={m} className="bg-neutral-900 text-white">
                Model: {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-black/40 text-gray-400 uppercase sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Team</th>
              <th className="px-5 py-3.5">Feature</th>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Model</th>
              <th className="px-5 py-3.5">Tokens (In / Out)</th>
              <th className="px-5 py-3.5 text-right">Attributed Cost</th>
              <th className="px-5 py-3.5 text-right">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                  No records matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const isUnattributed = log.team === 'Unattributed' || log.attribution_status === 'unattributed';
                const isPartial = log.attribution_status === 'partial';
                const isEstimated = log.token_source === 'estimated';
                const isUnpriced = log.cost_status === 'unpriced_model';

                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                      {log.timestamp?.split(' ')[1] || '00:00:00'}
                    </td>
                    <td className="px-5 py-3">
                      {isUnattributed ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold inline-flex items-center gap-1" title="Untagged request">
                          Unattributed
                        </span>
                      ) : isPartial ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold" title="Partial attribution">
                          {log.team}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-ember/15 border border-ember/30 text-ember font-semibold" title="Complete attribution">
                          {log.team}
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3 ${log.feature === 'Unattributed' ? 'text-gray-500 italic' : 'text-gray-300'}`}>
                      {log.feature}
                    </td>
                    <td className={`px-5 py-3 ${log.user === 'Unattributed' ? 'text-gray-500 italic' : 'text-gray-400'}`}>
                      {log.user}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 inline-flex items-center gap-1">
                        {log.model}
                      </span>
                      {isUnpriced && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 font-bold" title="Model unpriced in catalog - charged at $0.00">
                          UNPRICED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                      <span className="text-gray-300">{log.prompt_tokens}</span> in /{' '}
                      <span className="text-gray-300">{log.completion_tokens}</span> out
                      {isEstimated ? (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono" title="Tokens estimated from character heuristics or tokenizer">
                          estimated
                        </span>
                      ) : (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono" title="Reported directly by upstream provider">
                          reported
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-ember" title={`Exact: $${log.total_cost_usd_exact || log.total_cost_usd}`}>
                      {log.total_cost_display || `$${log.total_cost_usd?.toFixed(4)}`}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 whitespace-nowrap">
                      {log.latency_ms} ms
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
