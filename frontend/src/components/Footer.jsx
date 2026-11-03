import React from 'react';
import { ShieldAlert, ExternalLink, AlertOctagon, HeartHandshake, PhoneCall } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-white border-t border-pastel-border text-pastel-muted text-sm mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Crucial Emergency Disclaimer Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-slate-800">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm mb-1">
                Official Life-Safety Notice for Citizens
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                RESQAI is an intelligent emergency coordination and community telemetry platform designed to enhance disaster awareness, triage preparedness, and situational coordination. <strong className="text-rose-950 font-bold">Submitting an emergency or SOS through RESQAI does not automatically replace national government dispatch services unless an officially authorized integration exists.</strong> In immediate life danger, please immediately dial India's Unified Emergency Helpline <strong className="text-rose-600 font-extrabold">112</strong> or contact your district disaster management control room (1077).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-pastel-border">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5278E8] to-[#A5B4FC] flex items-center justify-center text-white shadow-soft">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                RESQ<span className="text-[#5278E8]">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Detect Faster. Respond Smarter. Save Lives. An AI-powered disaster management ecosystem tailored for community safety and rapid emergency triage.
            </p>
            <div className="pt-1 flex items-center space-x-2 text-xs font-semibold text-indigo-700">
              <HeartHandshake className="w-4 h-4 text-[#5278E8]" />
              <span>Built for Community Resilience</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-3">
              Platform Modules
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button onClick={() => setActivePage('dashboard')} className="hover:text-[#5278E8] transition">
                  Citizen Portal & Telemetry
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('map')} className="hover:text-[#5278E8] transition">
                  Interactive Disaster Map
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('report')} className="hover:text-[#5278E8] font-semibold text-rose-600 transition">
                  Report Incident
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('sos')} className="hover:text-rose-700 font-bold text-rose-600 transition">
                  Emergency SOS Distress
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('track')} className="hover:text-[#5278E8] transition">
                  Track Incident Status
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('analytics')} className="hover:text-[#5278E8] transition">
                  Operations Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* National Helplines */}
          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-3">
              Emergency Direct Dial
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center justify-between">
                <span>Unified National Helpline:</span>
                <a href="tel:112" className="font-bold text-rose-600 hover:underline">112</a>
              </li>
              <li className="flex items-center justify-between">
                <span>NDMA National Helpline:</span>
                <a href="tel:1070" className="font-semibold text-indigo-700 hover:underline">1070</a>
              </li>
              <li className="flex items-center justify-between">
                <span>District Disaster Helpline (SDRF):</span>
                <a href="tel:1077" className="font-semibold text-indigo-700 hover:underline">1077</a>
              </li>
              <li className="flex items-center justify-between">
                <span>Ambulance Services:</span>
                <a href="tel:108" className="font-semibold text-indigo-700 hover:underline">108</a>
              </li>
              <li className="flex items-center justify-between">
                <span>Fire Rescue Service:</span>
                <a href="tel:101" className="font-semibold text-indigo-700 hover:underline">101</a>
              </li>
            </ul>
          </div>

          {/* Official Portals & Sources */}
          <div>
            <h5 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-3">
              Verified Data Sources
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a 
                  href="https://sachet.ndma.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#5278E8] transition"
                >
                  <span>NDMA SACHET Alert Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://earthquake.usgs.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#5278E8] transition"
                >
                  <span>USGS Earthquake Hazards</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://open-meteo.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#5278E8] transition"
                >
                  <span>Open-Meteo Weather API</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://firms.modaps.eosdis.nasa.gov" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between hover:text-[#5278E8] transition"
                >
                  <span>NASA FIRMS Satellites</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 RESQAI. Intelligent Emergency Management & Response System. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
            <span>Privacy & Compliance Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
