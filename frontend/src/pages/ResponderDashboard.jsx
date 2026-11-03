import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send, 
  Users, 
  PhoneCall, 
  Navigation, 
  Sparkles, 
  Filter, 
  ArrowRight,
  Route,
  Activity,
  Layers,
  Building2,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ResponderDashboard({ setActivePage }) {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming', 'sos', 'assigned', 'resources'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusUpdateVal, setStatusUpdateVal] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // AI Module 4 Recommendations state
  const [aiRecs, setAiRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);

  // Assignment Modal
  const [assignResponderId, setAssignResponderId] = useState('');
  const [assignResourceId, setAssignResourceId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, resRes, respRes] = await Promise.allSettled([
        api.getAdminReports(token),
        api.getResources(),
        api.getResponders(token)
      ]);

      if (incRes.status === 'fulfilled') setIncidents(incRes.value || []);
      if (resRes.status === 'fulfilled') setResources(resRes.value || []);
      if (respRes.status === 'fulfilled') setResponders(respRes.value || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Load AI Module 4 Recommendations when an incident is inspected
  const handleSelectIncident = async (inc) => {
    setSelectedIncident(inc);
    setStatusUpdateVal(inc.status);
    setUpdateNotes('');
    setAiRecs(null);
    setRecsLoading(true);

    try {
      const recs = await api.getResponseRecommendations(token, inc.id);
      setAiRecs(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setRecsLoading(false);
    }
  };

  // Submit Status Update
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !statusUpdateVal) return;

    setUpdating(true);
    try {
      const updated = await api.updateIncidentStatus(
        token,
        selectedIncident.id,
        statusUpdateVal,
        updateNotes || `Status updated to ${statusUpdateVal} by ${user?.name}`
      );
      setSelectedIncident(updated);
      loadData();
      alert(`Incident #${updated.tracking_id} successfully progressed to ${statusUpdateVal}.`);
    } catch (err) {
      alert("Status update failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Assign Unit
  const handleAssignUnit = async (e) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      await api.assignIncident(
        token,
        selectedIncident.id,
        assignResponderId ? parseInt(assignResponderId, 10) : null,
        assignResourceId ? parseInt(assignResourceId, 10) : null,
        `Unit deployment initiated by ${user?.name}.`
      );
      alert("Deployment assignment confirmed. Incident marked as Assigned.");
      loadData();
    } catch (err) {
      alert("Assignment failed: " + err.message);
    }
  };

  // Counts
  const newCount = incidents.filter(i => i.status === 'New').length;
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;
  const assignedCount = incidents.filter(i => i.status === 'Assigned' || i.status === 'Rescue in Progress').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
  const sosCount = incidents.filter(i => i.source === 'SOS Distress').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-pastel-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Responder Tactical Command
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
              DISASTER RESPONSE OPS
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Field incident triage, confidential caller contact verification, Nugen AI dispatch guidance, and resource routing.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-pastel-border text-slate-600 hover:text-[#5278E8] shadow-xs transition"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5278E8]' : ''}`} />
          </button>
          <button
            onClick={() => setActivePage('map')}
            className="px-4 py-2 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white text-xs font-bold shadow-soft transition flex items-center space-x-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Map Visualizer</span>
          </button>
        </div>
      </div>

      {/* 5 Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="pastel-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">New Inbound</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{newCount}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Severity</span>
          <div className="text-2xl font-black text-rose-600 mt-0.5">{criticalCount}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SOS Beacons</span>
          <div className="text-2xl font-black text-purple-700 mt-0.5">{sosCount}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Assigned</span>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{assignedCount}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved</span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">{resolvedCount}</div>
        </div>
      </div>

      {/* Main Grid: Incident Queue (7 cols) + Selected Triage & AI Panel (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Queue - 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Queue Tab Switcher */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-2xl border border-pastel-border shadow-xs text-xs">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`flex-1 py-2 rounded-xl font-bold transition ${
                activeTab === 'incoming' ? 'bg-[#5278E8] text-white shadow-soft' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Incidents ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('sos')}
              className={`flex-1 py-2 rounded-xl font-bold transition ${
                activeTab === 'sos' ? 'bg-rose-600 text-white shadow-soft' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SOS Distress ({sosCount})
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`flex-1 py-2 rounded-xl font-bold transition ${
                activeTab === 'assigned' ? 'bg-[#5278E8] text-white shadow-soft' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned Operations ({assignedCount})
            </button>
          </div>

          {/* List Cards */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {incidents
              .filter(i => {
                if (activeTab === 'sos') return i.source === 'SOS Distress';
                if (activeTab === 'assigned') return i.status === 'Assigned' || i.status === 'Rescue in Progress';
                return true;
              })
              .map(inc => {
                const isSelected = selectedIncident?.id === inc.id;
                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`pastel-card p-4 cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'border-[#5278E8] ring-2 ring-indigo-200 shadow-soft'
                        : 'hover:border-indigo-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-black text-[#5278E8]">
                            #{inc.tracking_id}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {inc.emergency_type}
                          </span>
                          {inc.source === 'SOS Distress' && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                              SOS
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{inc.location}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inc.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : inc.severity === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {inc.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Reporter: <strong>{inc.name}</strong> ({inc.contact})</span>
                      <span>{inc.created_at?.slice(0, 16).replace('T', ' ')} UTC</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected Incident Command Panel - 5 Cols */}
        <div className="lg:col-span-5 space-y-4">
          {selectedIncident ? (
            <div className="pastel-card p-6 space-y-6 shadow-soft animate-fadeIn border-indigo-200">
              {/* Header */}
              <div className="pb-4 border-b border-pastel-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    COMMAND TRIAGE
                  </span>
                  <span className="text-xs font-mono font-extrabold text-[#5278E8]">
                    {selectedIncident.tracking_id}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {selectedIncident.emergency_type} ({selectedIncident.severity})
                </h3>
                <p className="text-xs text-slate-500">{selectedIncident.location}</p>
              </div>

              {/* Confidential Citizen Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-pastel-border text-xs space-y-1.5">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                  Confidential Ground Contact (Authorized Responders)
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{selectedIncident.name}</span>
                  <a
                    href={`tel:${selectedIncident.contact}`}
                    className="font-bold text-[#5278E8] flex items-center gap-1 hover:underline text-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{selectedIncident.contact}</span>
                  </a>
                </div>
                <div className="text-[11px] text-slate-500">
                  Affected: {selectedIncident.affected_count} people • Vulnerable: {selectedIncident.vulnerable_people ? 'Yes' : 'No'}
                </div>
              </div>

              {/* AI Module 4 Recommendations */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[#5278E8] font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Nugen AI Response Strategy</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    MODULE 4
                  </span>
                </div>

                {recsLoading ? (
                  <div className="text-slate-500 text-xs py-2 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5278E8] animate-spin" />
                    <span>Generating tactical briefing...</span>
                  </div>
                ) : aiRecs ? (
                  <div className="space-y-2 text-slate-700 leading-relaxed font-normal">
                    <p className="font-bold text-slate-900">{aiRecs.responder_briefing}</p>
                    <div>
                      <span className="font-bold text-slate-800">Recommended Units:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiRecs.recommended_resource_categories?.map((c, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Standard tactical assessment loaded.</p>
                )}
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusUpdate} className="space-y-3 pt-2 border-t border-pastel-border text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Update Operational Triage Status
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Under Verification',
                    'Verified',
                    'Assigned',
                    'Rescue in Progress',
                    'Resolved',
                    'Closed'
                  ].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setStatusUpdateVal(s)}
                      className={`p-2 rounded-xl border text-center font-bold text-[11px] transition ${
                        statusUpdateVal === s
                          ? 'border-[#5278E8] bg-indigo-50 text-[#5278E8] shadow-xs'
                          : 'border-pastel-border bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Operational Notes / Reason</label>
                  <input
                    type="text"
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="e.g. Field verification verified; flood boats deploying."
                    className="w-full p-2.5 rounded-xl border border-pastel-border text-xs text-slate-800 bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2.5 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs shadow-soft transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{updating ? 'Recording Status Update...' : 'Commit Status Update'}</span>
                </button>
              </form>

              {/* Unit Assignment Selector */}
              <form onSubmit={handleAssignUnit} className="space-y-3 pt-4 border-t border-pastel-border text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block">
                  Deploy Field Responder & Resource
                </span>

                <div className="space-y-2">
                  <select
                    value={assignResponderId}
                    onChange={(e) => setAssignResponderId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-pastel-border bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="">Select Responder Team...</option>
                    {responders.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.badge_id} - {r.specialization})</option>
                    ))}
                  </select>

                  <select
                    value={assignResourceId}
                    onChange={(e) => setAssignResourceId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-pastel-border bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="">Select Equipment / Facility...</option>
                    {resources.map(res => (
                      <option key={res.id} value={res.id}>{res.name} ({res.category})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Confirm Unit Assignment
                </button>
              </form>
            </div>
          ) : (
            <div className="pastel-card p-12 text-center text-xs text-slate-400 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Select an incident or SOS beacon from the left queue to open tactical triage, review AI strategy, and execute status updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
