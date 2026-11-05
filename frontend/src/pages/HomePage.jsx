import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  MapPin, 
  AlertCircle, 
  Sparkles, 
  Navigation, 
  Radio, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Database, 
  PhoneCall, 
  Zap, 
  ShieldCheck, 
  CloudRain, 
  Flame, 
  Waves,
  Eye,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function HomePage({ setActivePage, onOpenAssistant }) {
  const [stats, setStats] = useState({
    activeIncidents: 4,
    seismicEvents: 18,
    verifiedResources: 7,
    weatherAlerts: 'Normal'
  });

  useEffect(() => {
    // Load live telemetry counts
    Promise.allSettled([
      api.getIncidents({ limit: 10 }),
      api.getEarthquakes({ minMag: 3.0 }),
      api.getResources()
    ]).then(([incRes, eqRes, resRes]) => {
      setStats({
        activeIncidents: incRes.status === 'fulfilled' ? incRes.value.length : 4,
        seismicEvents: eqRes.status === 'fulfilled' ? (eqRes.value.count || eqRes.value.earthquakes?.length || 18) : 18,
        verifiedResources: resRes.status === 'fulfilled' ? resRes.value.length : 7,
        weatherAlerts: 'Active'
      });
    });
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Soft Pastel Background Blobs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-blue-100/50 via-indigo-100/40 to-sky-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#5278E8] text-xs font-bold shadow-xs">
                <Sparkles className="w-4 h-4 text-[#5278E8]" />
                <span>Next-Gen AI Emergency Management Platform</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                When Every Second Matters, <br />
                <span className="bg-gradient-to-r from-[#5278E8] via-[#7E9DF2] to-[#38BDF8] bg-clip-text text-transparent">
                  Intelligence Matters.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-pastel-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                An intelligent emergency management platform connecting real-time disaster information, location awareness and AI-powered preparedness guidance.
              </p>

              {/* Mandatory Hero CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-sm shadow-soft hover:shadow-soft-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Activity className="w-4 h-4" />
                  <span>Explore Live Dashboard</span>
                </button>

                <button
                  onClick={() => setActivePage('report')}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-sm border border-rose-200 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Report an Emergency</span>
                </button>

                <button
                  onClick={onOpenAssistant}
                  className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-indigo-700 font-bold text-sm border border-indigo-200 shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Ask AI Assistant</span>
                </button>

                <button
                  onClick={() => setActivePage('sos')}
                  className="flex items-center space-x-1.5 px-4 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-glow-danger transition-all hover:scale-105 active:scale-95"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>SOS Distress</span>
                </button>
              </div>

              {/* Verified Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-pastel-border/80 text-left">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{stats.activeIncidents}</div>
                  <div className="text-xs text-slate-500 font-medium">Active Incidents</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#5278E8]">{stats.seismicEvents}</div>
                  <div className="text-xs text-slate-500 font-medium">USGS Quakes (24h)</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-600">{stats.verifiedResources}</div>
                  <div className="text-xs text-slate-500 font-medium">Verified Resources</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-rose-600">112</div>
                  <div className="text-xs text-slate-500 font-medium">National Protocol</div>
                </div>
              </div>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="pastel-card p-6 relative overflow-hidden bg-white/90 backdrop-blur-md shadow-soft-lg border-indigo-100">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-pastel-border">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Live Telemetry Matrix
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
                    REAL-TIME
                  </span>
                </div>

                {/* Simulated Visual Pipeline */}
                <div className="space-y-4 py-4">
                  {/* Item 1 */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#5278E8] text-white flex items-center justify-center font-bold text-xs">
                        AI
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Nugen AI Triage Engine</h4>
                        <p className="text-[11px] text-slate-500">4 Modules: Classify • Risk • Chat • Dispatch</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                        <CloudRain className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Open-Meteo Meteorology</h4>
                        <p className="text-[11px] text-slate-500">Live rainfall, wind speed & 5-day forecasts</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>

                  {/* Item 3 */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">USGS Seismic Monitor</h4>
                        <p className="text-[11px] text-slate-500">Real-time M2.0+ tremors & South Asia plate</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Telemetry
                    </span>
                  </div>

                  {/* Item 4 */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50/50 border border-rose-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Smart Transit Routing</h4>
                        <p className="text-[11px] text-slate-500">Hazard-aware corridor buffers & time ETA</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      A* Engine
                    </span>
                  </div>
                </div>

                {/* Footer action in card */}
                <div className="pt-2">
                  <button
                    onClick={() => setActivePage('map')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                  >
                    <span>View Interactive Disaster Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OUR MISSION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 border border-indigo-100/80 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#5278E8] text-xs font-bold shadow-xs">
            <Award className="w-4 h-4" />
            <span>Our Core Purpose</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Saving Lives Through Faster Detection and Smarter Response
          </h2>
          <p className="text-pastel-muted max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            During cyclones, floods, earthquakes, landslides, and urban emergencies, fragmentation of data costs critical minutes. ResQAI bridges satellite telemetry, meteorological models, citizen crowd-reporting, and AI reasoning to equip responders and citizens with unambiguous, actionable clarity.
          </p>
        </div>
      </section>

      {/* 3. EMERGENCY MANAGEMENT CHALLENGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5278E8]">
            Key Problems We Solve
          </h3>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Overcoming Real-World Disaster Challenges
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Delayed Emergency Response",
              desc: "Citizens struggle to relay precise coordinates and severity, causing bottlenecked dispatch lines.",
              icon: Zap,
              color: "text-amber-600",
              bg: "bg-amber-50"
            },
            {
              title: "Fragmented Emergency Information",
              desc: "Weather alerts, earthquake feeds, and ground reports reside in isolated, incompatible silos.",
              icon: Database,
              color: "text-blue-600",
              bg: "bg-blue-50"
            },
            {
              title: "Unsafe Rescue Routes",
              desc: "Responders risk traversing flooded roads, landslide-blocked ghats, or damaged bridges without warning.",
              icon: Navigation,
              color: "text-rose-600",
              bg: "bg-rose-50"
            },
            {
              title: "Inefficient Resource Allocation",
              desc: "Boats, ambulances, and trauma teams are frequently misallocated without capability-matching.",
              icon: Users,
              color: "text-indigo-600",
              bg: "bg-indigo-50"
            },
            {
              title: "Lack of Centralized Monitoring",
              desc: "Incident commanders lack real-time situational awareness across multiple districts.",
              icon: Eye,
              color: "text-sky-600",
              bg: "bg-sky-50"
            },
            {
              title: "Vulnerable Populations Overlooked",
              desc: "Elderly, infants, pregnant mothers, and mobility-impaired residents often lack priority extraction flags.",
              icon: ShieldCheck,
              color: "text-purple-600",
              bg: "bg-purple-50"
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="pastel-card p-6 space-y-3 hover:shadow-soft transition-all">
                <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-pastel-muted leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. HOW RESQAI WORKS (4-STEP LIFECYCLE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5278E8]">
            Operational Workflow
          </h3>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How ResQAI Operates in Disasters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Detect",
              desc: "Continuous ingestion of satellite fires (NASA), seismic tremors (USGS), weather forecasts (Open-Meteo), and citizen reports.",
              color: "border-sky-200"
            },
            {
              step: "02",
              title: "Analyze",
              desc: "Nugen AI classifies emergency types, extracts vulnerable population flags, and computes bounded 0-100 risk assessments.",
              color: "border-indigo-200"
            },
            {
              step: "03",
              title: "Coordinate",
              desc: "Responders review capability-matched resources (boats, ICU beds, fire tenders) and evaluate hazard-aware transit routes.",
              color: "border-purple-200"
            },
            {
              step: "04",
              title: "Guide",
              desc: "Citizens track incident progress in real-time and consult the AI Assistant for verified NDMA safety guidance.",
              color: "border-emerald-200"
            }
          ].map((item, idx) => (
            <div key={idx} className={`pastel-card p-6 border-t-4 ${item.color} space-y-2 relative`}>
              <span className="text-3xl font-black text-slate-200">{item.step}</span>
              <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
              <p className="text-xs text-pastel-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NUGEN AI-POWERED MODULES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pastel-card p-8 lg:p-12 bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/40 border-indigo-200 shadow-soft-lg space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5278E8]">
                Intelligent Engine
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                4 Specialized Nugen AI Modules
              </h2>
            </div>
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Assistant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-pastel-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5278E8]">Module 1</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">Structured JSON</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Emergency Classification & Triage</h4>
              <p className="text-xs text-pastel-muted">
                Parses raw citizen emergency descriptions, extracts category (Flood, Fire, Landslide, etc.), severity, affected count, and vulnerable population flags with confidence scores.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-pastel-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5278E8]">Module 2</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">Multi-Factor Score</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Transparent Risk Assessment Engine</h4>
              <p className="text-xs text-pastel-muted">
                Synthesizes disaster type, reported severity, people needing rescue, and active weather triggers to calculate explainable 0-100 risk grades (Critical, High, Medium, Low).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-pastel-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5278E8]">Module 3</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">Multilingual</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Conversational Safety Assistant</h4>
              <p className="text-xs text-pastel-muted">
                Provides grounded NDMA disaster protocols in English, Hindi, and Marathi. Grounded with live telemetry while enforcing strict 112 emergency dialing instructions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-pastel-border shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5278E8]">Module 4</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Responder Support</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Response Recommendations</h4>
              <p className="text-xs text-pastel-muted">
                Assists commanders by suggesting appropriate resource categories, response priorities, perimeter precautions, and evacuation guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#5278E8] via-[#6384EC] to-[#A5B4FC] text-white shadow-soft-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Experience Intelligent Response?
            </h3>
            <p className="text-indigo-100 text-sm max-w-xl">
              Explore the live disaster map, test emergency reporting, or log in to the responder command dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-6 py-3 rounded-xl bg-white text-[#5278E8] font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-sm transition hover:scale-105 active:scale-95"
            >
              Open Dashboard
            </button>
            <button
              onClick={() => setActivePage('map')}
              className="px-6 py-3 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 border border-white/20 text-white font-bold text-xs sm:text-sm transition hover:scale-105 active:scale-95"
            >
              Live Map
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
