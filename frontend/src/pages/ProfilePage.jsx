import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Shield, 
  Key, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage({ setActivePage }) {
  const { user, logout, isResponder, isAdmin } = useAuth();

  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Dr. Suresh Patil (Family)', phone: '+91 98220 54321', relation: 'Family Physician' },
    { name: 'Meera Sharma (Sister)', phone: '+91 98112 99887', relation: 'Next of Kin' }
  ]);

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');

  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    weatherBulletins: true,
    seismicSensors: false,
    soundAlert: true
  });

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    setEmergencyContacts([
      ...emergencyContacts,
      { name: newContactName, phone: newContactPhone, relation: newContactRelation || 'Contact' }
    ]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
  };

  const handleRemoveContact = (idx) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx));
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 pastel-card text-center space-y-4">
        <User className="w-12 h-12 text-[#5278E8] mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Please Sign In</h2>
        <p className="text-xs text-slate-500">You must be logged in to access personal settings and emergency contacts.</p>
        <button
          onClick={() => setActivePage('login')}
          className="px-6 py-2.5 rounded-xl bg-[#5278E8] text-white font-bold text-xs shadow-soft"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              User Profile & Settings
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200 uppercase">
              {user.role}
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Manage your personal emergency contacts, telemetry alert preferences, and account security.
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            setActivePage('home');
          }}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User Card - 5 Cols */}
        <div className="md:col-span-5 pastel-card p-6 space-y-6 shadow-soft">
          <div className="text-center space-y-3 pb-6 border-b border-pastel-border">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#5278E8] to-[#A5B4FC] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-soft">
              {user.name?.[0] || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{user.name}</h3>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{user.verified ? 'Verified Account' : 'Standard Access'}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">User Role:</span>
              <span className="font-bold text-slate-900 capitalize">{user.role}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Contact Phone:</span>
              <span className="font-bold text-slate-900">{user.phone || 'Not supplied'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Agency / Dept:</span>
              <span className="font-bold text-slate-900">{user.agency || 'Public Citizen'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Account ID:</span>
              <span className="font-mono text-slate-600">USR-00{user.id}</span>
            </div>
          </div>
        </div>

        {/* Right Settings: Emergency Contacts & Notification Preferences - 7 Cols */}
        <div className="md:col-span-7 space-y-6">
          {/* Emergency Contacts Card */}
          <div className="pastel-card p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-[#5278E8]" />
                <h3 className="font-extrabold text-slate-900 text-sm">Designated Emergency Contacts</h3>
              </div>
              <span className="text-[11px] text-slate-400">Next-of-Kin</span>
            </div>

            {/* List */}
            <div className="space-y-2">
              {emergencyContacts.map((c, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-pastel-border flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <p className="text-[11px] text-slate-500">{c.relation} • {c.phone}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveContact(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Contact Form */}
            <form onSubmit={handleAddContact} className="pt-2 border-t border-pastel-border grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                type="text"
                placeholder="Name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
                className="p-2 rounded-lg border border-pastel-border bg-slate-50"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
                className="p-2 rounded-lg border border-pastel-border bg-slate-50"
              />
              <button
                type="submit"
                className="py-2 bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold rounded-lg shadow-soft transition"
              >
                + Add Contact
              </button>
            </form>
          </div>

          {/* Notification Preferences Card */}
          <div className="pastel-card p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#5278E8]" />
                <h3 className="font-extrabold text-slate-900 text-sm">Disaster Alert Preferences</h3>
              </div>
              <span className="text-[11px] text-slate-400">In-App & SMS Channels</span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { id: 'criticalAlerts', label: 'High-Severity Life Danger Alerts (NDMA SACHET)', desc: 'Immediate notification of cyclones, flash floods, or dam overflows.' },
                { id: 'weatherBulletins', label: 'Severe Weather Precipitation Advisories', desc: 'Alerts when rainfall exceeds 50mm/day in your sector.' },
                { id: 'seismicSensors', label: 'USGS Seismic Activity Alerts (M4.5+)', desc: 'Push telemetry when tectonic movement occurs in the Himalayan belt.' },
                { id: 'soundAlert', label: 'Audible Emergency Siren Beacon', desc: 'Plays audible alarm tone on critical SOS triggers.' }
              ].map(pref => (
                <div key={pref.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-pastel-border">
                  <div className="space-y-0.5 pr-4">
                    <span className="font-bold text-slate-900">{pref.label}</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[pref.id]}
                    onChange={(e) => setNotifications({ ...notifications, [pref.id]: e.target.checked })}
                    className="w-4 h-4 mt-1 rounded text-[#5278E8] focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
