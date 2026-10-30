// RESQAI Central API Client
const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  // Weather (Open-Meteo)
  async getWeather({ lat, lon, city } = {}) {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lon !== undefined && lon !== null) params.append('lon', lon);
    const res = await fetch(`${API_BASE}/weather?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve live weather telemetry');
    return res.json();
  },

  // Earthquakes (USGS)
  async getEarthquakes({ minMag = 2.0, region = 'all' } = {}) {
    const params = new URLSearchParams({
      min_magnitude: minMag,
      region
    });
    const res = await fetch(`${API_BASE}/earthquakes?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve USGS earthquake feed');
    return res.json();
  },

  // NDMA SACHET Disaster Alerts
  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch disaster alerts');
    return res.json();
  },

  // NASA FIRMS Thermal Hotspots
  async getFires() {
    const res = await fetch(`${API_BASE}/fires`);
    if (!res.ok) throw new Error('Failed to fetch NASA FIRMS data');
    return res.json();
  },

  // Public Citizen Reports List
  async getReports({ status, type, severity } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status_filter', status);
    if (type) params.append('type_filter', type);
    if (severity) params.append('severity_filter', severity);
    const res = await fetch(`${API_BASE}/reports?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve citizen reports');
    return res.json();
  },

  // Submit Citizen Emergency SOS Report
  async submitReport(reportData) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit emergency report');
    }
    return res.json();
  },

  // Track Emergency Report by Tracking ID
  async trackReport(trackingId) {
    const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(trackingId.trim().toUpperCase())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Report not found with the specified tracking ID');
    }
    return res.json();
  },

  // AI Assistant Status
  async getAssistantStatus() {
    const res = await fetch(`${API_BASE}/assistant/status`);
    if (!res.ok) throw new Error('Failed to fetch assistant status');
    return res.json();
  },

  // AI Assistant Chat (Nugen AI)
  async chatWithAssistant({ message, language = 'en', location, latitude, longitude, history = [] }) {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        location,
        latitude,
        longitude,
        conversation_history: history
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to communicate with AI Assistant');
    }
    return res.json();
  },

  // Admin Login
  async adminLogin(email, password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid administrative credentials');
    }
    return res.json();
  },

  // Admin Get Reports (includes confidential citizen contact)
  async getAdminReports(token, { search, status, severity } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status_filter', status);
    if (severity) params.append('severity_filter', severity);

    const res = await fetch(`${API_BASE}/admin/reports?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized or session expired');
      throw new Error('Failed to fetch administrative report queue');
    }
    return res.json();
  },

  // Admin Update Report Status & History
  async updateReportStatus(token, reportId, statusValue, notes) {
    const res = await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: statusValue, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update report status');
    }
    return res.json();
  }
};
