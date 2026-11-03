import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PhoneCall, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Users, 
  Activity, 
  HeartHandshake, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const HELPLINES = [
  { number: '112', title: 'National Emergency Helpline (Unified)', agency: 'Ministry of Home Affairs', type: 'All-in-one Emergency', badge: 'Critical' },
  { number: '1070', title: 'National Disaster Management Helpline', agency: 'NDMA Control Room', type: 'Disaster Relief', badge: 'National' },
  { number: '1077', title: 'District Disaster Emergency Operations', agency: 'State Disaster Response (SDRF)', type: 'District Level', badge: 'Local' },
  { number: '108', title: 'Emergency Medical & Ambulance', agency: 'State Health Departments', type: 'Medical First Responders', badge: 'Health' },
  { number: '101', title: 'Fire & Rescue Services', agency: 'Fire Service Headquarters', type: 'Fire Evacuation', badge: 'Rescue' },
  { number: '100', title: 'Police Emergency Response', agency: 'State Police Departments', type: 'Law & Order', badge: 'Safety' },
  { number: '1091', title: 'Women Distress Helpline', agency: 'Women Safety Division', type: 'Specialized Support', badge: 'Support' },
  { number: '1098', title: 'Childline Emergency Care', agency: 'Ministry of WCD', type: 'Child Protection', badge: 'Support' }
];

export default function ResourcesPage() {
  const { user, token, isAdmin } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Add Resource Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: '',
    category: 'Hospital',
    location: '',
    latitude: 18.5204,
    longitude: 73.8567,
    contact: '',
    availability: 'Available',
    capacity: 100,
    current_occupancy: 20,
    notes: ''
  });

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await api.getResources({
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setResources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [selectedCategory]);

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      await api.createResource(token, {
        ...modalForm,
        latitude: parseFloat(modalForm.latitude),
        longitude: parseFloat(modalForm.longitude),
        capacity: parseInt(modalForm.capacity, 10),
        current_occupancy: parseInt(modalForm.current_occupancy, 10)
      });
      setShowAddModal(false);
      loadResources();
    } catch (err) {
      alert("Failed to add resource: " + err.message);
    }
  };

  const filteredResources = resources.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Emergency Resource Center
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              VERIFIED FACILITIES
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Directory of operational trauma hospitals, relief shelters, fire brigades, and specialized watercraft units.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Verified Resource</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Hospital', 'Shelter', 'Fire Station', 'Ambulance', 'Rescue Team', 'Relief Center'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-[#5278E8] text-white shadow-soft'
                  : 'bg-white border border-pastel-border text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Resources' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources or cities..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-pastel-border focus:border-[#5278E8] outline-none text-slate-800"
          />
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => (
          <div key={res.id} className="pastel-card p-6 space-y-4 hover:shadow-soft transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8]">
                  {res.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-1">{res.name}</h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{res.location}</span>
                </p>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                res.availability === 'Available' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {res.availability}
              </span>
            </div>

            {/* Capacity Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span>Occupancy:</span>
                <span className="font-bold text-slate-900">{res.current_occupancy} / {res.capacity}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-[#5278E8] transition-all"
                  style={{ width: `${Math.min(100, Math.round((res.current_occupancy / (res.capacity || 1)) * 100))}%` }}
                />
              </div>
            </div>

            {res.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-pastel-border leading-relaxed">
                {res.notes}
              </p>
            )}

            <div className="pt-2 border-t border-pastel-border flex items-center justify-between text-xs">
              {res.contact ? (
                <a
                  href={`tel:${res.contact}`}
                  className="font-bold text-[#5278E8] flex items-center gap-1 hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{res.contact}</span>
                </a>
              ) : (
                <span className="text-slate-400">Direct dial unavailable</span>
              )}
              <span className="text-[10px] text-slate-400">Verified Asset</span>
            </div>
          </div>
        ))}

        {filteredResources.length === 0 && (
          <div className="col-span-full pastel-card p-12 text-center text-xs text-slate-400">
            {loading ? 'Retrieving verified resources...' : 'No emergency resources match the current filter.'}
          </div>
        )}
      </div>

      {/* Official Emergency Helplines Directory */}
      <div className="pastel-card p-6 sm:p-8 space-y-6 shadow-soft">
        <div className="flex items-center justify-between pb-4 border-b border-pastel-border">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              National Emergency Helpline Directory (India)
            </h3>
            <p className="text-xs text-pastel-muted">
              Direct access to verified national, state, and specialized emergency helplines.
            </p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            24x7 TOLL FREE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HELPLINES.map((h, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-pastel-border hover:border-indigo-200 hover:shadow-xs transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#5278E8]">{h.number}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  h.badge === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {h.badge}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{h.title}</h4>
              <p className="text-[11px] text-slate-500">{h.agency}</p>
              <a
                href={`tel:${h.number}`}
                className="mt-2 w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-[#5278E8] hover:text-white text-[#5278E8] font-bold text-xs flex items-center justify-center space-x-1.5 transition"
              >
                <Phone className="w-3 h-3" />
                <span>Call {h.number}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleCreateResource} className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-soft-lg border border-pastel-border">
            <h3 className="font-extrabold text-slate-900 text-base">Register New Emergency Facility</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  placeholder="e.g. District Civil Trauma Hospital"
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={modalForm.category}
                    onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800 font-bold"
                  >
                    {['Hospital', 'Shelter', 'Fire Station', 'Ambulance', 'Rescue Team', 'Relief Center'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    value={modalForm.capacity}
                    onChange={(e) => setModalForm({ ...modalForm, capacity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location & City</label>
                <input
                  type="text"
                  required
                  value={modalForm.location}
                  onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                  placeholder="e.g. Shivaji Nagar, Pune"
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={modalForm.latitude}
                  onChange={(e) => setModalForm({ ...modalForm, latitude: e.target.value })}
                  placeholder="Latitude"
                  className="p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
                <input
                  type="number"
                  step="any"
                  value={modalForm.longitude}
                  onChange={(e) => setModalForm({ ...modalForm, longitude: e.target.value })}
                  placeholder="Longitude"
                  className="p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={modalForm.contact}
                  onChange={(e) => setModalForm({ ...modalForm, contact: e.target.value })}
                  placeholder="+91 20 2612 8000"
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Operational Notes</label>
                <textarea
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  placeholder="Trauma beds, generator backup, water filtration, etc."
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5278E8] text-white shadow-soft"
              >
                Save Facility
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
