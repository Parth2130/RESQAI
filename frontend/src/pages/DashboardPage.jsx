import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CloudRain, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  RefreshCw, 
  Filter, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  Flame, 
  ExternalLink,
  Clock,
  Compass,
  Radio,
  Eye,
  Search,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  PhoneCall,
  User,
  HeartHandshake
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const INDIAN_CITIES = [
  { id: 'delhi', name: 'New Delhi (NCR)' },
  { id: 'mumbai', name: 'Mumbai, MH' },
  { id: 'pune', name: 'Pune, MH' },
  { id: 'kolkata', name: 'Kolkata, WB' },
  { id: 'bengaluru', name: 'Bengaluru, KA' },
  { id: 'chennai', name: 'Chennai, TN' },
  { id: 'hyderabad', name: 'Hyderabad, TS' },
  { id: 'ahmedabad', name: 'Ahmedabad, GJ' },
  { id: 'patna', name: 'Patna, BR' },
  { id: 'kochi', name: 'Kochi, KL' },
  { id: 'guwahati', name: 'Guwahati, AS' },
  { id: 'shimla', name: 'Shimla, HP' },
];

export default function DashboardPage({ setActivePage }) {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState('delhi');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [earthquakes, setEarthquakes] = useState([]);
  const [earthquakesLoading, setEarthquakesLoading] = useState(false);
  const [earthquakeFilter, setEarthquakeFilter] = useState('all');
  const [minMag, setMinMag] = useState(2.5);

  const [alerts, setAlerts] = useState(null);
  const [fires, setFires] = useState(null);

  const [citizenReports, setCitizenReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Load weather
  const loadWeather = async (city) => {
    setWeatherLoading(true);
    try {
      const data = await api.getWeather({ city });
      setWeather(data);
    } catch (err) {
      console.error(err);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Load earthquakes
  const loadEarthquakes = async (mag, region) => {
    setEarthquakesLoading(true);
    try {
      const data = await api.getEarthquakes({ minMag: mag, region });
      setEarthquakes(data.earthquakes || []);
    } catch (err) {
      console.error(err);
      setEarthquakes([]);
    } finally {
      setEarthquakesLoading(false);
    }
  };

  // Load reports and resources
  const loadReportsAndResources = async () => {
    setReportsLoading(true);
    try {
      const [reportsData, resourcesData, alertsData, firesData, notifsData] = await Promise.allSettled([
        api.getIncidents({ limit: 50 }),
        api.getResources(),
        api.getAlerts(),
        api.getFires(),
        api.getNotifications()
      ]);

      if (reportsData.status === 'fulfilled') setCitizenReports(reportsData.value || []);
      if (resourcesData.status === 'fulfilled') setResources(resourcesData.value || []);
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value || null);
      if (firesData.status === 'fulfilled') setFires(firesData.value || null);
      if (notifsData.status === 'fulfilled') setNotifications(notifsData.value || []);
    } finally {
      setReportsLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    loadWeather(selectedCity);
    loadEarthquakes(minMag, earthquakeFilter);
    loadReportsAndResources();
  }, []);

  const handleCityChange = (cityId) => {
    setSelectedCity(cityId);
    loadWeather(cityId);
  };

  // Metric counts computed directly from real database records
  const activeEmergenciesCount = citizenReports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed').length;
  const criticalAlertsCount = citizenReports.filter(r => r.severity === 'Critical').length + (alerts?.alerts?.length || 0);
  const nearbyHazardsCount = earthquakes.length + (fires?.hotspots?.length || 0);
  const mySOSCount = citizenReports.filter(r => r.source === 'SOS Distress').length;

  const filteredReports = citizenReports.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.tracking_id?.toLowerCase().includes(q) ||
      r.emergency_type?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Citizen Operations Hub
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Ground-level disaster surveillance, meteorological feeds, and situational safety coordination.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents or locations..."
              className="pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-pastel-border focus:border-[#5278E8] outline-none text-slate-800 w-48 sm:w-64 transition"
            />
          </div>

          <button
            onClick={() => {
              loadWeather(selectedCity);
              loadEarthquakes(minMag, earthquakeFilter);
              loadReportsAndResources();
            }}
            className="p-2 rounded-xl bg-white border border-pastel-border text-slate-600 hover:text-[#5278E8] hover:bg-indigo-50/50 shadow-xs transition"
            title="Refresh feeds"
          >
            <RefreshCw className={`w-4 h-4 ${reportsLoading || weatherLoading ? 'animate-spin text-[#5278E8]' : ''}`} />
          </button>

          <button
            onClick={() => setActivePage('report')}
            className="px-3.5 py-2 rounded-xl bg-[#5278E8] text-white text-xs font-bold shadow-soft hover:bg-[#4365D0] transition hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* 4 STATISTIC CARDS (Ground Truth From Live DB & APIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Emergencies */}
        <div className="pastel-card p-5 border-l-4 border-l-[#5278E8] hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Emergencies</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5278E8] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{activeEmergenciesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Verified in Database</span>
            <span>• Ground reports</span>
          </div>
        </div>

        {/* Card 2: Critical Alerts */}
        <div className="pastel-card p-5 border-l-4 border-l-rose-500 hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">{criticalAlertsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            High-severity priority incidents
          </div>
        </div>

        {/* Card 3: Nearby Hazards */}
        <div className="pastel-card p-5 border-l-4 border-l-amber-500 hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seismic & Fire Telemetry</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{nearbyHazardsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            USGS earthquakes + NASA FIRMS
          </div>
        </div>

        {/* Card 4: SOS Requests */}
        <div className="pastel-card p-5 border-l-4 border-l-purple-500 hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active SOS Requests</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-700 mt-2">{mySOSCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            GPS distress transmissions
          </div>
        </div>
      </div>

      {/* Main Grid: Weather Telemetry + Live Seismic Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather Card (Open-Meteo) - 5 Cols */}
        <div className="lg:col-span-5 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-5 h-5 text-[#5278E8]" />
              <h3 className="font-bold text-slate-900 text-sm">Open-Meteo Meteorology</h3>
            </div>
            {/* City Selector */}
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-50 border border-pastel-border text-slate-800 outline-none focus:border-[#5278E8]"
            >
              {INDIAN_CITIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {weather ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <div className="text-3xl font-black text-slate-900">{weather.temperature}°C</div>
                  <div className="text-xs font-bold text-[#5278E8] mt-0.5">{weather.weather_condition}</div>
                  <div className="text-[11px] text-slate-500">{weather.location}</div>
                </div>
                <div className="text-right space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-end space-x-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rain: {weather.precipitation} mm</span>
                  </div>
                  <div className="flex items-center justify-end space-x-1">
                    <Wind className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Wind: {weather.wind_speed} km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Humidity: {weather.relative_humidity || 65}%
                  </div>
                </div>
              </div>

              {/* 5-Day Precipitation & Risk Forecast */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  5-Day Precipitation & Risk Forecast
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {weather.forecast_daily?.slice(0, 5).map((f, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-pastel-border text-slate-700">
                      <div className="text-[10px] font-bold text-slate-500">{f.date?.slice(5) || `D+${idx+1}`}</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-1">{Math.round(f.max_temp)}°</div>
                      <div className="text-[10px] text-blue-600 font-semibold">{f.precip_sum || 0}mm</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                <span>Attribution: {weather.attribution}</span>
                <span>Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              {weatherLoading ? 'Fetching meteorological telemetry...' : 'Weather data temporarily unavailable'}
            </div>
          )}
        </div>

        {/* USGS Earthquake Monitor - 7 Cols */}
        <div className="lg:col-span-7 pastel-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">USGS Seismic Hazards Live Feed</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-xl border border-pastel-border text-xs">
                {['all', 'india'].map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      setEarthquakeFilter(r);
                      loadEarthquakes(minMag, r);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] capitalize transition ${
                      earthquakeFilter === r
                        ? 'bg-[#5278E8] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'india' ? 'South Asia Zone' : 'Global (M2.5+)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Earthquakes List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {earthquakes.slice(0, 6).map((eq) => {
              const mag = eq.magnitude || 0;
              const isCritical = mag >= 6.0;
              const isHigh = mag >= 4.5 && mag < 6.0;

              return (
                <div 
                  key={eq.id}
                  className="p-3 rounded-xl bg-white border border-pastel-border hover:border-amber-200 hover:shadow-xs transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                          : isHigh 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      M{mag.toFixed(1)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{eq.place}</h4>
                      <p className="text-[10px] text-slate-500">
                        Depth: {eq.depth_km} km • {eq.time_iso?.slice(0, 16).replace('T', ' ')} UTC
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical 
                          ? 'bg-rose-50 text-rose-700' 
                          : isHigh 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {eq.severity || 'Moderate'}
                    </span>
                    {eq.in_south_asia && (
                      <span className="block text-[9px] font-bold text-indigo-600 mt-0.5">
                        Plate Boundary
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {earthquakes.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                {earthquakesLoading ? 'Polling USGS GeoJSON telemetry...' : 'No seismic tremors detected in this filter.'}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
            <span>Source: U.S. Geological Survey (USGS)</span>
            <button
              onClick={() => setActivePage('map')}
              className="text-[#5278E8] font-bold hover:underline flex items-center gap-1"
            >
              <span>View On Interactive Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Live Citizen Reports + Emergency Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Citizen Reports Feed - 7 Cols */}
        <div className="lg:col-span-7 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-sm">Ground Incidents & Distress Queue</h3>
            </div>
            <span className="text-xs font-bold text-[#5278E8] bg-indigo-50 px-2.5 py-1 rounded-xl">
              {filteredReports.length} Active Records
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredReports.map((report) => (
              <div 
                key={report.id}
                className="p-4 rounded-2xl bg-white border border-pastel-border hover:shadow-soft transition-all space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{report.emergency_type}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {report.tracking_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{report.location}</span>
                    </p>
                  </div>

                  <span 
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      report.severity === 'Critical' 
                        ? 'bg-rose-100 text-rose-700' 
                        : report.severity === 'High' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.description}
                </p>

                {report.ai_summary && (
                  <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 flex items-start space-x-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#5278E8] flex-shrink-0 mt-0.5" />
                    <span><strong>AI Triage:</strong> {report.ai_summary}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-600">Status: {report.status}</span>
                    <span>• {report.affected_count} people affected</span>
                  </div>
                  <button
                    onClick={() => setActivePage('track')}
                    className="font-bold text-[#5278E8] hover:underline"
                  >
                    Track Progress →
                  </button>
                </div>
              </div>
            ))}

            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No active incidents found matching the search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Verified Emergency Resources - 5 Cols */}
        <div className="lg:col-span-5 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Verified Emergency Resources</h3>
            </div>
            <button
              onClick={() => setActivePage('resources')}
              className="text-xs font-bold text-[#5278E8] hover:underline"
            >
              View All ({resources.length})
            </button>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {resources.slice(0, 5).map((res) => (
              <div 
                key={res.id}
                className="p-3.5 rounded-xl bg-white border border-pastel-border hover:border-emerald-200 transition space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{res.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-500">{res.category} • {res.location}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {res.availability}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Capacity: {res.current_occupancy} / {res.capacity} units</span>
                  {res.contact && (
                    <a href={`tel:${res.contact}`} className="font-bold text-[#5278E8] flex items-center gap-1 hover:underline">
                      <PhoneCall className="w-3 h-3" />
                      <span>{res.contact}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActivePage('map')}
              className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#5278E8] font-bold text-xs transition text-center"
            >
              Locate Nearby Hospitals & Shelters on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
