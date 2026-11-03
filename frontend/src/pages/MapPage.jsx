import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  ShieldAlert,
  Building2,
  PhoneCall,
  CheckCircle2,
  Radio,
  Flame,
  ArrowRight,
  Route
} from 'lucide-react';
import { api } from '../services/api';

const INDIA_PRESETS = [
  { name: 'National Overview', coords: [22.5, 78.9], zoom: 5 },
  { name: 'Delhi NCR', coords: [28.6139, 77.2090], zoom: 10 },
  { name: 'Pune & Mumbai', coords: [18.5204, 73.8567], zoom: 10 },
  { name: 'Kolkata & Bengal', coords: [22.5726, 88.3639], zoom: 9 },
  { name: 'Bengaluru & South', coords: [12.9716, 77.5946], zoom: 9 },
  { name: 'Himalayan Belt', coords: [31.5, 78.0], zoom: 7 },
];

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [earthquakes, setEarthquakes] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item detail panel
  const [selectedItem, setSelectedItem] = useState(null);

  // Layer Toggles
  const [showEarthquakes, setShowEarthquakes] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Routing State
  const [routingActive, setRoutingActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  // User location
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Soft light pastel map with CartoDB Positron tiles
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map reference across re-renders
    };
  }, []);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, incRes, resRes] = await Promise.allSettled([
        api.getEarthquakes({ minMag: 2.5, region: 'all' }),
        api.getIncidents({ limit: 100 }),
        api.getResources()
      ]);

      if (eqRes.status === 'fulfilled') setEarthquakes(eqRes.value.earthquakes || []);
      if (incRes.status === 'fulfilled') setIncidents(incRes.value || []);
      if (resRes.status === 'fulfilled') setResources(resRes.value || []);
    } catch (err) {
      console.error("Map fetch error:", err);
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

    // 1. Incidents (Red = Critical, Orange = High, Yellow = Medium, Blue = Info)
    if (showIncidents) {
      incidents.forEach(inc => {
        if (!inc.latitude || !inc.longitude) return;
        if (categoryFilter !== 'all' && inc.emergency_type !== categoryFilter) return;

        let markerColor = '#EF4444'; // Red for Critical
        if (inc.severity === 'High') markerColor = '#F59E0B'; // Orange
        else if (inc.severity === 'Medium') markerColor = '#EAB308'; // Yellow
        else if (inc.severity === 'Low') markerColor = '#3B82F6'; // Blue

        const customIcon = L.divIcon({
          className: 'custom-incident-pin',
          html: `
            <div style="background-color: ${markerColor}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="background-color: #FFFFFF; width: 6px; height: 6px; border-radius: 50%;"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });
        marker.on('click', () => {
          setSelectedItem({
            type: 'incident',
            id: inc.tracking_id,
            emergency_type: inc.emergency_type,
            location: inc.location,
            severity: inc.severity,
            source: inc.source || 'Citizen Report',
            time: inc.created_at,
            status: inc.status,
            description: inc.description,
            affected: inc.affected_count,
            vulnerable: inc.vulnerable_people,
            latitude: inc.latitude,
            longitude: inc.longitude
          });
        });
        layer.addLayer(marker);
      });
    }

    // 2. Earthquakes (USGS)
    if (showEarthquakes) {
      earthquakes.forEach(eq => {
        if (!eq.latitude || !eq.longitude) return;
        const mag = eq.magnitude || 0;
        let color = '#EAB308'; // Yellow
        if (mag >= 6.0) color = '#EF4444'; // Red
        else if (mag >= 4.5) color = '#F59E0B'; // Orange

        const radius = Math.max(7, Math.min(22, mag * 3));
        const circle = L.circleMarker([eq.latitude, eq.longitude], {
          radius: radius,
          fillColor: color,
          color: '#FFFFFF',
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.65
        });

        circle.on('click', () => {
          setSelectedItem({
            type: 'earthquake',
            id: eq.id,
            emergency_type: `Earthquake (M${mag.toFixed(1)})`,
            location: eq.place,
            severity: eq.severity,
            source: 'USGS Earthquake Hazards Program (Verified Seismic)',
            time: eq.time_iso,
            status: 'Recorded',
            description: `Seismic depth: ${eq.depth_km} km. South Asia seismic zone: ${eq.in_south_asia ? 'Yes' : 'No'}.`,
            latitude: eq.latitude,
            longitude: eq.longitude
          });
        });
        layer.addLayer(circle);
      });
    }

    // 3. Resources (Green = Safe Resource)
    if (showResources) {
      resources.forEach(res => {
        if (!res.latitude || !res.longitude) return;

        const resIcon = L.divIcon({
          className: 'custom-resource-pin',
          html: `
            <div style="background-color: #22C55E; width: 22px; height: 22px; border-radius: 8px; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="background-color: #FFFFFF; width: 6px; height: 6px; border-radius: 2px;"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([res.latitude, res.longitude], { icon: resIcon });
        marker.on('click', () => {
          setSelectedItem({
            type: 'resource',
            id: `RES-${res.id}`,
            emergency_type: res.category,
            location: res.location,
            severity: 'Safe Resource',
            source: 'Official Municipal Registry (Verified)',
            time: res.last_updated,
            status: res.availability,
            description: `${res.name}. Capacity: ${res.current_occupancy}/${res.capacity} units. Notes: ${res.notes || 'None'}`,
            contact: res.contact,
            latitude: res.latitude,
            longitude: res.longitude
          });
        });
        layer.addLayer(marker);
      });
    }

    // 4. User Location Pin if present
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="background-color: #38BDF8; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 15px rgba(56, 189, 248, 0.8); display: flex; align-items: center; justify-content: center;">
            <div style="background-color: #0284C7; width: 8px; height: 8px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      layer.addLayer(userMarker);
    }
  }, [incidents, earthquakes, resources, showIncidents, showEarthquakes, showResources, categoryFilter, userLocation]);

  // Locate User
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 13);
        }
        setLocating(false);
      },
      (err) => {
        console.error("Location error:", err);
        alert("Could not access your location. Please check browser permissions.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Plan Hazard-Aware Route between default hub and selected incident
  const handleCalculateRoute = async () => {
    if (!selectedItem || !selectedItem.latitude) {
      alert("Please click an incident on the map first to select destination coordinates.");
      return;
    }

    setRoutingLoading(true);
    try {
      // Origin: Shivaji Nagar Center (Pune) or user location
      const originLat = userLocation?.lat || 18.5314;
      const originLon = userLocation?.lng || 73.8446;
      const destLat = selectedItem.latitude;
      const destLon = selectedItem.longitude;

      const res = await api.planRoute({
        originLat,
        originLon,
        destLat,
        destLon
      });

      setRouteInfo(res);
      setRoutingActive(true);

      // Draw route on map
      if (routeLayerRef.current && res.waypoints) {
        routeLayerRef.current.clearLayers();
        const polyline = L.polyline(res.waypoints, {
          color: res.verified_safe ? '#22C55E' : '#5278E8',
          weight: 5,
          opacity: 0.85,
          dashArray: res.hazards_nearby?.length ? '8, 8' : undefined
        });
        routeLayerRef.current.addLayer(polyline);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
      }
    } catch (err) {
      alert("Failed to compute route: " + err.message);
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleClearRoute = () => {
    if (routeLayerRef.current) {
      routeLayerRef.current.clearLayers();
    }
    setRouteInfo(null);
    setRoutingActive(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Interactive Disaster Map
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              OPENSTREETMAP / POSITRON
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Ground-level incidents, seismic shocks, satellite observations, and verified safety assets.
          </p>
        </div>

        {/* Regional Jump Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {INDIA_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(p.coords, p.zoom);
                }
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-pastel-border text-slate-700 hover:text-[#5278E8] hover:border-indigo-200 shadow-xs transition"
            >
              {p.name}
            </button>
          ))}

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#5278E8] text-white hover:bg-[#4365D0] shadow-soft flex items-center space-x-1 transition hover:scale-105"
          >
            <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Control Strip & Legend */}
      <div className="pastel-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layer Toggles */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Layers:</span>
          
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
              showIncidents ? 'bg-indigo-50 text-[#5278E8] border border-indigo-200' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={() => setShowEarthquakes(!showEarthquakes)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
              showEarthquakes ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Seismic ({earthquakes.length})</span>
          </button>

          <button
            onClick={() => setShowResources(!showResources)}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
              showResources ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Resources ({resources.length})</span>
          </button>
        </div>

        {/* Color Legend (Mandatory Marker Palette) */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-600">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]"></span>
            <span>Safe Resource</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
            <span>My Location</span>
          </div>
        </div>
      </div>

      {/* Main Map + Information Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map View - 8 or 9 Cols */}
        <div className={`${selectedItem ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300`}>
          <div className="pastel-card p-2 h-[600px] relative overflow-hidden shadow-soft">
            <div 
              ref={mapContainerRef} 
              className="w-full h-full rounded-xl z-0"
            />

            {/* Floating Quick Action in map */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={fetchData}
                className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl text-slate-700 hover:text-[#5278E8] shadow-soft border border-pastel-border transition hover:scale-105"
                title="Reload Map Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5278E8]' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Marker Detail Panel (When marker clicked) - 4 Cols */}
        {selectedItem && (
          <div className="lg:col-span-4 space-y-4 animate-slideLeft">
            <div className="pastel-card p-5 space-y-4 border-indigo-100 shadow-soft">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-pastel-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedItem.type.toUpperCase()} DETAILS
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">
                    {selectedItem.emergency_type}
                  </h3>
                  <div className="text-xs font-mono font-bold text-[#5278E8] mt-0.5">
                    {selectedItem.id}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-800 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span 
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    selectedItem.severity === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : selectedItem.severity === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedItem.severity === 'Safe Resource'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {selectedItem.severity}
                </span>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  Status: {selectedItem.status}
                </span>
              </div>

              {/* Key Details */}
              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-500">Location:</span>
                  <p className="font-medium text-slate-900">{selectedItem.location}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-500">Source:</span>
                  <p className="font-medium text-slate-900">{selectedItem.source}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-500">Timestamp:</span>
                  <p className="font-medium text-slate-900">{selectedItem.time?.slice(0, 19).replace('T', ' ')} UTC</p>
                </div>

                <div>
                  <span className="font-bold text-slate-500">Description / Details:</span>
                  <p className="font-normal text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-pastel-border mt-1">
                    {selectedItem.description}
                  </p>
                </div>

                {selectedItem.contact && (
                  <div>
                    <span className="font-bold text-slate-500">Emergency Contact:</span>
                    <a href={`tel:${selectedItem.contact}`} className="font-bold text-[#5278E8] flex items-center gap-1 mt-0.5 hover:underline">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{selectedItem.contact}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Smart Routing Action Button */}
              <div className="pt-2 border-t border-pastel-border space-y-2">
                <button
                  onClick={handleCalculateRoute}
                  disabled={routingLoading}
                  className="w-full py-2.5 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-soft transition"
                >
                  <Route className="w-4 h-4" />
                  <span>{routingLoading ? 'Analyzing Corridor...' : 'Calculate Rescue Route'}</span>
                </button>

                {routingActive && (
                  <button
                    onClick={handleClearRoute}
                    className="w-full py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                  >
                    Clear Route
                  </button>
                )}
              </div>

              {/* Route Inspection Card */}
              {routeInfo && (
                <div className="p-3 rounded-xl bg-slate-50 border border-pastel-border text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Driving Distance: {routeInfo.distance_km} km</span>
                    <span>ETA: ~{routeInfo.duration_minutes} mins</span>
                  </div>

                  {routeInfo.hazard_warning ? (
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                      ⚠️ {routeInfo.hazard_warning}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      ✓ No active hazard proximity alerts on primary transit corridor.
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 italic">
                    {routeInfo.disclaimer}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
