import React, { useState } from 'react';
import { ShieldAlert, User, Mail, Lock, Phone, Building2, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage({ setActivePage }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'citizen',
    agency: ''
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register(formData);
      if (user.role === 'admin') {
        setActivePage('admin');
      } else if (user.role === 'responder') {
        setActivePage('responder');
      } else {
        setActivePage('dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5278E8] via-[#7E9DF2] to-[#A5B4FC] items-center justify-center text-white shadow-soft">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Register for RESQAI
          </h2>
          <p className="text-xs text-pastel-muted">
            Create your account for emergency response coordination and personal safety.
          </p>
        </div>

        <div className="pastel-card p-6 shadow-soft-lg space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@email.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'citizen', label: 'Citizen', desc: 'Public Access' },
                  { id: 'responder', label: 'Responder', desc: 'SDRF / NDRF' },
                  { id: 'admin', label: 'Admin', desc: 'Control Room' }
                ].map(r => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setFormData({ ...formData, role: r.id })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      formData.role === r.id
                        ? 'border-[#5278E8] bg-indigo-50/50 text-[#5278E8] font-bold shadow-xs'
                        : 'border-pastel-border bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Agency field if responder/admin */}
            {formData.role !== 'citizen' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Affiliated Emergency Agency</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.agency}
                      onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                      placeholder="e.g. NDRF, Fire Brigade, District Health Service"
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Official Verification Notice:</strong> In accordance with safety protocol, newly registered responder and administrator accounts are set to unverified status until reviewed by an authorized system administrator.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-soft transition hover:scale-[1.02] active:scale-98 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-pastel-muted">
            Already have an account?{' '}
            <button
              onClick={() => setActivePage('login')}
              className="font-bold text-[#5278E8] hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
