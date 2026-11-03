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
    <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white text-xs sm:text-sm px-4 py-2 sticky top-0 z-50 shadow-sm border-b border-red-400/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="font-bold tracking-wide uppercase flex items-center gap-1.5 text-white">
            <AlertTriangle className="w-3.5 h-3.5" />
            Immediate Life Peril Notice:
          </span>
          <span className="text-red-50 hidden md:inline font-medium">
            RESQAI is an intelligent coordination platform. In immediate life-threatening situations, dial national emergency helpline directly.
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="tel:112"
            className="flex items-center space-x-1.5 bg-white text-red-600 font-extrabold px-3 py-1 rounded-full shadow-sm hover:bg-red-50 transition-all hover:scale-105 active:scale-95 text-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112 (India)</span>
          </a>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-red-100 border-l border-red-400/40 pl-3">
            <ShieldCheck className={`w-3.5 h-3.5 ${systemOk ? 'text-emerald-200' : 'text-amber-200'}`} />
            <span>{systemOk ? 'Telemetry Active' : 'Standby Mode'}</span>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-red-200 hover:text-white p-0.5 rounded transition"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
