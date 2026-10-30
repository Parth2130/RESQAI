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
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportPage({ initialTab = 'report', initialTrackingId = '' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'report' or 'track'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    emergency_type: 'Flood',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    severity: 'High',
    affected_count: 1,
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto-detect GPS coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert("Location access denied or unavailable. You can type your location name manually.");
      },
      { timeout: 8000 }
    );
  };

  // Submit SOS Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validation
    if (!formData.name.trim() || !formData.contact.trim() || !formData.description.trim() || !formData.location.trim()) {
      setSubmitError("Please fill in all required fields (Name, Contact, Location, and Description).");
      return;
    }

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
        affected_count: parseInt(formData.affected_count) || 1,
        image_url: formData.image_url ? formData.image_url.trim() : null
      };

      const res = await api.submitReport(payload);
      setSubmitSuccess(res);
      // Reset form
      setFormData({
        name: '',
        contact: '',
        emergency_type: 'Flood',
        description: '',
        location: '',
        latitude: '',
        longitude: '',
        severity: 'High',
        affected_count: 1,
        image_url: ''
      });
    } catch (err) {
      setSubmitError(err.message || "Failed to submit emergency report");
    } finally {
      setSubmitting(false);
    }
  };

  // Track Report
  const handleTrackSubmit = async (customId) => {
    const idToSearch = (customId || searchId).trim().toUpperCase();
    if (!idToSearch) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedReport(null);

    try {
      const res = await api.trackReport(idToSearch);
      setTrackedReport(res);
    } catch (err) {
      setTrackingError(err.message || `No emergency report found matching tracking ID: ${idToSearch}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const statusSteps = [
    { id: 'Submitted', label: 'Submitted' },
    { id: 'Under Review', label: 'Under Review' },
    { id: 'Acknowledged', label: 'Acknowledged' },
    { id: 'Resolved', label: 'Resolved' },
    { id: 'Closed', label: 'Closed' }
  ];

  const getStatusIndex = (currentStatus) => {
    const idx = statusSteps.findIndex(s => s.id.toLowerCase() === (currentStatus || '').toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="bg-resq-card p-1 rounded-2xl border border-resq-border inline-flex shadow-lg">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'report'
                ? 'bg-red-600 text-white shadow-glow-red'
                : 'text-slate-300 hover:text-white hover:bg-resq-cardLight'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Submit Emergency SOS</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === 'track'
                ? 'bg-resq-blue text-white shadow-glow-blue'
                : 'text-slate-300 hover:text-white hover:bg-resq-cardLight'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track Incident Status</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMIT REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Critical Disclaimer Banner */}
          <div className="p-4 rounded-2xl glass-panel-danger border-red-500/40 text-slate-200 text-xs sm:text-sm flex items-start space-x-3">
            <PhoneCall className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="leading-relaxed">
              <strong className="text-white block font-bold mb-0.5">
                IMMEDIATE LIFE DANGER NOTICE:
              </strong>
              RESQAI is an informational intelligence and reporting platform. It is <strong>NOT an official emergency dispatch service</strong>. In immediate life danger, call India's unified emergency number <a href="tel:112" className="text-red-400 font-extrabold underline font-mono text-base">112</a> directly.
            </div>
          </div>

          {/* Submission Success Dialog */}
          {submitSuccess && (
            <div className="p-6 rounded-2xl glass-panel-success border-emerald-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <h3 className="text-lg font-bold text-white">Emergency Report Recorded</h3>
                </div>
                <span className="text-xs text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Status: {submitSuccess.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300">
                Your report has been securely registered in the RESQAI database. Please save your unique tracking ID to check verification status and community response notes.
              </p>

              <div className="bg-resq-dark/80 p-4 rounded-xl border border-resq-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Your Tracking ID</span>
                  <span className="text-2xl font-black font-mono text-cyan-400 tracking-wider">
                    {submitSuccess.tracking_id}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(submitSuccess.tracking_id)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-resq-card hover:bg-resq-cardLight text-slate-200 text-xs font-semibold border border-resq-border transition"
                >
                  <Copy className="w-3.5 h-3.5 text-resq-cyan" />
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setSearchId(submitSuccess.tracking_id);
                    setActiveTab('track');
                    handleTrackSubmit(submitSuccess.tracking_id);
                  }}
                  className="flex items-center space-x-1.5 text-xs font-bold text-resq-cyan hover:underline"
                >
                  <span>Track this report now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
              {submitError}
            </div>
          )}

          {/* Form Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-resq-border shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">
              Citizen Emergency Report Form
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Please provide precise information. Your personal contact details remain confidential and are only accessible by verified incident response officers.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-resq-cyan" />
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Ramesh Patil"
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-resq-cyan" />
                    Contact Number (Phone) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contact"
                    required
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Emergency Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Emergency Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="emergency_type"
                    value={formData.emergency_type}
                    onChange={handleInputChange}
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue cursor-pointer"
                  >
                    <option value="Flood">Flood / Flash Flood</option>
                    <option value="Earthquake">Earthquake Tremor / Damage</option>
                    <option value="Cyclone">Cyclone / Gale Winds</option>
                    <option value="Landslide">Landslide / Rockfall</option>
                    <option value="Fire">Building / Structural Fire</option>
                    <option value="Waterlogging">Urban Waterlogging</option>
                    <option value="Medical">Stranded Citizens / Medical</option>
                    <option value="Other">Other Hazardous Condition</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Severity Level <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue cursor-pointer"
                  >
                    <option value="Critical">Critical (Immediate Danger to Life)</option>
                    <option value="High">High (Severe Property Risk / Trapped)</option>
                    <option value="Medium">Medium (Access Road Blocked)</option>
                    <option value="Low">Low (Precautionary Advisory)</option>
                  </select>
                </div>

                {/* People Affected */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-resq-cyan" />
                    People Affected
                  </label>
                  <input
                    type="number"
                    name="affected_count"
                    min="1"
                    value={formData.affected_count}
                    onChange={handleInputChange}
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
                  />
                </div>
              </div>

              {/* Location Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-resq-cyan" />
                  Specific Location / Landmark <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Near Mutha river bridge, Shaniwar Peth, Pune"
                  className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
                />
              </div>

              {/* GPS Coordinates & Auto-detect */}
              <div className="bg-resq-dark/50 p-3.5 rounded-2xl border border-resq-border/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-resq-cyan" />
                    Precise GPS Coordinates (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={locating}
                    className="text-xs font-bold text-resq-cyan hover:underline flex items-center gap-1"
                  >
                    <span>{locating ? 'Detecting GPS...' : 'Auto-detect My Location'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="Latitude (e.g. 18.5204)"
                    className="bg-resq-dark border border-resq-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-resq-blue"
                  />
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="Longitude (e.g. 73.8567)"
                    className="bg-resq-dark border border-resq-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-resq-blue"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-resq-cyan" />
                  Emergency Description & Required Assistance <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detail the emergency situation, number of elderly/children, access conditions, water height, power outages, etc."
                  className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition resize-none"
                />
              </div>

              {/* Photo Attachment URL */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-resq-cyan" />
                  Incident Photo URL (Optional)
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://... (Optional web or cloud link to scene photo)"
                  className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm shadow-glow-red transition active:scale-98 flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{submitting ? 'Registering Emergency SOS...' : 'Submit Emergency SOS Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: TRACK REPORT */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-resq-border shadow-xl">
            <h2 className="text-xl font-bold text-white mb-1">
              Track Your Emergency Report
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Enter the unique tracking ID (e.g. RESQ-9824X) generated when your report was submitted.
            </p>

            {/* Search Input Bar */}
            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                placeholder="Enter Tracking ID (e.g. RESQ-XXXXXX)"
                className="flex-1 bg-resq-dark border border-resq-border rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 placeholder-slate-500 uppercase tracking-wider focus:outline-none focus:border-resq-blue"
              />
              <button
                onClick={() => handleTrackSubmit()}
                disabled={trackingLoading || !searchId.trim()}
                className="px-5 py-2.5 rounded-xl bg-resq-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-blue transition flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>{trackingLoading ? 'Checking...' : 'Track'}</span>
              </button>
            </div>

            {trackingError && (
              <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                {trackingError}
              </div>
            )}
          </div>

          {/* Report Tracking Details View */}
          {trackedReport && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-resq-border shadow-xl space-y-6 animate-in fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-resq-border">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                    Tracking ID
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-2xl font-black font-mono text-cyan-400 tracking-wider">
                      {trackedReport.tracking_id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(trackedReport.tracking_id)}
                      className="p-1 text-slate-400 hover:text-white transition"
                      title="Copy Tracking ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    trackedReport.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : trackedReport.severity === 'High'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  }`}>
                    {trackedReport.severity} Severity
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-resq-dark border border-resq-border text-white">
                    Status: {trackedReport.status}
                  </span>
                </div>
              </div>

              {/* Status Progression Stepper */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                  Incident Verification & Resolution Timeline
                </span>
                <div className="grid grid-cols-5 gap-2 relative">
                  {statusSteps.map((step, idx) => {
                    const activeIdx = getStatusIndex(trackedReport.status);
                    const isCompleted = idx <= activeIdx;
                    const isCurrent = idx === activeIdx;

                    return (
                      <div key={step.id} className="text-center space-y-2">
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-resq-blue text-white shadow-glow-blue ring-4 ring-blue-500/20'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-resq-dark text-slate-600 border border-resq-border'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[11px] font-semibold block leading-tight ${
                          isCurrent ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-resq-dark/60 p-4 rounded-2xl border border-resq-border">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Emergency Type:</span>
                    <strong className="text-white text-sm">{trackedReport.emergency_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <strong className="text-slate-200">{trackedReport.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Persons Affected:</span>
                    <strong className="text-slate-200">{trackedReport.affected_count} people</strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Report Submitted At:</span>
                    <strong className="text-slate-200 font-mono">
                      {new Date(trackedReport.created_at).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Last Updated:</span>
                    <strong className="text-slate-200 font-mono">
                      {new Date(trackedReport.updated_at).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Coordinates:</span>
                    <span className="font-mono text-slate-400">
                      {trackedReport.latitude && trackedReport.longitude 
                        ? `${trackedReport.latitude.toFixed(4)}, ${trackedReport.longitude.toFixed(4)}`
                        : 'Manual Landmark Description'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Incident Description:</span>
                <p className="text-sm text-slate-200 bg-resq-dark/40 p-3.5 rounded-xl border border-resq-border/60 leading-relaxed">
                  {trackedReport.description}
                </p>
              </div>

              {/* Audit History Timeline */}
              {trackedReport.history && trackedReport.history.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-resq-cyan" />
                    Responder & Audit Activity Log
                  </h4>
                  <div className="space-y-2">
                    {trackedReport.history.map((h) => (
                      <div key={h.id} className="p-3 rounded-xl bg-resq-dark/50 border border-resq-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            Status: <strong className="text-resq-cyan">{h.new_status}</strong>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(h.updated_at).toLocaleString()}
                          </span>
                        </div>
                        {h.notes && (
                          <p className="text-slate-300">{h.notes}</p>
                        )}
                        <span className="text-[10px] text-slate-500 block">
                          Updated by: {h.updated_by || 'System'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety notice */}
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-slate-300">
                <span className="text-red-400 font-bold block mb-1">Notice:</span>
                {trackedReport.disclaimer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
