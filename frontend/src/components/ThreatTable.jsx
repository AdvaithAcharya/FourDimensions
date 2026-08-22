import React from 'react';
import { ShieldX, AlertTriangle, XOctagon } from 'lucide-react';

const getSeverityIcon = (type) => {
  switch (type) {
    case 'COMPLEXITY_EXCEEDED': return <ShieldX className="text-threat-red" size={18} />;
    case 'VELOCITY_BREACH': return <AlertTriangle className="text-orange-500" size={18} />;
    case 'BUDGET_EXHAUSTED': return <XOctagon className="text-yellow-500" size={18} />;
    default: return <ShieldX size={18} />;
  }
};

export default function ThreatTable({ logs }) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden mt-8">
      <div className="p-4 border-b border-white/10 bg-black/40">
        <h3 className="font-display font-bold text-xl tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-threat-red animate-pulse"></span>
          Live Threat Interception Log
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-black/20 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Threat Type</th>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Financial Cost Saved</th>
              <th className="px-6 py-4">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  System completely secure. No recent threats intercepted.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{log.timestamp.split(' ')[1]}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {getSeverityIcon(log.threat_type)}
                  <span className={log.severity === 'CRITICAL' ? 'text-threat-red' : 'text-orange-400'}>
                    {log.threat_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{log.user_id}</td>
                <td className="px-6 py-4 text-ember font-bold">
                  {log.cost_saved_display}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs max-w-md truncate" title={log.detail}>
                  {log.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
