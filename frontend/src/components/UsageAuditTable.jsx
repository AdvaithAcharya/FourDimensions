import React, { useState } from 'react';
import { Search, Database } from 'lucide-react';

export default function UsageAuditTable({ logs = [] }) {
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

  return (
    <div className="glass-panel rounded-xl overflow-hidden mt-10 border border-white/10">
      <div className="p-5 border-b border-white/10 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-xl tracking-wide flex items-center gap-2">
            <Database size={20} className="text-ember" />
            Immutable FinOps Request Audit Ledger
          </h3>
          <p className="text-gray-400 font-mono text-xs mt-0.5">
            Every inbound API call logged with attribution metadata and exact decimal cost
          </p>
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
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                    {log.timestamp?.split(' ')[1] || '00:00:00'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-ember/15 border border-ember/30 text-ember font-semibold">
                      {log.team}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-300">{log.feature}</td>
                  <td className="px-5 py-3 text-gray-400">{log.user}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      {log.model}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                    <span className="text-gray-300">{log.prompt_tokens}</span> in /{' '}
                    <span className="text-gray-300">{log.completion_tokens}</span> out
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-ember" title={`Exact: $${log.total_cost_usd_exact || log.total_cost_usd}`}>
                    {log.total_cost_display || `$${log.total_cost_usd?.toFixed(4)}`}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 whitespace-nowrap">
                    {log.latency_ms} ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
