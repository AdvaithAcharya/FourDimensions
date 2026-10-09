import React, { useState } from 'react';
import { Copy, CheckCircle, Code, ShieldCheck, Terminal, Layers } from 'lucide-react';

export default function Integration() {
  const [copied, setCopied] = useState('');

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const endpoint = "http://127.0.0.1:8000/v1/chat/completions";

  const curlExample = `curl -X POST http://127.0.0.1:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "X-Team: Engineering" \\
  -H "X-Feature: CodeReview-Bot" \\
  -H "X-User-ID: dev_alex" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Review this pull request"}],
    "attribution": {
      "team": "Engineering",
      "feature": "CodeReview-Bot",
      "user": "dev_alex",
      "environment": "production"
    }
  }'`;

  const pythonExample = `import httpx

response = httpx.post(
    "http://127.0.0.1:8000/v1/chat/completions",
    headers={
        "X-Team": "Data-Science",
        "X-Feature": "Model-Evaluation",
        "X-User-ID": "ds_elena"
    },
    json={
        "model": "claude-3-5-sonnet",
        "messages": [{"role": "user", "content": "Evaluate clustering results"}],
        "attribution": {
            "team": "Data-Science",
            "feature": "Model-Evaluation",
            "user": "ds_elena"
        }
    }
)
print(response.json())`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-8 rounded-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-ember/10 blur-3xl rounded-full pointer-events-none animate-glow-pulse"></div>

        <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-3">
          <Code className="text-ember animate-float" />
          FinOps Gateway Proxy Integration
        </h3>
        <p className="text-gray-400 mb-8 font-mono text-sm">
          Connect your OpenAI-compatible SDKs and HTTP clients directly to the FinOps proxy.
          Every request will be intercepted, attributed to the specified team/feature, and evaluated against the pricing table.
        </p>

        <div className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-mono">Proxy Endpoint</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 break-all">
                {endpoint}
              </div>
              <button
                onClick={() => handleCopy(endpoint, 'endpoint')}
                className="crazy-btn rounded-lg shimmer-btn"
              >
                <span className="crazy-btn-inner p-4 bg-ember/10 hover:bg-ember/20 border border-ember/30 text-ember flex items-center justify-center w-14 transition-colors">
                  {copied === 'endpoint' ? <CheckCircle size={20} className="text-ember" /> : <Copy size={20} />}
                </span>
              </button>
            </div>
          </div>

          {/* cURL Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-mono flex items-center gap-1.5">
                <Terminal size={14} className="text-ember" />
                cURL Attribution Example
              </label>
              <button
                onClick={() => handleCopy(curlExample, 'curl')}
                className="text-xs font-mono text-ember hover:underline flex items-center gap-1"
              >
                {copied === 'curl' ? 'Copied!' : 'Copy snippet'}
              </button>
            </div>
            <pre className="bg-black/60 border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
              {curlExample}
            </pre>
          </div>

          {/* Python Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-mono flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                Python SDK Integration
              </label>
              <button
                onClick={() => handleCopy(pythonExample, 'python')}
                className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
              >
                {copied === 'python' ? 'Copied!' : 'Copy snippet'}
              </button>
            </div>
            <pre className="bg-black/60 border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
              {pythonExample}
            </pre>
          </div>

          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <ShieldCheck size={16} />
            <span>Configurable attribution metadata accepted via either HTTP Headers (`X-Team`, `X-Feature`) or JSON body `attribution` dictionary.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
