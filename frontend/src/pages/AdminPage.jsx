import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  Search, 
  Filter, 
  Phone, 
  User, 
  MapPin, 
  Clock, 
  Edit3, 
  CheckCircle2, 
  LogOut, 
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Users,
  ShieldCheck,
  Building2,
  Activity,
  History,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdminPage({ setActivePage }) {
  const { user, token, isAdmin, login } = useAuth();
  
  // Local state
  const [activeTab, setActiveTab] = useState('incidents'); // 'incidents', 'users', 'audit', 'analytics'
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Status Update Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('Verified');
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Admin login fallback if not authenticated
  const [adminEmail, setAdminEmail] = useState('admin@resqai.in');
  const [adminPassword, setAdminPassword] = useState('ResqAdmin@2026');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reportsData, usersData, auditData, analyticsData] = await Promise.allSettled([
        api.getAdminReports(token, {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          severity: severityFilter || undefined
        }),
        api.getUsers(token),
        api.getAuditLogs(token),
        api.getAnalytics()
      ]);

      if (reportsData.status === 'fulfilled') setReports(reportsData.value || []);
      if (usersData.status === 'fulfilled') setUsersList(usersData.value || []);
      if (auditData.status === 'fulfilled') setAuditLogs(auditData.value || []);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token, statusFilter, severityFilter]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(adminEmail, adminPassword);
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setUpdating(true);
    try {
      await api.updateIncidentStatus(
        token,
        selectedReport.id,
        newStatus,
        internalNotes || `Admin status change to ${newStatus}`
      );
      setSelectedReport(null);
      loadAdminData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.verifyUser(token, userId);
      loadAdminData();
      alert("User account verified successfully.");
    } catch (err) {
      alert("Failed to verify user: " + err.message);
    }
  };

  // If not logged in as admin, show clean admin login card
  if (!token || !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5278E8] to-[#A5B4FC] text-white flex items-center justify-center mx-auto shadow-soft">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Control Room Authentication
            </h2>
            <p className="text-xs text-pastel-muted">
              Restricted portal. High-level security authentication required.
            </p>
          </div>

          <div className="pastel-card p-6 shadow-soft-lg space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Officer Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Security Credential</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] disabled:opacity-50 text-white font-bold text-xs shadow-soft transition"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const pendingVerificationCount = usersList.filter(u => u.role !== 'citizen' && !u.verified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrative Control Center
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
              NDMA HIGH-COMMAND
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Global incident governance, responder personnel verification, resource fleet management, and tamper-proof audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-white border border-pastel-border text-slate-600 hover:text-[#5278E8] shadow-xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5278E8]' : ''}`} />
          </button>
          <button
            onClick={() => setActivePage('analytics')}
            className="px-4 py-2 rounded-xl bg-[#5278E8] hover:bg-[#4365D0] text-white font-bold text-xs shadow-soft transition"
          >
            Analytics View
          </button>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="pastel-card p-4 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics?.total_registered_users || usersList.length}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Incidents</span>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{analytics?.active_incidents || reports.length}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Emergencies</span>
          <div className="text-2xl font-black text-rose-600 mt-0.5">{analytics?.critical_emergencies || 0}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Resolved Cases</span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">{analytics?.resolved_incidents || 0}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Verifications</span>
          <div className="text-2xl font-black text-purple-700 mt-0.5">{pendingVerificationCount}</div>
        </div>

        <div className="pastel-card p-4 border-l-4 border-l-sky-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Fleet</span>
          <div className="text-2xl font-black text-sky-700 mt-0.5">{analytics?.available_resources || 7}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white p-1 border border-pastel-border shadow-xs text-xs">
        {[
          { id: 'incidents', label: `Incident Queue (${reports.length})` },
          { id: 'users', label: `Personnel & Verifications (${usersList.length})` },
          { id: 'audit', label: `Audit Log Trail (${auditLogs.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl font-bold transition ${
              activeTab === tab.id ? 'bg-[#5278E8] text-white shadow-soft' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INCIDENTS MANAGEMENT TABLE */}
      {activeTab === 'incidents' && (
        <div className="pastel-card p-6 space-y-4 shadow-soft">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, reporter, city..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-pastel-border"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl bg-slate-50 border border-pastel-border font-bold text-slate-700"
              >
                <option value="">All Statuses</option>
                {['New', 'Under Verification', 'Verified', 'Assigned', 'Rescue in Progress', 'Resolved', 'Closed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs p-2 rounded-xl bg-slate-50 border border-pastel-border font-bold text-slate-700"
              >
                <option value="">All Severities</option>
                {['Critical', 'High', 'Medium', 'Low'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-pastel-border">
                <tr>
                  <th className="p-3">Tracking ID</th>
                  <th className="p-3">Type & Severity</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Citizen Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-[#5278E8]">{r.tracking_id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.emergency_type}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        r.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{r.location}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{r.name}</div>
                      <div className="text-slate-500 text-[11px]">{r.contact}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setNewStatus(r.status);
                          setInternalNotes('');
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-[#5278E8] hover:text-white text-[#5278E8] font-bold rounded-lg text-xs transition"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT & VERIFICATION */}
      {activeTab === 'users' && (
        <div className="pastel-card p-6 space-y-4 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <h3 className="font-extrabold text-slate-900 text-sm">Registered Personnel Directory</h3>
            <span className="text-xs font-bold text-slate-500">
              Pending Authorization: <strong className="text-purple-700">{pendingVerificationCount}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-pastel-border">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email & Phone</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Agency Affiliation</th>
                  <th className="p-3">Verification Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-slate-400">{u.phone || 'No phone'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-50 text-[#5278E8]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.agency || 'Public Citizen'}</td>
                    <td className="p-3">
                      {u.verified ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          ⏳ Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!u.verified && u.role !== 'citizen' && (
                        <button
                          onClick={() => handleVerifyUser(u.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                        >
                          Approve Credential
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS TRAIL */}
      {activeTab === 'audit' && (
        <div className="pastel-card p-6 space-y-4 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <h3 className="font-extrabold text-slate-900 text-sm">Security & Operational Audit Log Trail</h3>
            <span className="text-[10px] text-slate-400">Immutable chronological records</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-pastel-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#5278E8]">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{log.created_at?.slice(0, 19).replace('T', ' ')} UTC</span>
                </div>
                <p className="text-slate-700 font-medium">{log.details}</p>
                <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                  <span>Actor: {log.user_name || 'System / Citizen'}</span>
                  <span>• Target: {log.target_type} (#{log.target_id})</span>
                </div>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No audit events recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Status Update */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleStatusSubmit} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-soft-lg border border-pastel-border">
            <h3 className="font-extrabold text-slate-900 text-base">
              Update Incident #{selectedReport.tracking_id}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Triage Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800 font-bold"
                >
                  {['New', 'Under Verification', 'Verified', 'Assigned', 'Rescue in Progress', 'Resolved', 'Closed'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Note / Rationale</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Reason for change, resource assignment, or resolution notes..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-pastel-border bg-slate-50 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5278E8] text-white shadow-soft"
              >
                {updating ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
