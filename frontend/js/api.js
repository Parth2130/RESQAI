/**
 * RESQAI API Client and Reusable Utilities
 * Centralized HTTP communication with error handling, toasts, and input sanitization.
 */

// Global Toast Notification Manager
function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("resqai-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "resqai-toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `resqai-toast toast-${type}`;
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  if (type === "danger" || type === "error") icon = "alert-circle";
  if (type === "warning") icon = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon"></i>
    <div class="toast-content">${escapeHTML(message)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// XSS Sanitizer Helper
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format ISO timestamp to human friendly localized time
function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return isoString;
  }
}

// Core Fetch Wrapper
async function fetchApi(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMsg = errorData.detail.map(d => `${d.loc ? d.loc.slice(-1) : ''}: ${d.msg}`).join(", ");
          } else {
            errorMsg = errorData.detail;
          }
        }
      } catch (jsonErr) {
        // Not a JSON error
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    // Don't show toast for repetitive polling if silent flag provided
    if (!options.silent) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        showToast("Cannot connect to RESQAI backend server. Please verify FastAPI is running at http://127.0.0.1:8000", "danger", 6000);
      } else {
        showToast(err.message, "danger");
      }
    }
    throw err;
  }
}

// RESQAI API Namespace
const API = {
  // General
  getHealth: () => fetchApi("/health"),
  getStats: (silent = false) => fetchApi("/stats", { silent }),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.severity && params.severity !== "All") query.append("severity", params.severity);
    if (params.incident_type && params.incident_type !== "All") query.append("incident_type", params.incident_type);
    if (params.search) query.append("search", params.search);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.sort_order) query.append("sort_order", params.sort_order);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi(`/incidents${qs}`);
  },
  getIncident: (id) => fetchApi(`/incidents/${id}`),
  createIncident: (data) => fetchApi("/incidents", { method: "POST", body: JSON.stringify(data) }),
  updateIncident: (id, data) => fetchApi(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  updateIncidentStatus: (id, status, note = null) => 
    fetchApi(`/incidents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
  deleteIncident: (id) => fetchApi(`/incidents/${id}`, { method: "DELETE" }),
  addIncidentNote: (id, note, author = "Operations Officer") =>
    fetchApi(`/incidents/${id}/notes`, { method: "POST", body: JSON.stringify({ note, author }) }),

  // Risk
  assessRisk: (data) => fetchApi("/risk/assess", { method: "POST", body: JSON.stringify(data) }),

  // Resources
  getResources: (params = {}) => {
    const query = new URLSearchParams();
    if (params.resource_type && params.resource_type !== "All") query.append("resource_type", params.resource_type);
    if (params.status && params.status !== "All") query.append("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi(`/resources${qs}`);
  },
  createResource: (data) => fetchApi("/resources", { method: "POST", body: JSON.stringify(data) }),
  updateResource: (id, data) => fetchApi(`/resources/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  releaseResource: (id) => fetchApi(`/resources/${id}/release`, { method: "POST" }),
  recommendResources: (incidentId) => fetchApi(`/incidents/${incidentId}/recommend-resources`, { method: "POST" }),
  assignResource: (incidentId, resourceId, notes = "") =>
    fetchApi(`/incidents/${incidentId}/assign-resource`, {
      method: "POST",
      body: JSON.stringify({ resource_id: resourceId, notes })
    }),

  // Shelters
  getShelters: () => fetchApi("/shelters"),
  getShelter: (id) => fetchApi(`/shelters/${id}`),
  createShelter: (data) => fetchApi("/shelters", { method: "POST", body: JSON.stringify(data) }),
  updateShelter: (id, data) => fetchApi(`/shelters/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Map Feeds
  getMapIncidents: () => fetchApi("/map/incidents"),
  getMapResources: () => fetchApi("/map/resources"),
  getMapShelters: () => fetchApi("/map/shelters"),

  // Routing
  recommendRoute: (originLat, originLng, destLat, destLng, resourceType = "Standard Rescue") =>
    fetchApi("/routes/recommend", {
      method: "POST",
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
        resource_type: resourceType,
        avoid_critical_hazards: true
      })
    }),

  // Weather & Places
  getWeather: (lat = null, lon = null) => {
    const qs = (lat && lon) ? `?lat=${lat}&lon=${lon}` : "";
    return fetchApi(`/weather${qs}`);
  },
  getFacilities: () => fetchApi("/facilities"),

  // Alerts
  getAlerts: (unreadOnly = false) => fetchApi(`/alerts?unread_only=${unreadOnly}`),
  markAlertRead: (id) => fetchApi(`/alerts/${id}/read`, { method: "PATCH" }),
  markAllAlertsRead: () => fetchApi("/alerts/mark-all-read", { method: "POST" }),

  // Analytics
  getAnalyticsSummary: () => fetchApi("/analytics/summary")
};

window.API = API;
window.showToast = showToast;
window.escapeHTML = escapeHTML;
window.formatDateTime = formatDateTime;
