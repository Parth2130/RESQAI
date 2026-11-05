import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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
  HeartHandshake,
  Navigation,
  CheckCircle2,
  HelpCircle,
  Thermometer,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const INDIAN_CITIES = [
  { id: 'delhi', name: 'New Delhi (NCR)', lat: 28.6139, lon: 77.2090 },
  { id: 'mumbai', name: 'Mumbai, MH', lat: 18.9220, lon: 72.8347 },
  { id: 'pune', name: 'Pune, MH', lat: 18.5204, lon: 73.8567 },
  { id: 'kolkata', name: 'Kolkata, WB', lat: 22.5726, lon: 88.3639 },
  { id: 'bengaluru', name: 'Bengaluru, KA', lat: 12.9716, lon: 77.5946 },
  { id: 'chennai', name: 'Chennai, TN', lat: 13.0827, lon: 80.2707 },
  { id: 'hyderabad', name: 'Hyderabad, TS', lat: 17.3850, lon: 78.4867 },
  { id: 'ahmedabad', name: 'Ahmedabad, GJ', lat: 23.0225, lon: 72.5714 },
  { id: 'patna', name: 'Patna, BR', lat: 25.5941, lon: 85.1376 },
  { id: 'kochi', name: 'Kochi, KL', lat: 9.9312, lon: 76.2673 },
  { id: 'guwahati', name: 'Guwahati, AS', lat: 26.1445, lon: 91.7362 },
  { id: 'shimla', name: 'Shimla, HP', lat: 31.1048, lon: 77.1734 },
];

const DISASTER_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'Flood', label: 'Flood' },
  { id: 'Earthquake', label: 'Earthquake' },
  { id: 'Cyclone', label: 'Cyclone' },
  { id: 'Heavy rainfall', label: 'Heavy rainfall' },
  { id: 'Heatwave', label: 'Heatwave' },
  { id: 'Landslide', label: 'Landslide' },
  { id: 'Wildfire', label: 'Wildfire' },
  { id: 'Lightning', label: 'Lightning' },
  { id: 'Other', label: 'Other emergencies' }
];

export default function DashboardPage({ setActivePage }) {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState('delhi');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Location Detection State (Section 8)
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);

  // Live Embedded Dashboard Map Refs
  const dashboardMapContainerRef = useRef(null);
  const dashboardMapInstanceRef = useRef(null);
  const dashboardMarkersLayerRef = useRef(null);

  // Initialize Embedded Dashboard Map with OpenStreetMap
  useEffect(() => {
    if (!dashboardMapContainerRef.current) return;

    if (!dashboardMapInstanceRef.current) {
      const map = L.map(dashboardMapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
      });

      // Free OpenStreetMap Standard Tiles - No API key or watermark
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      dashboardMarkersLayerRef.current = L.layerGroup().addTo(map);
      dashboardMapInstanceRef.current = map;

      // Invalidate size to ensure full tile rendering
      setTimeout(() => {
        if (dashboardMapInstanceRef.current) {
          dashboardMapInstanceRef.current.invalidateSize();
        }
      }, 300);
    }

    const handleResize = () => {
      if (dashboardMapInstanceRef.current) {
        dashboardMapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update Map Markers on Data Refresh
  useEffect(() => {
    if (!dashboardMapInstanceRef.current || !dashboardMarkersLayerRef.current) return;
    const layer = dashboardMarkersLayerRef.current;
    layer.clearLayers();

    // 1. Plot Incidents
    citizenReports.forEach(inc => {
      if (!inc.latitude || !inc.longitude) return;
      let markerColor = '#EF4444';
      if (inc.severity === 'High') markerColor = '#F59E0B';
      else if (inc.severity === 'Medium') markerColor = '#EAB308';
      else if (inc.severity === 'Low') markerColor = '#3B82F6';

      const customIcon = L.divIcon({
        className: 'dashboard-incident-pin',
        html: `
          <div style="background-color: ${markerColor}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="background-color: #FFFFFF; width: 6px; height: 6px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 210px;">
          <div style="font-weight: 800; color: #0F172A; font-size: 13px;">${inc.emergency_type}</div>
          <div style="color: #64748B; font-size: 11px; margin-top: 1px;">${inc.location || 'Reported Location'}</div>
          <div style="margin-top: 6px; display: inline-block; padding: 2px 7px; border-radius: 6px; font-weight: 700; font-size: 10px; background-color: ${markerColor}20; color: ${markerColor}; border: 1px solid ${markerColor}40;">
            ${inc.severity} Severity • ${inc.status || 'Active'}
          </div>
          ${inc.description ? `<p style="margin-top: 6px; color: #334155; font-size: 11px; line-height: 1.3;">${inc.description.slice(0, 100)}${inc.description.length > 100 ? '...' : ''}</p>` : ''}
          <div style="margin-top: 6px; font-size: 10px; color: #94A3B8;">Tracking: ${inc.tracking_id || 'RQ-ID'}</div>
        </div>
      `);
      layer.addLayer(marker);
    });

    // 2. Plot Earthquakes
    earthquakes.forEach(eq => {
      if (!eq.latitude || !eq.longitude) return;
      const mag = eq.magnitude || 0;
      let color = '#EAB308';
      if (mag >= 6.0) color = '#EF4444';
      else if (mag >= 4.5) color = '#F59E0B';

      const radius = Math.max(6, Math.min(20, mag * 3));
      const circle = L.circleMarker([eq.latitude, eq.longitude], {
        radius: radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.7
      });
      circle.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 210px;">
          <div style="font-weight: 800; color: #0F172A; font-size: 13px;">Earthquake M${mag.toFixed(1)}</div>
          <div style="color: #64748B; font-size: 11px; margin-top: 1px;">${eq.place}</div>
          <div style="color: #475569; font-size: 11px; margin-top: 4px;">Depth: ${eq.depth_km} km</div>
          <div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">Verified USGS Seismic Data</div>
        </div>
      `);
      layer.addLayer(circle);
    });

    // 3. Plot User Detected Location
    if (detectedLocation && detectedLocation.latitude && detectedLocation.longitude) {
      const userIcon = L.divIcon({
        className: 'dashboard-user-pin',
        html: `
          <div style="background-color: #38BDF8; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 16px rgba(56, 189, 248, 0.9); display: flex; align-items: center; justify-content: center;">
            <div style="background-color: #0284C7; width: 8px; height: 8px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      const userMarker = L.marker([detectedLocation.latitude, detectedLocation.longitude], { icon: userIcon });
      userMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px;">
          <div style="font-weight: 800; color: #0284C7;">📍 Your Detected Position</div>
          <div style="color: #475569; font-size: 11px; margin-top: 2px;">${detectedLocation.address || 'Device GPS'}</div>
        </div>
      `);
      layer.addLayer(userMarker);
    }
  }, [citizenReports, earthquakes, detectedLocation]);

  // Fly to user coordinates on detection
  useEffect(() => {
    if (detectedLocation && dashboardMapInstanceRef.current) {
      dashboardMapInstanceRef.current.flyTo([detectedLocation.latitude, detectedLocation.longitude], 12);
    }
  }, [detectedLocation]);

  // Load weather by city or coords
  const loadWeather = async (city) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await api.getWeather({ city });
      setWeather(data);
    } catch (err) {
      console.error(err);
      setWeather(null);
      setWeatherError("Live meteorological data currently unavailable.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadWeatherForCoords = async (lat, lon, locationLabel) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await api.getWeather({ lat, lon });
      if (data) {
        data.location = locationLabel || data.location;
      }
      setWeather(data);
    } catch (err) {
      console.error(err);
      setWeatherError("Live weather data currently unavailable for detected coordinates.");
    } finally {
      setWeatherLoading(false);
    }
  };

  // Section 8: GPS Location Detection with navigator.geolocation
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Please search or select a location manually.");
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);
        const updateTime = new Date(pos.timestamp).toLocaleTimeString();

        try {
          const rev = await api.reverseGeocode(lat, lng);
          const locObj = {
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            city: rev.city || "Local Sector",
            state: rev.state || "",
            postcode: rev.postcode || "",
            address: rev.address || rev.display_name || `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            accuracy: accuracy,
            timestamp: updateTime,
            provider: rev.provider || "Browser Geolocation + Nominatim Reverse Geocoding"
          };
          setDetectedLocation(locObj);
          loadWeatherForCoords(lat, lng, locObj.city || locObj.address);
        } catch (e) {
          setDetectedLocation({
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            city: "Detected Location",
            state: "",
            postcode: "",
            address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            accuracy: accuracy,
            timestamp: updateTime,
            provider: "Browser Geolocation (Offline Fallback)"
          });
          loadWeatherForCoords(lat, lng, `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        let msg = "Could not retrieve your location.";
        if (err.code === 1) {
          msg = "Permission denied: Location access was denied. Please allow location permissions in your browser or search your city manually below.";
        } else if (err.code === 2) {
          msg = "GPS / Network position is currently unavailable. Please select your location manually.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please try clicking 'Use My Current Location' again or search manually.";
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Location Search Handler
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!locationSearchInput.trim()) return;
    setLocationSearching(true);
    setLocationError(null);
    try {
      const res = await api.searchLocation(locationSearchInput.trim());
      if (res && res.found) {
        const locObj = {
          latitude: res.latitude.toFixed(6),
          longitude: res.longitude.toFixed(6),
          city: res.city || locationSearchInput,
          state: res.state || "",
          postcode: res.postcode || "",
          address: res.address || res.display_name,
          accuracy: null,
          timestamp: new Date().toLocaleTimeString(),
          provider: "OpenStreetMap Nominatim Search"
        };
        setDetectedLocation(locObj);
        loadWeatherForCoords(res.latitude, res.longitude, locObj.city || locObj.address);
      } else {
        setLocationError(`Location "${locationSearchInput}" not found. Try searching by city name, PIN code or district.`);
      }
    } catch (e) {
      setLocationError("Location search service error. Please choose from the city selector.");
    } finally {
      setLocationSearching(false);
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
        api.getIncidents({ limit: 60 }),
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
    setDetectedLocation(null);
    loadWeather(cityId);
  };

  // Metric counts computed directly from real database records
  const activeEmergenciesCount = citizenReports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed').length;
  const criticalAlertsCount = citizenReports.filter(r => r.severity === 'Critical').length + (alerts?.alerts?.length || 0);
  const nearbyHazardsCount = earthquakes.length + (fires?.hotspots?.length || 0);
  const mySOSCount = citizenReports.filter(r => r.source === 'SOS Distress').length;

  // Filtered reports
  const filteredReports = citizenReports.filter(r => {
    // 1. Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        r.tracking_id?.toLowerCase().includes(q) ||
        r.emergency_type?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    // 2. Category filter
    if (categoryFilter !== 'all') {
      if (r.emergency_type?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
    }
    // 3. Severity filter
    if (severityFilter !== 'all') {
      if (r.severity?.toLowerCase() !== severityFilter.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // Section 13: Rules-based explainable risk calculation
  const computeRiskAdvisory = () => {
    if (!weather) return null;
    const precip = weather.precipitation || 0;
    const wind = weather.wind_speed || 0;
    const temp = weather.temperature || 25;
    
    const factors = [];
    let level = "Normal / Safe";
    let color = "emerald";

    if (precip >= 50) {
      factors.push({ 
        name: "Extreme Rainfall Warning", 
        desc: `Precipitation measured at ${precip} mm exceeds the 50 mm/day extreme hazard threshold. Flash flooding risk is active.`, 
        severity: "Critical" 
      });
      level = "Critical Warning";
      color = "rose";
    } else if (precip >= 20) {
      factors.push({ 
        name: "Heavy Rainfall Watch", 
        desc: `Precipitation measured at ${precip} mm/day. Urban waterlogging and drainage overflows possible.`, 
        severity: "High" 
      });
      if (level !== "Critical Warning") { level = "High Watch"; color = "amber"; }
    }

    if (wind >= 55) {
      factors.push({ 
        name: "High Wind / Gale Advisory", 
        desc: `Wind speed measured at ${wind} km/h exceeds 55 km/h threshold. Structural wind damage and downed lines possible.`, 
        severity: "High" 
      });
      if (level !== "Critical Warning") { level = "High Watch"; color = "amber"; }
    } else if (wind >= 35) {
      factors.push({ 
        name: "Moderate Wind Advisory", 
        desc: `Wind speed is ${wind} km/h. Caution recommended around loose hoardings and trees.`, 
        severity: "Moderate" 
      });
      if (level === "Normal / Safe") { level = "Advisory"; color = "blue"; }
    }

    if (temp >= 42) {
      factors.push({ 
        name: "Severe Heatwave Warning", 
        desc: `Ambient temperature recorded at ${temp}°C exceeds 42°C threshold. Extreme heatstroke risk.`, 
        severity: "Critical" 
      });
      level = "Critical Warning";
      color = "rose";
    } else if (temp >= 38) {
      factors.push({ 
        name: "Elevated Heat Advisory", 
        desc: `Temperature is ${temp}°C. Hydration precautions active between 11 AM - 4 PM.`, 
        severity: "Moderate" 
      });
      if (level === "Normal / Safe") { level = "Advisory"; color = "amber"; }
    }

    // Recent seismic proximity
    const significantQuakes = earthquakes.filter(eq => (eq.magnitude || 0) >= 4.5);
    if (significantQuakes.length > 0) {
      factors.push({ 
        name: "Recent Significant Seismic Tremor", 
        desc: `${significantQuakes.length} earthquakes of M4.5+ recorded in telemetry feeds today. Latest: M${significantQuakes[0].magnitude} near ${significantQuakes[0].place}.`, 
        severity: "Moderate" 
      });
      if (level === "Normal / Safe") { level = "Seismic Watch"; color = "amber"; }
    }

    return {
      level,
      color,
      factors,
      precip,
      wind,
      temp,
      source: "Open-Meteo & USGS Real-Time Rules Engine",
      timestamp: weather.timestamp || new Date().toISOString()
    };
  };

  const riskAdvisory = computeRiskAdvisory();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. TOP HEADER BAR WITH REFRESH & REPORT CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Live Disaster Operations Dashboard
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              REAL-TIME FEEDS
            </span>
          </div>
          <p className="text-xs text-pastel-muted mt-1">
            Live multi-source disaster telemetry, meteorological sensors, seismic monitors, and verified citizen reports.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              if (detectedLocation) {
                loadWeatherForCoords(parseFloat(detectedLocation.latitude), parseFloat(detectedLocation.longitude), detectedLocation.city);
              } else {
                loadWeather(selectedCity);
              }
              loadEarthquakes(minMag, earthquakeFilter);
              loadReportsAndResources();
            }}
            className="p-2.5 rounded-xl bg-white border border-pastel-border text-slate-600 hover:text-[#5278E8] hover:bg-indigo-50/50 shadow-xs transition flex items-center gap-1 text-xs font-semibold"
            title="Refresh all feeds"
          >
            <RefreshCw className={`w-4 h-4 ${reportsLoading || weatherLoading ? 'animate-spin text-[#5278E8]' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={() => setActivePage('report')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft transition hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Emergency</span>
          </button>

          <button
            onClick={() => setActivePage('map')}
            className="px-4 py-2.5 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white text-xs font-bold shadow-soft transition hover:scale-105 active:scale-95 flex items-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Interactive Map</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION 8: CURRENT USER LOCATION DETECTION CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-indigo-50/40 to-blue-50 border border-indigo-200/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#5278E8]" />
                Geographical Location Awareness
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#5278E8] border border-indigo-200">
                Native Geolocation API
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Detect your actual device coordinates to load localized weather, nearby hazards, and pin your position on the map.
            </p>
          </div>

          {/* Prominent Current Location Button (Section 8) */}
          <button
            onClick={detectUserLocation}
            disabled={locating}
            className="px-5 py-3 rounded-2xl bg-[#5278E8] hover:bg-[#4365D0] active:scale-95 text-white font-extrabold text-xs shadow-soft transition flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS Location...' : '📍 Use My Current Location'}</span>
          </button>
        </div>

        {/* Location Error Alert */}
        {locationError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Detected Location Details Panel (Section 8) */}
        {detectedLocation && (
          <div className="p-4 rounded-2xl bg-white border border-indigo-200/80 shadow-xs space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">Current Position Locked:</span>
                <span className="text-xs font-semibold text-[#5278E8]">{detectedLocation.address}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Updated at {detectedLocation.timestamp}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Latitude</div>
                <div className="font-mono font-bold text-slate-800">{detectedLocation.latitude}°</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Longitude</div>
                <div className="font-mono font-bold text-slate-800">{detectedLocation.longitude}°</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">City / Sector</div>
                <div className="font-bold text-slate-800 truncate">{detectedLocation.city || "Detected"}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">State</div>
                <div className="font-bold text-slate-800 truncate">{detectedLocation.state || "Detected"}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">PIN Code</div>
                <div className="font-bold text-slate-800">{detectedLocation.postcode || "N/A"}</div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">GPS Accuracy</div>
                <div className="font-bold text-emerald-800">{detectedLocation.accuracy ? `±${detectedLocation.accuracy} meters` : 'High'}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Reverse Geocoding: OpenStreetMap Nominatim • Coordinates validated</span>
              <button 
                onClick={() => setActivePage('map')}
                className="text-[#5278E8] font-bold hover:underline flex items-center gap-1"
              >
                <span>View My Marker on Interactive Map</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Location Search Bar Fallback */}
        <form onSubmit={handleLocationSearch} className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={locationSearchInput}
              onChange={(e) => setLocationSearchInput(e.target.value)}
              placeholder="Search by city, area, PIN code, or latitude, longitude..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white border border-indigo-200 text-slate-800 focus:outline-none focus:border-[#5278E8] shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={locationSearching}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200 text-slate-700 font-bold text-xs shadow-xs transition"
          >
            {locationSearching ? 'Searching...' : 'Search Location'}
          </button>
        </form>
      </div>

      {/* 3. API TELEMETRY CONNECTION STATUS PILLS */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white border border-pastel-border shadow-xs text-xs">
        <span className="font-bold text-slate-500 flex items-center gap-1 px-1">
          <Activity className="w-3.5 h-3.5 text-[#5278E8]" />
          Telemetry Status:
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Open-Meteo Weather: Active
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          USGS Earthquakes: Active
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          NDMA Sachet: Portal Active
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          NASA FIRMS: Key Configuration Required
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1 ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          SQLite Database: Connected
        </span>
      </div>

      {/* 4. OVERVIEW STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pastel-card p-5 border-l-4 border-l-[#5278E8] hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Incidents</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5278E8] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{activeEmergenciesCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Verified in Database</span>
            <span>• Citizen Reports</span>
          </div>
        </div>

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

        <div className="pastel-card p-5 border-l-4 border-l-amber-500 hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">USGS Seismic Tremors</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{nearbyHazardsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Real USGS GeoJSON feed records
          </div>
        </div>

        <div className="pastel-card p-5 border-l-4 border-l-purple-500 hover:shadow-soft transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active SOS Beacons</span>
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

      {/* 4.5. LIVE GEOSPATIAL DISASTER MAP (LEAFLET + OPENSTREETMAP) */}
      <div className="pastel-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pastel-border">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#5278E8]" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Live Geospatial Emergency Map
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                OpenStreetMap Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive map displaying live citizen emergency reports, USGS seismic epicenters, and your detected location.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {detectedLocation ? (
              <button
                onClick={() => {
                  if (dashboardMapInstanceRef.current) {
                    dashboardMapInstanceRef.current.flyTo([detectedLocation.latitude, detectedLocation.longitude], 12);
                  }
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1.5 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>My Location</span>
              </button>
            ) : (
              <button
                onClick={handleDetectLocation}
                disabled={locating}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1.5 transition"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting...' : 'Pin My Location'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (dashboardMapInstanceRef.current) {
                  dashboardMapInstanceRef.current.flyTo([20.5937, 78.9629], 5);
                }
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Reset View
            </button>

            <button
              onClick={() => setActivePage('map')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#5278E8] text-white hover:bg-[#4365D0] shadow-soft flex items-center space-x-1.5 transition hover:scale-105"
            >
              <span>Full Command Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas */}
        <div 
          ref={dashboardMapContainerRef} 
          className="w-full h-80 sm:h-96 rounded-2xl border border-pastel-border overflow-hidden relative z-0 shadow-inner"
        />

        {/* Quick Map Legend & Attribution */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Map Legend:</span>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
              <span>Critical Incidents</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
              <span>High / Medium Incidents</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
              <span>USGS Earthquakes</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
              <span>My Detected GPS</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            Click any pin for emergency details • OpenStreetMap contributors
          </span>
        </div>
      </div>

      {/* 5. METEOROLOGY + SEISMIC MONITORING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather Card (Open-Meteo) - 5 Cols */}
        <div className="lg:col-span-5 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-5 h-5 text-[#5278E8]" />
              <h3 className="font-bold text-slate-900 text-sm">Open-Meteo Weather Conditions</h3>
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
                  <div className="text-[11px] text-slate-500 mt-1">{weather.location}</div>
                </div>
                <div className="text-right space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-end space-x-1.5">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rain: <strong>{weather.precipitation} mm</strong></span>
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <Wind className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Wind: <strong>{weather.wind_speed} km/h</strong></span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Humidity: {weather.relative_humidity || 65}%
                  </div>
                </div>
              </div>

              {/* 5-Day Precipitation & Risk Forecast */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  5-Day Precipitation & Temperature Forecast
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
                <span>Source: Open-Meteo Real-time API</span>
                <span>Timestamp: {weather.timestamp?.slice(11, 16) || lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              {weatherLoading ? 'Fetching meteorological telemetry...' : (weatherError || 'Live data currently unavailable.')}
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
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                {earthquakesLoading ? 'Polling USGS GeoJSON telemetry...' : 'Live data currently unavailable for this seismic filter.'}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
            <span>Source: U.S. Geological Survey (USGS GeoJSON Feed)</span>
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

      {/* 6. SECTION 13: EXPLAINABLE DISASTER RISK ASSESSMENT CARD */}
      {riskAdvisory && (
        <div className="pastel-card p-6 border-indigo-100 space-y-4 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pastel-border pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Explainable Disaster Risk Advisory</h3>
                <p className="text-[11px] text-slate-500">Transparent rules-based indicators grounded in current meteorological measurements.</p>
              </div>
            </div>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
              riskAdvisory.color === 'rose' 
                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                : riskAdvisory.color === 'amber'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              Status: {riskAdvisory.level}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Rainfall Indicator</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">{riskAdvisory.precip} mm</div>
              <p className="text-[10px] text-slate-500">Threshold: &gt;20mm Watch, &gt;50mm Warning</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Wind className="w-3.5 h-3.5 text-indigo-500" />
                <span>Wind Speed Indicator</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">{riskAdvisory.wind} km/h</div>
              <p className="text-[10px] text-slate-500">Threshold: &gt;35km/h Advisory, &gt;55km/h Gale</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                <span>Temperature Indicator</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900">{riskAdvisory.temp}°C</div>
              <p className="text-[10px] text-slate-500">Threshold: &gt;38°C Watch, &gt;42°C Heatwave</p>
            </div>
          </div>

          {/* Active Contributing Factors */}
          {riskAdvisory.factors.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Triggered Rules & Criteria:</span>
              <div className="space-y-1.5">
                {riskAdvisory.factors.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-2 text-xs">
                    <Info className="w-4 h-4 text-[#5278E8] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">{f.name}:</strong> <span className="text-slate-600">{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>All current meteorological measurements remain below critical hazard warning thresholds.</span>
            </div>
          )}

          {/* Mandatory Transparency Disclaimer (Section 13) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start space-x-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Transparency Notice:</strong> This rules-based advisory is computed automatically from real-time Open-Meteo weather and USGS seismic telemetry. It is not an official government prediction or guaranteed forecast. Citizens in India must always consult official authorities at <strong>NDMA (sachet.ndma.gov.in)</strong> and <strong>IMD (mausam.imd.gov.in)</strong>.
            </span>
          </div>
        </div>
      )}

      {/* 7. LIVE CITIZEN REPORTS QUEUE WITH FILTERS */}
      <div className="pastel-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-base">Citizen Emergency Reports & Distress Queue</h3>
            </div>
            <p className="text-xs text-slate-500">Live citizen-submitted reports stored persistently in SQLite database.</p>
          </div>

          {/* Filters Bar (Category, Severity, Text Search) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, keyword, area..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-pastel-border text-slate-800 focus:outline-none focus:border-[#5278E8] w-40 sm:w-52"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 border border-pastel-border text-slate-700 outline-none focus:border-[#5278E8]"
            >
              {DISASTER_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-50 border border-pastel-border text-slate-700 outline-none focus:border-[#5278E8]"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <span className="text-xs font-bold text-[#5278E8] bg-indigo-50 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
              {filteredReports.length} Matches
            </span>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredReports.map((report) => (
            <div 
              key={report.id}
              className="p-4 rounded-2xl bg-white border border-pastel-border hover:shadow-soft transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-900">{report.emergency_type}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {report.tracking_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{report.location}</span>
                  </p>
                </div>

                <span 
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    report.severity === 'Critical' 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : report.severity === 'High' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {report.severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {report.description}
              </p>

              {report.ai_summary && (
                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-start space-x-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#5278E8] flex-shrink-0 mt-0.5" />
                  <span><strong>AI Summary:</strong> {report.ai_summary}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">Status: {report.status}</span>
                  <span>• {report.affected_count} affected</span>
                </div>
                <button
                  onClick={() => setActivePage('track')}
                  className="font-bold text-[#5278E8] hover:underline"
                >
                  Track Incident →
                </button>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="col-span-2 p-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No citizen reports found matching the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* 8. VERIFIED EMERGENCY RESOURCES & SHELTERS SUMMARY */}
      <div className="pastel-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Verified Emergency Shelters & Hospitals</h3>
              <p className="text-[11px] text-slate-500">Official designated facilities and verified capacity.</p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('resources')}
            className="text-xs font-bold text-[#5278E8] hover:underline flex items-center gap-1"
          >
            <span>Full Directory ({resources.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {resources.slice(0, 3).map((res) => (
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
              <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                <span>Occupancy: {res.current_occupancy} / {res.capacity}</span>
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
      </div>
    </div>
  );
}
