import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

const SEVERITY_COLORS = {
  'Critical': '#EF4444',
  'High': '#F59E0B',
  'Medium': '#38BDF8',
  'Low': '#22C55E'
};

const CATEGORY_COLORS = ['#5278E8', '#A5B4FC', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#818CF8', '#C084FC'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#5278E8] animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Compiling live telemetry & database records...</p>
      </div>
    );
  }

  const categoryChartData = data?.category_distribution || [];
  const severityChartData = data?.severity_distribution || [];
  const statusChartData = data?.status_distribution || [];
  const timelineData = data?.timeline || [];

  const resolutionRate = data?.total_incidents 
    ? Math.round((data.resolved_incidents / data.total_incidents) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Disaster Operations Analytics
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
              LIVE SQL TELEMETRY
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Real-time incident distribution, severity breakdowns, and timeline response trends grounded in verified database logs.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl bg-white border border-pastel-border text-slate-600 hover:text-[#5278E8] shadow-xs transition self-start sm:self-auto flex items-center space-x-1 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5278E8]' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pastel-card p-5 border-l-4 border-l-[#5278E8]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Events</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{data?.total_incidents || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Ground incidents logged</div>
        </div>

        <div className="pastel-card p-5 border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical Peril Emergencies</span>
          <div className="text-3xl font-black text-rose-600 mt-1">{data?.critical_emergencies || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Urgent immediate triage required</div>
        </div>

        <div className="pastel-card p-5 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Triage Resolution Rate</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{resolutionRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{data?.resolved_incidents || 0} cases resolved/closed</div>
        </div>

        <div className="pastel-card p-5 border-l-4 border-l-purple-500">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SOS Distress Transmissions</span>
          <div className="text-3xl font-black text-purple-700 mt-1">{data?.sos_distress_count || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Instant beacon triggers</div>
        </div>
      </div>

      {/* Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Incidents by Category (Bar Chart) - 7 Cols */}
        <div className="lg:col-span-7 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#5278E8]" />
              <h3 className="font-extrabold text-slate-900 text-sm">Incidents by Hazard Category</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">Volume Count</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E8ECF5', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="count" fill="#5278E8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Distribution (Donut / Pie Chart) - 5 Cols */}
        <div className="lg:col-span-5 pastel-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">Severity Proportion</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">Triage Grades</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="severity"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SEVERITY_COLORS[entry.severity] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E8ECF5', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(val) => <span className="text-xs text-slate-600 font-semibold">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: 7-Day Timeline Trends (Area Chart) */}
      <div className="pastel-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pastel-border">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">7-Day Incident Triage & Resolution Timeline</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Daily Volume Trends</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5278E8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#5278E8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E8ECF5', 
                  borderRadius: '12px',
                  fontSize: '12px'
                }} 
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                height={36}
                formatter={(val) => <span className="text-xs text-slate-600 font-semibold capitalize">{val}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="incidents" 
                stroke="#5278E8" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorIncidents)" 
                name="New Incidents"
              />
              <Area 
                type="monotone" 
                dataKey="resolved" 
                stroke="#22C55E" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorResolved)" 
                name="Resolved Cases"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
