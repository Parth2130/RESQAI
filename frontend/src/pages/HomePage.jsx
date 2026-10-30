import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  ArrowRight, 
  Bot, 
  CloudRain, 
  Flame, 
  Waves, 
  Thermometer, 
  Radio, 
  CheckCircle2, 
  Sparkles,
  PhoneCall,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function HomePage({ setActivePage, onOpenAssistant }) {
  const [weatherData, setWeatherData] = useState(null);
  const [earthquakeData, setEarthquakeData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);

  useEffect(() => {
    async function loadLiveTelemetry() {
      setLoadingTelemetry(true);
      try {
        const [w, eq, al] = await Promise.allSettled([
          api.getWeather({ city: 'delhi' }),
          api.getEarthquakes({ minMag: 3.0 }),
          api.getAlerts()
        ]);

        if (w.status === 'fulfilled') setWeatherData(w.value);
        if (eq.status === 'fulfilled') setEarthquakeData(eq.value);
        if (al.status === 'fulfilled') setAlertsData(al.value);
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      } finally {
        setLoadingTelemetry(false);
      }
    }

    loadLiveTelemetry();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-resq-blue/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[350px] h-[200px] bg-red-600/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 mb-6 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Real-Time Disaster Management & Preparedness Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            When Every Second Matters,{' '}
            <span className="bg-gradient-to-r from-resq-cyan via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Intelligence Matters.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            RESQAI empowers citizens, disaster responders, and civic authorities across India with live weather telemetry, earthquake alerts, community SOS reporting, and an AI-powered preparedness assistant.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-resq-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-glow-blue border border-blue-400/40 transition-all hover:scale-105 active:scale-95"
            >
              <Activity className="w-5 h-5 text-cyan-200" />
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActivePage('report')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-glow-red border border-red-400/40 transition-all hover:scale-105 active:scale-95"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Report Emergency (SOS)</span>
            </button>

            <button
              onClick={onOpenAssistant}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-resq-card hover:bg-resq-cardLight text-slate-200 font-semibold px-6 py-3.5 rounded-xl border border-resq-border hover:border-resq-cyan transition"
            >
              <Bot className="w-5 h-5 text-resq-cyan" />
              <span>AI Preparedness Chat</span>
            </button>
          </div>

          {/* Quick Stats Ticker */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-xl text-left border-resq-border/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Weather Feed</span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {weatherData ? `${weatherData.temperature}°C` : 'Connecting...'}
              </span>
              <span className="text-[11px] text-resq-cyan flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {weatherData ? weatherData.weather_condition : 'Open-Meteo'}
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl text-left border-resq-border/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recent Earthquakes</span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                {earthquakeData ? `${earthquakeData.count} Recorded` : 'Loading feed...'}
              </span>
              <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                USGS Global Monitor
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl text-left border-resq-border/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">National Alerts</span>
              <span className="text-xl font-extrabold text-white mt-1 block">
                NDMA SACHET
              </span>
              <span className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Official Channel
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl text-left border-red-500/30 bg-red-950/20">
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider block">Emergency Helpline</span>
              <span className="text-xl font-extrabold text-red-400 mt-1 block">112</span>
              <span className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                Unified Dispatch (India)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Information Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-resq-cyan animate-pulse" />
              Live Telemetry & Situational Awareness
            </h2>
            <p className="text-sm text-slate-400">
              Grounded exclusively in real data from Open-Meteo and USGS Earthquake Hazards Program.
            </p>
          </div>
          <button
            onClick={() => setActivePage('dashboard')}
            className="text-xs font-semibold text-resq-cyan hover:text-white flex items-center gap-1 transition"
          >
            <span>Full Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather Card */}
          <div className="glass-panel rounded-2xl p-6 border-resq-border flex flex-col justify-between hover:border-resq-cyan/50 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5" />
                  Live Weather Telemetry
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Open-Meteo</span>
              </div>

              {weatherData ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-extrabold text-white">{weatherData.temperature}°C</h3>
                    <p className="text-sm font-medium text-slate-300">{weatherData.location}</p>
                    <p className="text-xs text-resq-cyan mt-1">{weatherData.weather_condition}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-3 border-t border-resq-border/60">
                    <div>Wind: <strong className="text-white">{weatherData.wind_speed} km/h</strong></div>
                    <div>Precipitation: <strong className="text-white">{weatherData.precipitation} mm</strong></div>
                    <div>Humidity: <strong className="text-white">{weatherData.relative_humidity}%</strong></div>
                    <div>Risk Level: <strong className="text-emerald-400">{weatherData.risk_level || 'Normal'}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {loadingTelemetry ? "Fetching live Open-Meteo weather..." : "Data currently unavailable."}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-resq-border/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Source: Open-Meteo API</span>
              <button 
                onClick={() => setActivePage('dashboard')} 
                className="text-resq-blue hover:text-resq-cyan font-semibold"
              >
                View 7-Day Forecast →
              </button>
            </div>
          </div>

          {/* Earthquake Card */}
          <div className="glass-panel rounded-2xl p-6 border-resq-border flex flex-col justify-between hover:border-amber-500/50 transition">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Recent Seismic Events
                </span>
                <span className="text-[11px] text-slate-500 font-mono">USGS</span>
              </div>

              {earthquakeData && earthquakeData.earthquakes && earthquakeData.earthquakes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">
                      M{earthquakeData.earthquakes[0].magnitude}
                    </span>
                    <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                      {earthquakeData.earthquakes[0].severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {earthquakeData.earthquakes[0].place}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Depth: {earthquakeData.earthquakes[0].depth_km} km | Time: {new Date(earthquakeData.earthquakes[0].time).toLocaleTimeString()}
                  </p>

                  <div className="bg-resq-dark/60 p-2.5 rounded-lg border border-resq-border/60 text-xs text-slate-300">
                    <span className="text-slate-400">Subcontinent Focus: </span>
                    <span className="font-semibold text-white">
                      {earthquakeData.earthquakes.filter(e => e.in_south_asia).length} tremors in/near South Asia
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {loadingTelemetry ? "Fetching USGS GeoJSON feed..." : "Data currently unavailable."}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-resq-border/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Source: USGS GeoJSON</span>
              <button 
                onClick={() => setActivePage('map')} 
                className="text-amber-400 hover:text-amber-300 font-semibold"
              >
                View on Geo-Map →
              </button>
            </div>
          </div>

          {/* National Portal & SOS Card */}
          <div className="glass-panel rounded-2xl p-6 border-resq-border flex flex-col justify-between hover:border-red-500/50 transition bg-gradient-to-br from-resq-card to-red-950/20">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  NDMA SACHET Portal
                </span>
                <span className="text-[11px] text-slate-500 font-mono">India</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-bold text-white">
                  National Disaster Warning Gateway
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {alertsData ? alertsData.message : "Connects to NDMA SACHET for public weather and natural hazard bulletins across India."}
                </p>

                <div className="pt-2">
                  <a
                    href="https://sachet.ndma.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>Visit Official SACHET Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-resq-border/60">
              <button
                onClick={() => setActivePage('report')}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-glow-red transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Citizen Emergency SOS</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How RESQAI Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-resq-cyan block mb-2">
            Integrated Lifecycle
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            How RESQAI Protects Communities
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            A continuous loop bridging real-time satellite & seismic telemetry with grassroots citizen action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative border-resq-border">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-resq-cyan flex items-center justify-center font-bold text-lg mb-4 border border-blue-500/30">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-2">Real-Time Detection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated ingestion from Open-Meteo, USGS earthquakes, and official alerts keeps situational data up-to-the-minute.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border-resq-border">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4 border border-cyan-500/30">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-2">AI Guidance</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nugen AI assistant provides instant, multilingual safety instructions (English, Hindi, Marathi) tailored to your situation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border-resq-border">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg mb-4 border border-red-500/30">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-2">Citizen SOS Reporting</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Citizens submit geolocation-tagged emergency reports, generating a secure tracking ID to follow status updates.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border-resq-border">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 border border-emerald-500/30">
              4
            </div>
            <h3 className="font-bold text-white text-base mb-2">Control Room Dispatch</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Admins securely review verified incidents, triage severity, manage status pipelines, and coordinate response notes.
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Preparedness Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="glass-panel rounded-3xl p-8 border-resq-borderLight bg-gradient-to-r from-resq-navy via-slate-900 to-resq-card relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Actionable Preparedness
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Be Ready Before the Alarm Sounds
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explore comprehensive survival guides for earthquakes, flash floods, heatwaves, cyclones, and landslides—including the essential 72-Hour Emergency Go-Bag checklist.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setActivePage('preparedness')}
                  className="bg-resq-blue hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-glow-blue transition"
                >
                  View Safety Manuals
                </button>
                <button
                  onClick={() => setActivePage('resources')}
                  className="bg-resq-card hover:bg-resq-cardLight text-slate-200 border border-resq-border font-semibold text-xs px-5 py-2.5 rounded-xl transition"
                >
                  National Helplines (112)
                </button>
              </div>
            </div>

            <div className="bg-resq-dark/80 p-5 rounded-2xl border border-resq-border space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Key Safety Protocols
              </h4>
              <ul className="text-xs text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-resq-cyan mt-0.5 flex-shrink-0" />
                  <span><strong>Earthquake:</strong> Drop, Cover, and Hold On under sturdy furniture.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-resq-cyan mt-0.5 flex-shrink-0" />
                  <span><strong>Flood:</strong> Never drive or wade through flowing water. Turn Around, Don't Drown.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-resq-cyan mt-0.5 flex-shrink-0" />
                  <span><strong>Immediate Hazard:</strong> Dial 112 directly for official responders.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
