import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Navigation, 
  AlertTriangle, 
  Activity, 
  CloudRain, 
  Search, 
  RefreshCw,
  Info,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

// Regional presets across India
const INDIA_PRESETS = [
  { name: 'National Overview', coords: [22.5, 78.9], zoom: 5 },
  { name: 'Northern / Delhi NCR', coords: [28.6139, 77.2090], zoom: 9 },
  { name: 'Western / Mumbai & Pune', coords: [18.75, 73.4], zoom: 8 },
  { name: 'Southern / Bengaluru & Chennai', coords: [13.0, 78.5], zoom: 8 },
  { name: 'Eastern / Kolkata & Bay', coords: [22.5, 88.3], zoom: 8 },
  { name: 'Himalayan Seismic Belt', coords: [31.5, 78.0], zoom: 7 },
  { name: 'Andaman & Nicobar Trench', coords: [11.5, 92.7], zoom: 7 },
];

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [earthquakes, setEarthquakes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layer Toggles
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');

  // User location state
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet Map centered on India
      const map = L.map(mapContainerRef.current, {
        center: [22.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
      });

      // CartoDB Dark Matter tiles for professional dark-mode emergency control room look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // cleanup on unmount
    };
  }, []);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, repRes] = await Promise.allSettled([
        api.getEarthquakes({ minMag: 2.5, region: 'all' }),
        api.getReports()
      ]);

      if (eqRes.status === 'fulfilled') {
        setEarthquakes(eqRes.value.earthquakes || []);
      }
      if (repRes.status === 'fulfilled') {
        setReports(repRes.value || []);
      }
    } catch (err) {
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Render Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // 1. Plot Earthquakes
    if (showEarthquakes) {
      earthquakes.forEach((eq) => {
        const isSevere = eq.magnitude >= 6.0;
        const isModerate = eq.magnitude >= 4.5;
        const color = isSevere ? '#EF4444' : isModerate ? '#F59E0B' : '#EAB308';
        const radius = Math.max(6, Math.min(22, eq.magnitude * 2.8));

        const circle = L.circleMarker([eq.latitude, eq.longitude], {
          radius: radius,
          fillColor: color,
          color: '#FFFFFF',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.65,
        });

        const popupContent = `
          <div style="font-family: inherit; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="background: ${color}; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
                M${eq.magnitude}
              </span>
              <span style="font-size: 10px; color: #94A3B8; font-family: monospace;">USGS Seismic</span>
            </div>
            <strong style="color: #F8FAFC; font-size: 13px; display: block; margin-bottom: 4px;">${eq.place}</strong>
            <div style="font-size: 11px; color: #CBD5E1; line-height: 1.5;">
              <div>Depth: <strong>${eq.depth_km} km</strong></div>
              <div>Severity: <strong style="color: ${color};">${eq.severity}</strong></div>
              <div>Time: ${new Date(eq.time).toLocaleString()}</div>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155;">
              <a href="${eq.url}" target="_blank" style="color: #38BDF8; font-size: 11px; text-decoration: none; font-weight: 600;">
                View USGS Event Details &rarr;
              </a>
            </div>
          </div>
        `;

        circle.bindPopup(popupContent);
        circle.addTo(layer);
      });
    }

    // 2. Plot Citizen Reports
    if (showReports) {
      reports.forEach((rep) => {
        if (!rep.latitude || !rep.longitude) return;

        if (filterSeverity !== 'all' && rep.severity !== filterSeverity) {
          return;
        }

        const isCritical = rep.severity === 'Critical';
        const isHigh = rep.severity === 'High';
        const color = isCritical ? '#EF4444' : isHigh ? '#F59E0B' : '#38BDF8';

        // Custom HTML marker pin with pulsating circle
        const iconHtml = `
          <div style="position: relative; width: 28px; height: 28px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: ${color}; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-resq-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });

        const popupContent = `
          <div style="font-family: inherit; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="background: #1E3A8A; color: #60A5FA; font-weight: 700; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-family: monospace;">
                ${rep.tracking_id}
              </span>
              <span style="background: ${color}; color: #FFFFFF; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
                ${rep.severity}
              </span>
            </div>
            <strong style="color: #F8FAFC; font-size: 13px; display: block; margin-bottom: 4px;">
              ${rep.emergency_type} Emergency
            </strong>
            <p style="font-size: 11px; color: #CBD5E1; margin-bottom: 6px; line-height: 1.4;">
              ${rep.description}
            </p>
            <div style="font-size: 10px; color: #94A3B8; border-top: 1px solid #334155; padding-top: 6px;">
              <div>Location: <strong>${rep.location}</strong></div>
              <div>Status: <strong>${rep.status}</strong> | Affected: <strong>${rep.affected_count} people</strong></div>
              <div style="margin-top: 4px; color: #F87171;">In immediate danger, call 112 directly.</div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(layer);
      });
    }

    // 3. User Current Location Pin (if available)
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#38BDF8',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1,
      });
      userMarker.bindPopup(`
        <div style="font-family: inherit;">
          <strong style="color: #38BDF8;">Your Current Position</strong>
          <p style="font-size: 11px; color: #CBD5E1; margin: 4px 0;">Lat: ${userLocation.lat.toFixed(4)}, Lon: ${userLocation.lng.toFixed(4)}</p>
        </div>
      `);
      userMarker.addTo(layer);
    }
  }, [earthquakes, reports, showEarthquakes, showReports, filterSeverity, userLocation]);

  // Handle jump to region
  const handleJumpTo = (coords, zoom) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.2 });
    }
  };

  // Handle Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
        }
      },
      (err) => {
        setLocating(false);
        setLocationError("Location permission denied or unavailable. Please enable browser location permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-resq-border/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Real-Time Disaster Geospatial Map
            </h1>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Interactive OpenStreetMap plotting verified USGS seismic events and community-submitted incident reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-resq-card hover:bg-resq-cardLight text-slate-200 border border-resq-border hover:border-resq-cyan text-xs font-semibold transition"
          >
            <Navigation className={`w-3.5 h-3.5 text-resq-cyan ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'My Current Location'}</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-resq-card hover:bg-resq-cardLight text-slate-200 border border-resq-border hover:border-resq-cyan text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-resq-cyan ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Markers</span>
          </button>
        </div>
      </div>

      {locationError && (
        <div className="bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs p-3 rounded-xl flex items-center justify-between">
          <span>{locationError}</span>
          <button onClick={() => setLocationError(null)} className="text-slate-400 hover:text-white ml-2">Dismiss</button>
        </div>
      )}

      {/* Map Control Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center glass-panel p-3 rounded-xl border-resq-border">
        {/* Layer Toggles */}
        <div className="md:col-span-5 flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-resq-cyan" /> Layers:
          </span>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showEarthquakes}
              onChange={(e) => setShowEarthquakes(e.target.checked)}
              className="rounded bg-resq-dark border-resq-border text-resq-blue focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              Earthquakes ({earthquakes.length})
            </span>
          </label>

          <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showReports}
              onChange={(e) => setShowReports(e.target.checked)}
              className="rounded bg-resq-dark border-resq-border text-resq-blue focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
              Citizen Reports ({reports.length})
            </span>
          </label>
        </div>

        {/* Severity filter */}
        <div className="md:col-span-3 flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Severity:</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-resq-dark border border-resq-border rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
          </select>
        </div>

        {/* Region Quick Jump */}
        <div className="md:col-span-4 flex items-center space-x-2 text-xs justify-end">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            onChange={(e) => {
              const preset = INDIA_PRESETS.find(p => p.name === e.target.value);
              if (preset) handleJumpTo(preset.coords, preset.zoom);
            }}
            className="bg-resq-dark border border-resq-border rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer w-full max-w-[220px]"
          >
            <option value="">Jump to Subcontinent Region...</option>
            {INDIA_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* The Leaflet Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-resq-border shadow-2xl glass-panel">
        <div
          ref={mapContainerRef}
          className="w-full h-[600px] z-10"
        />

        {/* Map Legend Floating Box */}
        <div className="absolute bottom-6 right-6 z-20 bg-resq-navy/95 border border-resq-border/80 backdrop-blur-md p-3.5 rounded-xl shadow-xl text-xs space-y-2 max-w-[240px]">
          <span className="font-bold text-white text-[11px] uppercase tracking-wider block border-b border-resq-border/60 pb-1">
            Map Legend
          </span>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-glow-red inline-block"></span>
              <span>Critical SOS / M6.0+ Quake</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span>High Severity / M4.5+ Quake</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span>
              <span>Medium SOS / Minor Quake</span>
            </div>
          </div>
          <div className="pt-1 text-[9px] text-slate-500 leading-tight">
            Click any marker to view full incident & telemetry details.
          </div>
        </div>

        {/* Disclaimer Overlay in Map Footer */}
        <div className="absolute top-4 left-4 z-20 bg-resq-navy/90 border border-resq-border/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg text-[10px] text-slate-300 max-w-sm hidden sm:block">
          <span className="text-resq-cyan font-bold">Safety Notice: </span>
          Map displays real telemetry and crowd reports. Does not represent officially cleared evacuation routes. Call 112 in emergencies.
        </div>
      </div>
    </div>
  );
}
