import React from 'react';
import { 
  PhoneCall, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  AlertOctagon, 
  Compass, 
  HeartHandshake, 
  Info,
  Phone
} from 'lucide-react';

const HELPLINES = [
  { number: '112', title: 'National Emergency Helpline (Unified)', agency: 'Ministry of Home Affairs', type: 'All-in-one Emergency', badge: 'Critical' },
  { number: '1070', title: 'National Disaster Management Helpline', agency: 'NDMA Control Room', type: 'Disaster Relief', badge: 'National' },
  { number: '1077', title: 'District Disaster Emergency Operations', agency: 'State Disaster Response (SDRF)', type: 'District Level', badge: 'Local' },
  { number: '108', title: 'Emergency Medical & Ambulance', agency: 'State Health Departments', type: 'Medical First Responders', badge: 'Health' },
  { number: '101', title: 'Fire & Rescue Services', agency: 'Fire Service Headquarters', type: 'Fire Evacuation', badge: 'Rescue' },
  { number: '100', title: 'Police Emergency Response', agency: 'State Police Departments', type: 'Law & Order', badge: 'Safety' },
  { number: '1091', title: 'Women Distress Helpline', agency: 'Women Safety Division', type: 'Specialized Support', badge: 'Support' },
  { number: '1098', title: 'Childline Emergency Care', agency: 'Ministry of WCD', type: 'Child Protection', badge: 'Support' }
];

const OFFICIAL_PORTALS = [
  {
    name: 'NDMA SACHET Portal',
    url: 'https://sachet.ndma.gov.in/',
    description: 'National public alert system for geo-targeted weather warnings and disaster bulletins across India.'
  },
  {
    name: 'India Meteorological Department (IMD)',
    url: 'https://mausam.imd.gov.in/',
    description: 'Official national weather forecasts, cyclone tracking, and severe weather warnings for all meteorological sub-divisions.'
  },
  {
    name: 'Central Water Commission (CWC) Flood Portal',
    url: 'https://ffs.india-water.gov.in/',
    description: 'Live river water levels, dam discharge notifications, and basin-level flood forecasts.'
  },
  {
    name: 'National Disaster Management Authority (NDMA)',
    url: 'https://ndma.gov.in/',
    description: 'Apex body for disaster management policies, mitigation frameworks, and national guidelines in India.'
  },
  {
    name: 'National Disaster Response Force (NDRF)',
    url: 'https://ndrf.gov.in/',
    description: 'Specialized response force for life-saving operations during natural and man-made disasters.'
  },
  {
    name: 'Geological Survey of India (GSI Landslide Portal)',
    url: 'https://www.gsi.gov.in/',
    description: 'Landslide susceptibility mapping, hazard zonation, and rain-induced landslide bulletins.'
  }
];

export default function ResourcesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-resq-border/80">
        <span className="text-xs font-bold uppercase tracking-widest text-resq-cyan block mb-1">
          Verified Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Emergency Resources & National Helplines
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Government hotlines, official ministerial portals, and verified medical registry links for India.
        </p>
      </div>

      {/* Prominent Unified 112 Hero Banner */}
      <div className="glass-panel-danger rounded-3xl p-6 sm:p-8 border-red-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              India's Single Emergency Number
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Dial 112 for All Life-Critical Emergencies
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Emergency Response Support System (ERSS) provides a unified pan-India helpline for Police, Fire, Ambulance, and Disaster assistance. It is accessible 24/7 from any phone without requiring mobile data.
            </p>
          </div>

          <div className="flex-shrink-0">
            <a
              href="tel:112"
              className="inline-flex items-center space-x-2.5 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-glow-red border border-red-400/40 transition-all hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-6 h-6 animate-bounce" />
              <span>DIAL 112</span>
            </a>
          </div>
        </div>
      </div>

      {/* National Helplines Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-resq-cyan" />
          Verified Emergency Hotlines (India)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HELPLINES.map((item) => (
            <div
              key={item.number}
              className="glass-panel p-5 rounded-2xl border-resq-border hover:border-resq-cyan/50 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {item.number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {item.agency}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-resq-border/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{item.type}</span>
                <a
                  href={`tel:${item.number}`}
                  className="text-xs font-bold text-resq-cyan hover:underline flex items-center gap-1"
                >
                  <span>Call</span>
                  <PhoneCall className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Government Portals */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Official Disaster Management & Telemetry Authorities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_PORTALS.map((portal) => (
            <div
              key={portal.name}
              className="glass-panel p-5 rounded-2xl border-resq-border hover:border-slate-600 flex flex-col justify-between transition"
            >
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  {portal.name}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {portal.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-resq-border/60">
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <span>Access Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital & Health Facility Finder Guidance */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border-resq-border space-y-4">
        <div className="flex items-start space-x-3">
          <Building2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">
              Verified Hospital & Medical Facility Directory Notice
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In accordance with strict safety protocols, <strong>RESQAI never displays invented, unverified, or static mock hospital beds or phone numbers</strong>. For verified, accredited government and private hospitals across India, citizens should consult the official registry provided by the National Health Authority:
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="https://facility.abdm.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-resq-dark hover:bg-slate-800 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition"
              >
                <span>Ayushman Bharat Health Facility Registry (Official)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://www.nhp.gov.in/hospital-search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-resq-dark hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-resq-border transition"
              >
                <span>National Health Portal Directory</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
