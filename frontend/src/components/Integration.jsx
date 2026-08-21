import React, { useState } from 'react';
import { Copy, CheckCircle, Code, ShieldCheck } from 'lucide-react';

export default function Integration() {
  const [copied, setCopied] = useState('');

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const endpoint = "http://127.0.0.1:8000/v1/chat/completions";
  const testKey = "kg_live_demo_key_99";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyber-green/10 blur-3xl rounded-full pointer-events-none"></div>
        
        <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
          <Code className="text-cyber-green" /> 
          API Integration
        </h3>
        <p className="text-gray-400 mb-8 font-mono text-sm">
          Connect your client applications (OpenAI compatible) directly to the Krypton Gateway. 
          The proxy will automatically inspect and forward payloads to the upstream LLM.
        </p>

        <div className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-mono">Base URL / Endpoint</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 break-all">
                {endpoint}
              </div>
              <button 
                onClick={() => handleCopy(endpoint, 'endpoint')}
                className="p-4 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 text-cyber-green rounded-lg transition-colors flex items-center justify-center w-14"
              >
                {copied === 'endpoint' ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
          </div>

          {/* Default API Key */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-mono">Test API Key (Freemium Tier)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300">
                {testKey}
              </div>
              <button 
                onClick={() => handleCopy(testKey, 'key')}
                className="p-4 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 text-cyber-green rounded-lg transition-colors flex items-center justify-center w-14"
              >
                {copied === 'key' ? <CheckCircle size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-2 flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-400" />
              Pre-configured for up to 4,000 tokens/request and $0.50 daily budget.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
