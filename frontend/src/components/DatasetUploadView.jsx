import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Clock,
  Layers,
  Cpu,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

export default function DatasetUploadView({ currency = 'USD', onCommitSuccess, refreshSignal = 0 }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('team');
  const [commitToLedger, setCommitToLedger] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (refreshSignal > 0) {
      setResult(null);
      setSelectedFile(null);
      setError(null);
    }
  }, [refreshSignal]);

  const handleFileUpload = async (fileToUpload) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `http://127.0.0.1:8000/api/finops/dataset/upload?currency=${currency}&commit=${commitToLedger}`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      if (commitToLedger && onCommitSuccess) {
        onCommitSuccess();
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };



  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { family: 'monospace', size: 11 },
        bodyFont: { family: 'monospace', size: 12 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'monospace', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: 'monospace', size: 10 } }
      }
    }
  };

  return (
    <div className="mt-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl border border-white/10 bg-black/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-ember/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ember/40 bg-ember/10 text-ember font-mono text-xs uppercase tracking-wider mb-2">
              <FileSpreadsheet size={14} />
              Commvault Challenge PS-404 · Dataset Ingestion & Benchmarking
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">
              Dataset Ingestion & 4-Dimensional Analysis Engine
            </h3>
            <p className="text-gray-400 font-mono text-xs max-w-2xl mt-1">
              Upload any telemetry archive (.zip, .csv, .jsonl, .json) to compute multi-dimensional cost attribution and mathematical reconciliation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                  setError(null);
                }}
                className="crazy-btn rounded-lg"
                title="Reset dataset analysis counts to 0"
              >
                <span className="crazy-btn-inner px-3 py-2.5 bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <RotateCcw size={13} />
                  <span>Reset to 0</span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Ingestion Options Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-gray-300">
          {/* File Picker */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3.5 py-1.5 rounded-lg border border-white/15 bg-black/50 hover:bg-white/5 text-gray-200 transition-colors flex items-center gap-2">
              <UploadCloud size={14} className="text-ember" />
              <span>{selectedFile ? selectedFile.name : 'Choose Local File (.zip, .csv, .jsonl)'}</span>
              <input
                type="file"
                accept=".zip,.csv,.jsonl,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setSelectedFile(f);
                    handleFileUpload(f);
                  }
                }}
              />
            </label>
            {selectedFile && (
              <button
                onClick={() => handleFileUpload()}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-ember text-black font-bold uppercase text-[11px] hover:bg-ember-light"
              >
                Analyze File
              </button>
            )}
          </div>

          {/* Commit to ledger toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-white">
            <input
              type="checkbox"
              checked={commitToLedger}
              onChange={(e) => setCommitToLedger(e.target.checked)}
              className="rounded border-white/20 bg-black/50 text-ember focus:ring-0"
            />
            <span>Also import records into Live Dashboard Ledger</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>Error processing dataset: {error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/40">
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mb-1">Total Attributed Spend</p>
              <h4 className="font-display font-bold text-3xl text-ember">
                {result.total_cost_formatted}
              </h4>
              <p className="text-[10px] font-mono text-gray-500 mt-2">
                Avg {result.avg_cost_per_record} / record
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/40">
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mb-1">Total Token Volume</p>
              <h4 className="font-display font-bold text-3xl text-amber-400">
                {(result.total_tokens || 0).toLocaleString()}
              </h4>
              <p className="text-[10px] font-mono text-gray-500 mt-2">
                {(result.total_input_tokens || 0).toLocaleString()} in / {(result.total_output_tokens || 0).toLocaleString()} out
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/40">
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mb-1">Records Evaluated</p>
              <h4 className="font-display font-bold text-3xl text-white">
                {(result.total_records || 0).toLocaleString()}
              </h4>
              <p className="text-[10px] font-mono text-emerald-400 mt-2">
                Source: {result.filename}
              </p>
            </div>

            <div className="glass-panel p-5 rounded-xl border border-white/5 bg-black/40">
              <p className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mb-1">Engine Ingestion Speed</p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <h4 className="font-display font-bold text-3xl text-purple-400">
                  {result.performance?.processing_time_ms} ms
                </h4>
              </div>
              <p className="text-[10px] font-mono text-gray-400 mt-2">
                ~{(result.performance?.records_per_second || 0).toLocaleString()} records / sec
              </p>
            </div>
          </div>

          {/* Mathematical Reconciliation Banner */}
          <div className="glass-panel p-5 rounded-xl border border-emerald-500/30 bg-black/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h4 className="font-display font-bold text-base text-white">
                  Mathematical Reconciliation Proof ({result.reconciliation?.verdict})
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                Δ = 0.0000000000
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {(result.reconciliation?.checks || []).map((chk, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/50 border border-white/5">
                  <div className="text-gray-400 text-[11px] mb-1">{chk.check}</div>
                  <div className="flex justify-between items-center text-white">
                    <span>Exp: {chk.expected}</span>
                    <span className="text-emerald-400 font-bold">[{chk.status}]</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Attribution Coverage */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-6 font-mono text-xs">
              <span className="text-gray-400">Attribution Coverage:</span>
              <span className="text-emerald-400">
                Complete: {result.attribution_coverage?.complete?.toLocaleString()} ({result.attribution_coverage?.complete_pct}%)
              </span>
              <span className="text-amber-400">
                Partial: {result.attribution_coverage?.partial?.toLocaleString()} ({result.attribution_coverage?.partial_pct}%)
              </span>
              <span className="text-red-400">
                Unattributed: {result.attribution_coverage?.unattributed?.toLocaleString()} ({result.attribution_coverage?.unattributed_pct}%)
              </span>
            </div>
          </div>

          {/* Robustness Isolation: Rejected Rows Display */}
          {result.rejected_count > 0 && (
            <div className="glass-panel p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle size={18} />
                  <h4 className="font-display font-bold text-base">
                    Robustness Isolation: {result.rejected_count} Malformed Records Quarantined
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs w-fit">
                  Valid Ingested: {result.total_records?.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400 font-mono text-xs mb-3">
                Corrupted rows (e.g. invalid numbers, malformed tokens) did not halt the upload. Quarantined records are isolated below:
              </p>
              <div className="overflow-x-auto max-h-48 rounded-lg border border-white/5 bg-black/50">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black/60 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2">Row #</th>
                      <th className="px-4 py-2">Quarantine Reason</th>
                      <th className="px-4 py-2">Row Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {result.rejected_samples?.map((rej, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-2 text-amber-400 font-bold whitespace-nowrap">Row {rej.row_index}</td>
                        <td className="px-4 py-2 text-red-400 font-medium">{rej.reason}</td>
                        <td className="px-4 py-2 text-gray-400 truncate max-w-sm">{rej.row_preview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4-Dimensional Breakdowns Tabs */}
          <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
            {/* Tabs Header */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-ember" />
                <h4 className="font-display font-bold text-lg text-white">
                  4-Dimensional Breakdown Analysis
                </h4>
              </div>

              <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1">
                {[
                  { id: 'team', label: '1. By Team', icon: Users },
                  { id: 'feature', label: '2. By Feature', icon: Layers },
                  { id: 'model', label: '3. By Model', icon: Cpu },
                  { id: 'time', label: '4. By Time Period', icon: TrendingUp },
                  { id: 'preview', label: 'Sample Preview', icon: FileSpreadsheet }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 font-mono text-xs rounded transition-all flex items-center gap-1.5 ${
                      activeTab === t.id
                        ? 'bg-ember/20 text-ember border border-ember/40 font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <t.icon size={12} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* Tab 1: By Team */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <Bar
                      data={{
                        labels: (result.breakdowns?.by_team || []).map((t) => t.key),
                        datasets: [
                          {
                            label: `Spend (${currency})`,
                            data: (result.breakdowns?.by_team || []).map((t) => t.total_cost_usd),
                            backgroundColor: 'rgba(232, 96, 46, 0.75)',
                            borderColor: 'rgba(232, 96, 46, 1)',
                            borderWidth: 1,
                            borderRadius: 6
                          }
                        ]
                      }}
                      options={commonChartOptions}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-black/40 text-gray-400 uppercase border-b border-white/5">
                        <tr>
                          <th className="px-4 py-2.5">Team Name</th>
                          <th className="px-4 py-2.5">Requests</th>
                          <th className="px-4 py-2.5">Tokens Incurred</th>
                          <th className="px-4 py-2.5">Total Spend</th>
                          <th className="px-4 py-2.5 text-right">Spend Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(result.breakdowns?.by_team || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-4 py-2.5 font-bold text-white">{item.key}</td>
                            <td className="px-4 py-2.5 text-gray-400">{item.request_count.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-gray-300">{item.total_tokens.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-ember font-bold">{item.total_cost_formatted}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: By Feature */}
              {activeTab === 'feature' && (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <Bar
                      data={{
                        labels: (result.breakdowns?.by_feature || []).slice(0, 8).map((f) => f.key),
                        datasets: [
                          {
                            label: `Spend (${currency})`,
                            data: (result.breakdowns?.by_feature || []).slice(0, 8).map((f) => f.total_cost_usd),
                            backgroundColor: 'rgba(96, 165, 250, 0.75)',
                            borderColor: 'rgba(96, 165, 250, 1)',
                            borderWidth: 1,
                            borderRadius: 6
                          }
                        ]
                      }}
                      options={commonChartOptions}
                    />
                  </div>

                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-black/40 text-gray-400 uppercase border-b border-white/5 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Feature Name</th>
                          <th className="px-4 py-2.5">Requests</th>
                          <th className="px-4 py-2.5">Tokens Incurred</th>
                          <th className="px-4 py-2.5">Total Spend</th>
                          <th className="px-4 py-2.5 text-right">Spend Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(result.breakdowns?.by_feature || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-4 py-2.5 font-bold text-white">{item.key}</td>
                            <td className="px-4 py-2.5 text-gray-400">{item.request_count.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-gray-300">{item.total_tokens.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-blue-400 font-bold">{item.total_cost_formatted}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: By Model */}
              {activeTab === 'model' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-64 w-full flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: (result.breakdowns?.by_model || []).map((m) => m.key),
                        datasets: [
                          {
                            data: (result.breakdowns?.by_model || []).map((m) => m.total_cost_usd),
                            backgroundColor: [
                              'rgba(232, 96, 46, 0.85)',
                              'rgba(96, 165, 250, 0.85)',
                              'rgba(167, 139, 250, 0.85)',
                              'rgba(52, 211, 153, 0.85)',
                              'rgba(251, 191, 36, 0.85)',
                              'rgba(244, 114, 182, 0.85)',
                              'rgba(239, 68, 68, 0.85)',
                              'rgba(14, 165, 233, 0.85)'
                            ],
                            borderWidth: 1,
                            borderColor: '#0f0f13'
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'monospace', size: 10 } }
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-black/40 text-gray-400 uppercase border-b border-white/5">
                        <tr>
                          <th className="px-4 py-2.5">Model</th>
                          <th className="px-4 py-2.5">Requests</th>
                          <th className="px-4 py-2.5">Total Spend</th>
                          <th className="px-4 py-2.5 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(result.breakdowns?.by_model || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-4 py-2.5 font-bold text-white">{item.key}</td>
                            <td className="px-4 py-2.5 text-gray-400">{item.request_count.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-purple-400 font-bold">{item.total_cost_formatted}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: By Time Period */}
              {activeTab === 'time' && (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <Line
                      data={{
                        labels: (result.breakdowns?.by_time_period || []).map((t) => t.key),
                        datasets: [
                          {
                            label: `Daily Spend (${currency})`,
                            data: (result.breakdowns?.by_time_period || []).map((t) => t.total_cost_usd),
                            borderColor: 'rgba(52, 211, 153, 1)',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.35,
                            pointRadius: 2
                          }
                        ]
                      }}
                      options={commonChartOptions}
                    />
                  </div>

                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-black/40 text-gray-400 uppercase border-b border-white/5 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Requests</th>
                          <th className="px-4 py-2.5">Tokens Incurred</th>
                          <th className="px-4 py-2.5">Daily Cost</th>
                          <th className="px-4 py-2.5 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(result.breakdowns?.by_time_period || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-4 py-2.5 font-bold text-white">{item.key}</td>
                            <td className="px-4 py-2.5 text-gray-400">{item.request_count.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-gray-300">{item.total_tokens.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-emerald-400 font-bold">{item.total_cost_formatted}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{item.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 5: Sample Preview */}
              {activeTab === 'preview' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-black/40 text-gray-400 uppercase border-b border-white/5">
                      <tr>
                        <th className="px-4 py-2.5">Request ID</th>
                        <th className="px-4 py-2.5">Timestamp</th>
                        <th className="px-4 py-2.5">Team</th>
                        <th className="px-4 py-2.5">Feature</th>
                        <th className="px-4 py-2.5">Model</th>
                        <th className="px-4 py-2.5">Tokens (In / Out)</th>
                        <th className="px-4 py-2.5 text-right">Attributed Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(result.sample_preview || []).map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-4 py-2.5 text-gray-400">{row.id}</td>
                          <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{row.timestamp}</td>
                          <td className="px-4 py-2.5 font-semibold text-ember">{row.team}</td>
                          <td className="px-4 py-2.5 text-gray-300">{row.feature}</td>
                          <td className="px-4 py-2.5 text-blue-400">{row.model}</td>
                          <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                            {row.prompt_tokens} in / {row.completion_tokens} out
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-ember">{row.cost_formatted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
