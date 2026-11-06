import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  Users, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Copy, 
  Search, 
  Clock, 
  ShieldAlert, 
  PhoneCall,
  Navigation,
  ArrowRight,
  Info,
  Sparkles,
  HeartHandshake,
  Image as ImageIcon,
  Check,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EMERGENCY_CATEGORIES = [
  { id: 'Flood', label: 'Flood / Flash Flooding', desc: 'Water entering homes, submerged roads' },
  { id: 'Fire', label: 'Structural / Wildfire', desc: 'Active flames, building blaze, smoke' },
  { id: 'Earthquake', label: 'Earthquake / Collapse', desc: 'Building tremor, structural cracks, debris' },
  { id: 'Landslide', label: 'Landslide / Rockfall', desc: 'Slope failure, blocked ghat highways' },
  { id: 'Cyclone', label: 'Cyclone / High Gale', desc: 'Extreme winds, fallen trees, damaged roofs' },
  { id: 'Accident', label: 'Severe Road Accident', desc: 'Multi-vehicle collision, transit blockage' },
  { id: 'Medical Emergency', label: 'Mass Medical Trauma', desc: 'Cardiac, mass casualty, heatstroke' },
  { id: 'Other', label: 'Other Disaster Distress', desc: 'Chemical, gas leak, urban hazard' },
];

export default function ReportPage({ initialTab = 'report', initialTrackingId = '' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'report' or 'track'

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    contact: user?.phone || '',
    emergency_type: 'Flood',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    severity: 'High',
    affected_count: 1,
    injured_count: 0,
    vulnerable_people: false,
    image_url: ''
  });

  const [locationConsent, setLocationConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationTimestamp, setLocationTimestamp] = useState(null);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Tracking State
  const [searchId, setSearchId] = useState(initialTrackingId);
  const [trackedReport, setTrackedReport] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Mini Map Refs
  const miniMapContainerRef = useRef(null);
  const miniMapInstanceRef = useRef(null);
  const miniMapMarkerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (miniMapInstanceRef.current) {
        try {
          miniMapInstanceRef.current.remove();
        } catch {}
        miniMapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (initialTrackingId) {
      setSearchId(initialTrackingId);
      handleTrackSubmit(initialTrackingId);
    }
  }, [initialTrackingId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Section 10: Button 1 — Use My Current Location (native navigator.geolocation)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please select location manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        const timeStr = new Date(pos.timestamp).toLocaleTimeString();
        setLocationAccuracy(acc);
        setLocationTimestamp(timeStr);
        setShowMiniMap(true);

        let addr = "";
        try {
          const res = await api.reverseGeocode(lat, lng);
          if (res && res.address) addr = res.address;
        } catch {}

        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          location: prev.location || addr || `Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        }));
        setLocating(false);

        // Update mini map
        updateMiniMapMarker(lat, lng);
      },
      (err) => {
        setLocating(false);
        let msg = "Could not access GPS location.";
        if (err.code === 1) msg = "Location permission denied. Please allow location permissions in your browser or select location manually.";
        else if (err.code === 2) msg = "GPS position unavailable. Please choose location manually.";
        else if (err.code === 3) msg = "Location request timed out. Please retry or pick location manually.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Section 10: Button 2 — Select Location Manually
  const handleSelectLocationManually = () => {
    setShowMiniMap(true);
    const defaultLat = formData.latitude ? parseFloat(formData.latitude) : 18.5204;
    const defaultLng = formData.longitude ? parseFloat(formData.longitude) : 73.8567;
    setFormData(prev => ({
      ...prev,
      latitude: prev.latitude || defaultLat.toFixed(6),
      longitude: prev.longitude || defaultLng.toFixed(6),
      location: prev.location || "Pune Central Sector, Maharashtra"
    }));
    updateMiniMapMarker(defaultLat, defaultLng);
  };

  const updateMiniMapMarker = (lat, lng) => {
    if (!miniMapInstanceRef.current && miniMapContainerRef.current) {
      if (miniMapContainerRef.current._leaflet_id) {
        miniMapContainerRef.current._leaflet_id = null;
      }
      const map = L.map(miniMapContainerRef.current, {
        center: [lat, lng],
        zoom: 13
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', async () => {
        const p = marker.getLatLng();
        setFormData(prev => ({
          ...prev,
          latitude: p.lat.toFixed(6),
          longitude: p.lng.toFixed(6)
        }));
        try {
          const res = await api.reverseGeocode(p.lat, p.lng);
          if (res && res.address) {
            setFormData(prev => ({ ...prev, location: res.address }));
          }
        } catch {}
      });

      map.on('click', async (e) => {
        marker.setLatLng(e.latlng);
        setFormData(prev => ({
          ...prev,
          latitude: e.latlng.lat.toFixed(6),
          longitude: e.latlng.lng.toFixed(6)
        }));
        try {
          const res = await api.reverseGeocode(e.latlng.lat, e.latlng.lng);
          if (res && res.address) {
            setFormData(prev => ({ ...prev, location: res.address }));
          }
        } catch {}
      });

      miniMapInstanceRef.current = map;
      miniMapMarkerRef.current = marker;
    } else if (miniMapInstanceRef.current && miniMapMarkerRef.current) {
      miniMapMarkerRef.current.setLatLng([lat, lng]);
      miniMapInstanceRef.current.flyTo([lat, lng], 13);
    }
  };

  // Submit Emergency Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        emergency_type: formData.emergency_type,
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: (locationConsent && formData.latitude) ? parseFloat(formData.latitude) : null,
        longitude: (locationConsent && formData.longitude) ? parseFloat(formData.longitude) : null,
        severity: formData.severity,
        affected_count: parseInt(formData.affected_count, 10) || 1,
        injured_count: parseInt(formData.injured_count, 10) || 0,
        vulnerable_people: formData.vulnerable_people,
        image_url: formData.image_url || null
      };

      const res = await api.submitReport(payload);
      setSubmitSuccess(res);
      // Auto pre-populate tracker
      setSearchId(res.tracking_id);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit emergency report");
    } finally {
      setSubmitting(false);
    }
  };

  // Track Report by ID
  const handleTrackSubmit = async (customId) => {
    const idToSearch = customId || searchId;
    if (!idToSearch || !idToSearch.trim()) return;

    setTrackingLoading(true);
    setTrackingError(null);

    try {
      const data = await api.trackReport(idToSearch.trim());
      setTrackedReport(data);
    } catch (err) {
      setTrackingError(err.message || "Incident not found. Please verify the Incident ID.");
      setTrackedReport(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStepStatus = (stepName, currentStatus) => {
    const steps = ["New", "Under Verification", "Verified", "Assigned", "Rescue in Progress", "Resolved", "Closed"];
    const currentIndex = steps.indexOf(currentStatus);
    const stepIndex = steps.indexOf(stepName);

    if (currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 112 National Warning Banner */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Life-Threatening Emergency Notice:</span>
            <p className="text-xs text-rose-800 mt-0.5">
              If anyone is actively injured, trapped, or in immediate life danger, please immediately dial India's emergency helpline <strong>112</strong> directly.
            </p>
          </div>
        </div>
        <a
          href="tel:112"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs self-start sm:self-auto transition flex items-center space-x-1.5 whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call 112 Directly</span>
        </a>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-white p-1 border border-pastel-border shadow-xs">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'report'
              ? 'bg-[#5278E8] text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>1. Report Emergency Incident</span>
        </button>

        <button
          onClick={() => setActiveTab('track')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'track'
              ? 'bg-[#5278E8] text-white shadow-soft'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>2. Track Incident Status</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY REPORTING FORM */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {submitSuccess ? (
            /* Submission Success Screen */
            <div className="pastel-card p-8 text-center space-y-6 animate-fadeIn border-emerald-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-soft">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Submission Verified & AI Triaged
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Emergency Incident Recorded Successfully
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your report has been analyzed and logged in the emergency queue. You can track this report at any time using your tracking ID below.
                </p>
              </div>

              {/* Unique Tracking ID Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-pastel-border max-w-sm mx-auto space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Your Unique Tracking ID
                </span>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl font-mono font-black text-[#5278E8] tracking-wider">
                    {submitSuccess.tracking_id}
                  </span>
                  <button
                    onClick={() => handleCopyId(submitSuccess.tracking_id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                    title="Copy Tracking ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied to clipboard!</span>}
              </div>

              {/* AI Triage Feedback */}
              {submitSuccess.ai_summary && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 max-w-md mx-auto text-left text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#5278E8] font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Nugen AI Assessment:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{submitSuccess.ai_summary}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('track');
                    handleTrackSubmit(submitSuccess.tracking_id);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition"
                >
                  Track This Incident Live →
                </button>
                <button
                  onClick={() => {
                    setSubmitSuccess(null);
                    setFormData({
                      name: user?.name || '',
                      contact: user?.phone || '',
                      emergency_type: 'Flood',
                      description: '',
                      location: '',
                      latitude: '',
                      longitude: '',
                      severity: 'High',
                      affected_count: 1,
                      injured_count: 0,
                      vulnerable_people: false,
                      image_url: ''
                    });
                    setShowMiniMap(false);
                  }}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          ) : (
            /* Reporting Form */
            <form onSubmit={handleSubmit} className="pastel-card p-6 sm:p-8 space-y-6 shadow-soft-lg">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. Emergency Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Emergency Hazard Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {EMERGENCY_CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFormData({ ...formData, emergency_type: cat.id })}
                      className={`p-3 rounded-xl border text-left transition ${
                        formData.emergency_type === cat.id
                          ? 'border-[#5278E8] bg-indigo-50/50 text-[#5278E8] font-bold shadow-xs ring-2 ring-indigo-200'
                          : 'border-pastel-border bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{cat.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Severity Grade Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Initial Severity Assessment *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Critical', label: 'Critical', desc: 'Life at immediate risk' },
                    { id: 'High', label: 'High', desc: 'Rapidly escalating' },
                    { id: 'Medium', label: 'Medium', desc: 'Significant hazard' },
                    { id: 'Low', label: 'Low', desc: 'Caution / Minor' }
                  ].map(sev => (
                    <button
                      type="button"
                      key={sev.id}
                      onClick={() => setFormData({ ...formData, severity: sev.id })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        formData.severity === sev.id
                          ? sev.id === 'Critical'
                            ? 'border-rose-500 bg-rose-50 text-rose-700 font-extrabold shadow-xs'
                            : 'border-[#5278E8] bg-indigo-50 text-[#5278E8] font-bold shadow-xs'
                          : 'border-pastel-border bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{sev.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 hidden sm:block">{sev.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Incident Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Description of Emergency *
                </label>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe the situation clearly: what happened, visible hazards, current water level, fire smoke spread, or trapped persons..."
                  className="w-full p-3 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition resize-none"
                />
              </div>

              {/* 4. Section 10: Location Integration with Two Explicit Buttons */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Location Information & Coordinates *
                </label>

                {/* Two Mandatory Buttons (Section 10) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#5278E8] font-bold text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
                    <span>{locating ? 'Detecting Device GPS...' : '📍 Use My Current Location'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectLocationManually}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-pastel-border text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>🗺️ Select Location Manually</span>
                  </button>
                </div>

                {/* Readable Address Input */}
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Readable address or landmark (e.g. Near Mutha River Bridge, Shivaji Nagar, Pune)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                  />
                </div>

                {/* Latitude & Longitude */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      placeholder="e.g. 18.5204"
                      className="w-full p-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      placeholder="e.g. 73.8567"
                      className="w-full p-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                {/* Consent Checkbox (Section 10) */}
                <div className="flex items-start space-x-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <input
                    type="checkbox"
                    id="location_consent"
                    checked={locationConsent}
                    onChange={(e) => setLocationConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-[#5278E8] focus:ring-indigo-400"
                  />
                  <label htmlFor="location_consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                    <strong>Location Sharing Consent:</strong> I voluntarily consent to attach my geographical coordinates to this emergency report to assist in incident verification and spatial mapping.
                  </label>
                </div>

                {/* Interactive Mini-Map Preview (Section 10) */}
                {showMiniMap && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-700">Location Review Mini-Map</span>
                      <span>Click anywhere or drag pin to adjust position</span>
                    </div>
                    <div 
                      ref={miniMapContainerRef} 
                      className="w-full h-48 rounded-2xl border border-pastel-border shadow-xs overflow-hidden z-10"
                    />
                  </div>
                )}
              </div>

              {/* 5. Metrics: People Affected & Vulnerable Groups */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-pastel-border">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">People Affected</label>
                  <input
                    type="number"
                    name="affected_count"
                    min={1}
                    value={formData.affected_count}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg border border-pastel-border text-xs text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Injured Persons</label>
                  <input
                    type="number"
                    name="injured_count"
                    min={0}
                    value={formData.injured_count}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-lg border border-pastel-border text-xs text-slate-800 bg-white"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="vulnerable_people"
                    name="vulnerable_people"
                    checked={formData.vulnerable_people}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-[#5278E8] focus:ring-indigo-400"
                  />
                  <label htmlFor="vulnerable_people" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Children / Elderly Present
                  </label>
                </div>
              </div>

              {/* 6. Optional Image Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Optional Image URL / Photo Link
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://images.example.com/incident-photo.jpg"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                  />
                </div>
              </div>

              {/* 7. Citizen Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Ramesh Patil"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Your Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98230 45671"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Mandatory Emergency Disclaimer (Section 10) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block text-amber-950 font-bold">Important Emergency Disclaimer:</strong>
                  <p className="leading-relaxed">
                    "RESQAI is an informational and citizen-reporting platform. It is not an official emergency dispatch service and does not guarantee rescue assistance. In immediate danger, contact India's emergency number 112 directly."
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-soft transition hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>{submitting ? 'Recording Report in SQLite & Generating Tracking ID...' : 'Submit Emergency Report'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: INCIDENT TRACKING PIPELINE (Section 11) */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="pastel-card p-6 shadow-soft space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Track Incident Report by Tracking ID
            </h3>
            <p className="text-xs text-pastel-muted">
              Enter your unpredictable tracking ID (e.g. <span className="font-mono text-[#5278E8] font-bold">RQ-2026-0001</span>) to view current verification status, status history, and incident progression.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTrackSubmit();
              }}
              className="flex items-center space-x-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="Enter Tracking ID (e.g. RQ-2026-0001)"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm font-mono text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={trackingLoading}
                className="px-5 py-2.5 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs shadow-soft transition"
              >
                {trackingLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackingError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {trackingError}
              </div>
            )}
          </div>

          {/* Tracked Report Details (Section 11: Privacy Protected) */}
          {trackedReport && (
            <div className="pastel-card p-6 sm:p-8 space-y-6 shadow-soft animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pastel-border gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Incident #{trackedReport.tracking_id}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5278E8]">
                      {trackedReport.emergency_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{trackedReport.location}</p>
                </div>

                <span 
                  className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                    trackedReport.severity === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : trackedReport.severity === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  Severity: {trackedReport.severity}
                </span>
              </div>

              {/* 5-Stage Status Visual Pipeline */}
              <div className="py-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Report Status Lifecycle
                </span>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { name: 'New', label: '1. Submitted' },
                    { name: 'Under Verification', label: '2. Under Review' },
                    { name: 'Verified', label: '3. Acknowledged' },
                    { name: 'Assigned', label: '4. In Progress' },
                    { name: 'Resolved', label: '5. Resolved' }
                  ].map((step, idx) => {
                    const statusClass = getStepStatus(step.name, trackedReport.status);
                    return (
                      <div 
                        key={idx}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          statusClass === 'completed'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                            : statusClass === 'active'
                            ? 'bg-indigo-50 border-[#5278E8] text-[#5278E8] font-extrabold ring-2 ring-indigo-200'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="text-[11px]">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details Grid (Strict Privacy Protection - Section 11 & 19) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-700 block">Incident Metadata:</span>
                  <div><strong>Category:</strong> {trackedReport.emergency_type}</div>
                  <div><strong>Reported At:</strong> {trackedReport.created_at ? new Date(trackedReport.created_at).toLocaleString() : 'Recent'}</div>
                  <div><strong>People Affected:</strong> {trackedReport.affected_count || 1}</div>
                  <div><strong>Vulnerable Present:</strong> {trackedReport.vulnerable_people ? 'Yes' : 'No'}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-700 block">Current Status & Protection:</span>
                  <div><strong>Current Status:</strong> <span className="font-bold text-[#5278E8]">{trackedReport.status}</span></div>
                  <div><strong>Reporter Identity:</strong> <span className="text-slate-500 font-mono">Protected / Verified</span></div>
                  <div><strong>Contact:</strong> <span className="text-slate-500 font-mono">Masked (Privacy Assured)</span></div>
                  <div><strong>Source:</strong> {trackedReport.source || 'Citizen Report'}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Incident Summary:</span>
                <p className="text-slate-600 leading-relaxed">{trackedReport.description}</p>
              </div>

              {/* Status History (Section 11) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Status Timeline & Responder Notes:</span>
                {trackedReport.history && trackedReport.history.length > 0 ? (
                  <div className="space-y-2">
                    {trackedReport.history.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-[#5278E8] flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Status changed to <span className="text-[#5278E8]">{h.new_status}</span> by {h.updated_by || 'Control Room'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{h.notes}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{new Date(h.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                    Initial report logged. Assigned to emergency verification triage queue.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
