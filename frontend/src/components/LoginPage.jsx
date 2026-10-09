import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  Sparkles,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Access Denied: Invalid credentials.');
      }

      // Store auth session
      if (data.token) {
        localStorage.setItem('krypton_auth_token', data.token);
        localStorage.setItem('krypton_auth_user', JSON.stringify(data.user || { username: 'admin' }));
      }

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      console.error('Login failed', err);
      setError(err.message || 'Authentication error.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-ember/15 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ember/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glassmorphism Authentication Card */}
      <div
        className={`w-full max-w-md glass-panel p-8 sm:p-10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 transition-all duration-300 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Glowing Top Edge Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-ember to-transparent rounded-t-2xl" />

        {/* Security Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-ember/30 bg-ember/10 text-ember font-mono text-xs uppercase tracking-wider">
            <ShieldCheck size={14} className="animate-pulse" />
            <span>Restricted Access · Admin Clearance</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-black/60 border border-white/10 mb-3 shadow-inner">
            <KeyRound size={32} className="text-ember" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight uppercase text-white">
            Krypton <span className="text-transparent bg-clip-text bg-gradient-to-r from-ember to-amber-400">FinOps</span>
          </h1>
          <p className="text-gray-400 font-mono text-xs mt-1.5 leading-relaxed">
            Administrative access gate for 4-dimensional LLM attribution and accounting telemetry
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 font-mono text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-semibold">Authentication Failed</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Input */}
          <div>
            <label
              htmlFor="admin-username-input"
              className="block font-mono text-[11px] uppercase tracking-wider text-gray-300 mb-1.5"
            >
              Administrator Username
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <User size={16} />
              </div>
              <input
                id="admin-username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember/50 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password-input"
                className="block font-mono text-[11px] uppercase tracking-wider text-gray-300"
              >
                Access Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-11 py-2.5 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-ember focus:ring-1 focus:ring-ember/50 transition-all"
              />
              <button
                type="button"
                id="toggle-password-visibility-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Quick-Fill Helper for Evaluation & Demo */}
          <div className="pt-1">
            <button
              type="button"
              id="admin-quickfill-credentials-btn"
              onClick={handleQuickFill}
              className="w-full py-2 px-3 rounded-lg border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-gray-200 font-mono text-xs flex items-center justify-center gap-2 transition-all group"
            >
              <Zap size={13} className="text-ember group-hover:scale-110 transition-transform" />
              <span>
                Demo Creds: <strong className="text-gray-300">user: admin</strong> | <strong className="text-gray-300">pass: admin123</strong>
              </span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading}
            className="w-full crazy-btn rounded-xl shimmer-btn mt-2 group overflow-hidden"
          >
            <span className="crazy-btn-inner w-full py-3 bg-ember hover:bg-orange-600 text-white font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Authenticate & Unlock Gateway</span>
                </>
              )}
            </span>
          </button>
        </form>

        {/* Security Posture Metadata */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-2 font-mono text-[10px] text-gray-500 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400/90">
            <CheckCircle2 size={12} />
            <span>Zero-Trust Perimeter · End-to-End Session Vault</span>
          </div>
          <div>Commvault Challenge PS-404 Security Compliance</div>
        </div>
      </div>
    </div>
  );
}
