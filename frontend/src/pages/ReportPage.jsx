import React, { useState, useEffect } from 'react';
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
  HeartHandshake
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

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [locating, setLocating] = useState(false);

  // Tracking State
  const [searchId, setSearchId] = useState(initialTrackingId);
  const [trackedReport, setTrackedReport] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [copied, setCopied] = useState(false);

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

  // Auto-detect GPS coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
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
      },
      (err) => {
        setLocating(false);
        alert("Could not access your location. Please check browser permissions.");
      },
      { timeout: 10000 }
    );
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
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
                  Incident Recorded Successfully
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your report has been analyzed by Nugen AI and entered into the emergency coordination queue.
                </p>
              </div>

              {/* Unique Tracking ID Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-pastel-border max-w-sm mx-auto space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Your Unique Incident ID
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
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {submitSuccess.ai_summary}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setActiveTab('track');
                    handleTrackSubmit(submitSuccess.tracking_id);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Track This Incident Now</span>
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
                      <div className="text-[10px] text-slate-400 hidden sm:block">{sev.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Description Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Incident Description & Ground Details *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  required
                  placeholder="Describe the emergency: water levels, trapped residents, road blockages, structural damages, or immediate danger..."
                  className="w-full p-3 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                />
                <span className="text-[11px] text-slate-400">
                  Nugen AI will analyze this description to extract triage priorities and dispatch guidance.
                </span>
              </div>

              {/* 4. Location & GPS Auto-Detection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Location & Coordinates *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Shivaji Nagar, near Mutha river bridge, Pune"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pastel-border text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:border-[#5278E8] outline-none transition"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#5278E8] font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                    <span>{locating ? 'Locating...' : 'Auto-Detect GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="Latitude (e.g. 18.5308)"
                    className="p-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50"
                  />
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="Longitude (e.g. 73.8475)"
                    className="p-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50"
                  />
                </div>
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
                  <label htmlFor="vulnerable_people" className="text-xs font-bold text-slate-700">
                    Children / Elderly Present
                  </label>
                </div>
              </div>

              {/* 6. Citizen Contact Information (Strictly Confidential) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Your Name *
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
                    Your Contact Phone *
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

              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 flex items-center space-x-2">
                <Info className="w-4 h-4 text-[#5278E8] flex-shrink-0" />
                <span>
                  <strong>Privacy Assurance:</strong> Citizen names and phone numbers are encrypted and strictly protected. They are only visible to verified rescue commanders.
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-extrabold text-sm shadow-soft transition hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>{submitting ? 'Transmitting Emergency Report & AI Triaging...' : 'Submit Emergency Report Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: INCIDENT TRACKING PIPELINE */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="pastel-card p-6 shadow-soft space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              Track Incident by Tracking ID
            </h3>
            <p className="text-xs text-pastel-muted">
              Enter your unique tracking ID (e.g. <span className="font-mono text-[#5278E8] font-bold">RQ-2026-0001</span>) to view real-time triage status, responder notes, and dispatch progression.
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

          {/* Tracked Report Details */}
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
              <div className="py-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-4">
                  Response Progression Pipeline
                </span>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { name: 'New', label: '1. New' },
                    { name: 'Under Verification', label: '2. Verifying' },
                    { name: 'Verified', label: '3. Verified' },
                    { name: 'Assigned', label: '4. Assigned' },
                    { name: 'Resolved', label: '5. Resolved' }
                  ].map((s, idx) => {
                    const status = getStepStatus(s.name, trackedReport.status);
                    return (
                      <div key={idx} className="space-y-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            status === 'completed'
                              ? 'bg-emerald-500'
                              : status === 'active'
                              ? 'bg-[#5278E8] animate-pulse'
                              : 'bg-slate-200'
                          }`}
                        />
                        <div className={`text-[10px] font-bold ${
                          status === 'completed'
                            ? 'text-emerald-700'
                            : status === 'active'
                            ? 'text-[#5278E8]'
                            : 'text-slate-400'
                        }`}>
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description & Impact */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-pastel-border text-xs">
                <div>
                  <span className="font-bold text-slate-500">Incident Details:</span>
                  <p className="text-slate-800 mt-0.5">{trackedReport.description}</p>
                </div>
                <div className="flex items-center space-x-4 text-slate-500">
                  <span>Affected: {trackedReport.affected_count} people</span>
                  <span>Injured: {trackedReport.injured_count || 0}</span>
                  <span>Vulnerable: {trackedReport.vulnerable_people ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Operational Audit History */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Triage & Dispatch History Log
                </span>
                <div className="space-y-2">
                  {trackedReport.history?.map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-white border border-pastel-border text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Status: {h.new_status}</span>
                        <span className="text-[10px] text-slate-400">{h.created_at?.slice(0, 16).replace('T', ' ')} UTC</span>
                      </div>
                      <p className="text-slate-600 font-normal">{h.notes}</p>
                      <div className="text-[10px] text-[#5278E8] font-semibold">Updated By: {h.updated_by}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
