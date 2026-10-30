import React, { useState, useEffect } from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';

export default function EmergencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [systemOk, setSystemOk] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(() => setSystemOk(true))
      .catch(() => setSystemOk(false));
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-950 text-white border-b border-red-500/30 text-xs sm:text-sm px-4 py-2 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="font-semibold tracking-wide text-red-200 uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            National Emergency Warning:
          </span>
          <span className="text-slate-200 hidden md:inline">
            In immediate life danger, call India’s official emergency dispatch number directly.
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="tel:112"
            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>Dial 112 (India)</span>
          </a>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 border-l border-slate-700 pl-3">
            <ShieldCheck className={`w-3.5 h-3.5 ${systemOk ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{systemOk ? 'Telemetry Online' : 'Telemetry Standby'}</span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
