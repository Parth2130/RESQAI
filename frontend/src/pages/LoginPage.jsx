import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage({ setActivePage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        setActivePage('admin');
      } else if (user.role === 'responder') {
        setActivePage('responder');
      } else {
        setActivePage('dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5278E8] via-[#7E9DF2] to-[#A5B4FC] items-center justify-center text-white shadow-soft">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to RESQAI
          </h2>
          <p className="text-xs text-pastel-muted">
            Access citizen emergency services or responder operations command.
          </p>
        </div>

        {/* Demo Fast-Login Presets (Ideal for Hackathon Evaluation) */}
        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block text-center">
            Demo Credentials (1-Click Fill)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('citizen@resqai.in', 'Citizen@2026')}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-[11px] font-bold text-slate-700 transition"
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('responder@resqai.in', 'Responder@2026')}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-[11px] font-bold text-slate-700 transition"
            >
              Responder
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin@resqai.in', 'ResqAdmin@2026')}
              className="py-1.5 px-2 bg-white hover:bg-indigo-100/50 border border-indigo-200 rounded-xl text-[11px] font-bold text-slate-700 transition"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="pastel-card p-6 shadow-soft-lg space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.in or user@mail.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-soft transition hover:scale-[1.02] active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-pastel-muted">
            Don't have an account yet?{' '}
            <button
              onClick={() => setActivePage('register')}
              className="font-bold text-[#5278E8] hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
