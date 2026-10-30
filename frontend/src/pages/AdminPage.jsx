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
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('resqai_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    const saved = sessionStorage.getItem('resqai_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [email, setEmail] = useState('admin@resqai.in');
  const [password, setPassword] = useState('ResqAdmin@2026');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Selected report modal for status update
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('Acknowledged');
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  const fetchAdminReports = async () => {
    if (!token) return;
    setLoadingReports(true);
    try {
      const data = await api.getAdminReports(token, {
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setReports(data || []);
    } catch (err) {
      console.error(err);
      if (err.message.includes('Unauthorized') || err.message.includes('expired')) {
        handleLogout();
      }
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminReports();
    }
  }, [token, statusFilter, severityFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await api.adminLogin(email.trim(), password);
      setToken(res.access_token);
      setAdminUser(res.user);
      sessionStorage.setItem('resqai_admin_token', res.access_token);
      sessionStorage.setItem('resqai_admin_user', JSON.stringify(res.user));
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setAdminUser(null);
    sessionStorage.removeItem('resqai_admin_token');
    sessionStorage.removeItem('resqai_admin_user');
  };

  const handleOpenStatusModal = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setInternalNotes('');
    setUpdateSuccess(null);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setUpdating(true);
    try {
      const updated = await api.updateReportStatus(
        token,
        selectedReport.id,
        newStatus,
        internalNotes.trim() || `Status updated to ${newStatus}`
      );
      setUpdateSuccess("Status updated successfully.");
      setSelectedReport(updated);
      fetchAdminReports();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // If not logged in, show Login Screen
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl border-resq-border shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-resq-blue/20 text-resq-cyan flex items-center justify-center mx-auto border border-blue-500/30 shadow-glow-blue">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Control Room Login
            </h1>
            <p className="text-xs text-slate-400">
              Protected authentication for incident response commanders and administrative dispatch personnel.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Officer Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-resq-dark border border-resq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-resq-blue transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 rounded-xl bg-resq-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-blue transition active:scale-98"
              >
                {loginLoading ? 'Authenticating Officer...' : 'Access Incident Command'}
              </button>
            </div>
          </form>

          <div className="bg-resq-dark/50 p-3 rounded-xl border border-resq-border/60 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 block mb-0.5">Initial Demo Credentials:</span>
            <span>Email: <code className="text-cyan-300 font-mono">admin@resqai.in</code></span><br />
            <span>Password: <code className="text-cyan-300 font-mono">ResqAdmin@2026</code></span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const criticalCount = reports.filter(r => r.severity === 'Critical').length;
  const underReviewCount = reports.filter(r => r.status === 'Under Review').length;
  const acknowledgedCount = reports.filter(r => r.status === 'Acknowledged').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved' || r.status === 'Closed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-resq-border/80">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Incident Control Room Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Authenticated
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <strong>{adminUser?.name || 'Administrator'}</strong> ({adminUser?.email})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAdminReports}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-resq-card hover:bg-resq-cardLight text-slate-200 border border-resq-border text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-resq-cyan ${loadingReports ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-resq-border">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total SOS Reports</span>
          <span className="text-2xl font-black text-white mt-1 block">{reports.length}</span>
          <span className="text-[10px] text-slate-500">Live Database Records</span>
        </div>

        <div className="glass-panel-danger p-4 rounded-2xl border-red-500/40">
          <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider block">Critical Threats</span>
          <span className="text-2xl font-black text-red-400 mt-1 block">{criticalCount}</span>
          <span className="text-[10px] text-red-300/80">Immediate Life Risk</span>
        </div>

        <div className="glass-panel-warning p-4 rounded-2xl border-amber-500/40">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Under Triage / Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{underReviewCount + acknowledgedCount}</span>
          <span className="text-[10px] text-amber-300/80">Active Coordination</span>
        </div>

        <div className="glass-panel-success p-4 rounded-2xl border-emerald-500/40">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Resolved / Closed</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{resolvedCount}</span>
          <span className="text-[10px] text-emerald-300/80">Incident Cleared</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border-resq-border flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAdminReports()}
            placeholder="Search by Tracking ID, citizen name, location, or emergency type..."
            className="w-full bg-resq-dark border border-resq-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-resq-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-resq-dark border border-resq-border rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-resq-dark border border-resq-border rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            onClick={fetchAdminReports}
            className="px-4 py-2 rounded-xl bg-resq-blue hover:bg-blue-600 text-white font-bold text-xs shadow-glow-blue transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel rounded-2xl border-resq-border overflow-hidden">
        <div className="p-4 border-b border-resq-border flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-resq-cyan" />
            Active Emergency Queue ({reports.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Confidential View Enabled</span>
        </div>

        {loadingReports ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Fetching secure admin report records...
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-resq-dark/80 text-slate-400 border-b border-resq-border">
                  <th className="p-3.5 font-bold uppercase tracking-wider">Tracking ID</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Citizen & Contact</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Emergency Type</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Location</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Severity</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-resq-border/60">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-resq-cardLight/50 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      {report.tracking_id}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold text-white">{report.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-resq-cyan" />
                        <a href={`tel:${report.contact}`} className="hover:underline">{report.contact}</a>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{report.emergency_type}</span>
                      <div className="text-[10px] text-slate-500">Affected: {report.affected_count}</div>
                    </td>

                    <td className="p-3.5 max-w-[200px] truncate text-slate-300">
                      {report.location}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        report.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : report.severity === 'High'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}>
                        {report.severity}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-semibold text-white bg-resq-dark px-2 py-0.5 rounded border border-resq-border text-[11px]">
                        {report.status}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                      {new Date(report.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenStatusModal(report)}
                        className="px-3 py-1.5 rounded-lg bg-resq-blue hover:bg-blue-600 text-white font-bold text-xs transition"
                      >
                        Manage Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            No incident reports found matching filter parameters.
          </div>
        )}
      </div>

      {/* Status Update & Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border-resq-border w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-resq-border">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-white font-mono text-cyan-400">
                    {selectedReport.tracking_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-resq-dark text-slate-300 border border-resq-border">
                    {selectedReport.emergency_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Reported by: <strong className="text-white">{selectedReport.name}</strong> ({selectedReport.contact})
                </p>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}

            {/* Incident Details Summary */}
            <div className="bg-resq-dark/80 p-4 rounded-xl border border-resq-border space-y-2 text-xs text-slate-300">
              <div>Location: <strong className="text-white">{selectedReport.location}</strong></div>
              <div>People Affected: <strong className="text-white">{selectedReport.affected_count}</strong></div>
              <div>Description: <p className="text-white mt-1 leading-relaxed bg-resq-card p-2.5 rounded-lg border border-resq-border">{selectedReport.description}</p></div>
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-resq-cyan" />
                Update Operational Status
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Select New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-resq-blue cursor-pointer"
                  >
                    <option value="Submitted">Submitted (Initial)</option>
                    <option value="Under Review">Under Review (Assessing)</option>
                    <option value="Acknowledged">Acknowledged (Dispatched / Alerted)</option>
                    <option value="Resolved">Resolved (Assistance Delivered)</option>
                    <option value="Closed">Closed (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Responder Notes / Public Update
                  </label>
                  <input
                    type="text"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="e.g. Unit 4 dispatched; water levels subsiding."
                    className="w-full bg-resq-dark border border-resq-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-resq-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-resq-dark text-slate-300 hover:text-white border border-resq-border text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-resq-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow-blue transition"
                >
                  {updating ? 'Saving...' : 'Update & Log Audit Entry'}
                </button>
              </div>
            </form>

            {/* Audit History Log */}
            {selectedReport.history && selectedReport.history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-resq-border">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Status History Trail
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedReport.history.map((h) => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-resq-dark/50 border border-resq-border text-xs">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>{h.updated_by}</span>
                        <span>{new Date(h.updated_at).toLocaleString()}</span>
                      </div>
                      <div className="text-white font-semibold mt-0.5">Status: {h.new_status}</div>
                      {h.notes && <div className="text-slate-300 text-[11px] mt-0.5">{h.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
