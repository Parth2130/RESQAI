// RESQAI Central API Client
const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '') + '/api';

export const api = {
  // 1. System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  // 2. Authentication & User Profile
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid email or password');
    }
    return res.json();
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to retrieve user profile');
    return res.json();
  },

  // 3. Live Telemetry
  async getWeather({ lat, lon, city } = {}) {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lon !== undefined && lon !== null) params.append('lon', lon);
    const res = await fetch(`${API_BASE}/weather?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve live weather telemetry');
    return res.json();
  },

  async getEarthquakes({ minMag = 2.0, region = 'all' } = {}) {
    const params = new URLSearchParams({ min_magnitude: minMag, region });
    const res = await fetch(`${API_BASE}/earthquakes?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve USGS earthquake feed');
    return res.json();
  },

  async getAlerts() {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch disaster alerts');
    return res.json();
  },

  async getFires() {
    const res = await fetch(`${API_BASE}/fires`);
    if (!res.ok) throw new Error('Failed to fetch NASA FIRMS data');
    return res.json();
  },

  // 4. Incidents & Emergency Reports
  async getIncidents({ status, type, severity, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status_filter', status);
    if (type) params.append('type_filter', type);
    if (severity) params.append('severity_filter', severity);
    if (limit) params.append('limit', limit);
    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve citizen reports');
    return res.json();
  },

  async getReports(params) {
    return this.getIncidents(params);
  },

  async submitIncident(data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit emergency report');
    }
    return res.json();
  },

  async submitReport(data) {
    return this.submitIncident(data);
  },

  async getIncident(idOrTrackingId) {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(String(idOrTrackingId).trim())}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Incident not found');
    }
    return res.json();
  },

  async trackReport(trackingId) {
    return this.getIncident(trackingId);
  },

  async updateIncidentStatus(token, incidentId, statusValue, notes) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: statusValue, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update incident status');
    }
    return res.json();
  },

  async updateReportStatus(token, id, status, notes) {
    return this.updateIncidentStatus(token, id, status, notes);
  },

  async getAdminReports(token, { search, status, severity } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status_filter', status);
    if (severity) params.append('severity_filter', severity);
    const res = await fetch(`${API_BASE}/admin/reports?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized or session expired');
      throw new Error('Failed to fetch administrative report queue');
    }
    return res.json();
  },

  async assignIncident(token, incidentId, responderId, resourceId, notes) {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        incident_id: incidentId,
        responder_id: responderId,
        resource_id: resourceId,
        notes
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Assignment failed');
    }
    return res.json();
  },

  // 5. Emergency SOS Distress
  async triggerSOS(data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/sos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to trigger SOS beacon');
    }
    return res.json();
  },

  async getActiveSOS(token) {
    const res = await fetch(`${API_BASE}/sos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch active SOS requests');
    return res.json();
  },

  // 6. Nugen AI Modules
  async getAssistantStatus() {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to fetch AI status');
    return res.json();
  },

  async chatWithAssistant({ message, language = 'en', location, latitude, longitude, history = [] }) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        language,
        location,
        latitude,
        longitude,
        conversation_history: history
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to communicate with AI Assistant');
    }
    return res.json();
  },

  async classifyEmergency(description, location) {
    const res = await fetch(`${API_BASE}/ai/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, location })
    });
    if (!res.ok) throw new Error('Classification failed');
    return res.json();
  },

  async assessRisk(payload) {
    const res = await fetch(`${API_BASE}/ai/assess-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Risk assessment failed');
    return res.json();
  },

  async getResponseRecommendations(token, incidentId) {
    const res = await fetch(`${API_BASE}/ai/recommend-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ incident_id: incidentId })
    });
    if (!res.ok) throw new Error('Failed to fetch response recommendations');
    return res.json();
  },

  // 7. Emergency Resources
  async getResources({ category, availability } = {}) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (availability) params.append('availability', availability);
    const res = await fetch(`${API_BASE}/resources?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to retrieve emergency resources');
    return res.json();
  },

  async createResource(token, data) {
    const res = await fetch(`${API_BASE}/resources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create resource');
    }
    return res.json();
  },

  async updateResource(token, resourceId, updates) {
    const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update resource');
    return res.json();
  },

  async deleteResource(token, resourceId) {
    const res = await fetch(`${API_BASE}/resources/${resourceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete resource');
    return res.json();
  },

  // 8. Responders
  async getResponders(token, statusFilter) {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    const res = await fetch(`${API_BASE}/responders?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to retrieve responders');
    return res.json();
  },

  // 9. Smart Routing
  async planRoute({ originLat, originLon, destLat, destLon }) {
    const res = await fetch(`${API_BASE}/routing/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon
      })
    });
    if (!res.ok) throw new Error('Failed to calculate rescue route');
    return res.json();
  },

  // 10. Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error('Failed to retrieve analytics metrics');
    return res.json();
  },

  // 11. Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to retrieve notifications');
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },

  // 12. Admin Controls
  async getAuditLogs(token) {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to retrieve audit logs');
    return res.json();
  },

  async getUsers(token) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to retrieve users');
    return res.json();
  },

  async verifyUser(token, userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/verify`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to verify user');
    return res.json();
  }
};
