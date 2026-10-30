import React from 'react';
import { ShieldAlert, ExternalLink, AlertOctagon, HeartHandshake, PhoneCall } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-resq-dark/95 border-t border-resq-border/80 text-slate-400 text-sm mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Important Disclaimer Card */}
        <div className="mb-10 p-5 rounded-2xl glass-panel-danger border-red-500/40 text-slate-200">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-red-200 text-base mb-1">
                Crucial Emergency Disclaimer for Citizens
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                RESQAI is an informational intelligence and community reporting platform designed to improve disaster awareness, safety preparedness, and situational coordination in India. <strong className="text-white">It is NOT an official government emergency dispatch service.</strong> In immediate life danger or medical catastrophe, please immediately dial India's Unified Emergency Helpline <strong className="text-red-400">112</strong> or contact your local district emergency operations center (1077).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-resq-border/60">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-resq-blue flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                RESQ<span className="text-resq-cyan">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detect Faster. Respond Smarter. Save Lives. An AI-powered disaster management ecosystem tailored for the Indian subcontinent.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-300">
              <HeartHandshake className="w-4 h-4 text-resq-cyan" />
              <span>Built for Community Resilience</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">
              Platform Modules
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActivePage('dashboard')} className="hover:text-resq-cyan transition">
                  Live Telemetry Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('map')} className="hover:text-resq-cyan transition">
                  Real-Time Disaster Map
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('report')} className="hover:text-red-400 text-red-300 transition">
                  Report Emergency (SOS)
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('track')} className="hover:text-resq-cyan transition">
                  Track Incident Status
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('preparedness')} className="hover:text-resq-cyan transition">
                  Disaster Preparedness Guides
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('admin')} className="hover:text-resq-cyan transition text-slate-500">
                  Control Room Login
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">
              National Helplines (India)
            </h5>
            <ul className="space-y-1.5 text-xs">
              <li className="flex justify-between items-center text-slate-300">
                <span>National Emergency:</span>
                <a href="tel:112" className="font-mono font-bold text-red-400 hover:underline">112</a>
              </li>
              <li className="flex justify-between items-center text-slate-300">
                <span>NDMA National Helpline:</span>
                <a href="tel:1070" className="font-mono font-bold text-blue-400 hover:underline">1070</a>
              </li>
              <li className="flex justify-between items-center text-slate-300">
                <span>District Disaster (SDRF):</span>
                <a href="tel:1077" className="font-mono font-bold text-blue-400 hover:underline">1077</a>
              </li>
              <li className="flex justify-between items-center text-slate-300">
                <span>Ambulance Service:</span>
                <a href="tel:108" className="font-mono font-bold text-emerald-400 hover:underline">108</a>
              </li>
              <li className="flex justify-between items-center text-slate-300">
                <span>Fire Rescue Service:</span>
                <a href="tel:101" className="font-mono font-bold text-amber-400 hover:underline">101</a>
              </li>
            </ul>
          </div>

          {/* Live Data Sources */}
          <div>
            <h5 className="font-semibold text-slate-200 uppercase tracking-wider text-xs mb-3">
              Verified Data Providers
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition">
                  <span>Open-Meteo Weather API</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition">
                  <span>USGS Seismic Feed</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://sachet.ndma.gov.in/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition">
                  <span>NDMA SACHET Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition">
                  <span>NASA FIRMS Thermal System</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="https://nugen.in/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition">
                  <span>Nugen AI Inference</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} RESQAI Emergency Response. OpenStreetMap Contributors.</p>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Architecture Active
            </span>
            <span>Privacy Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
