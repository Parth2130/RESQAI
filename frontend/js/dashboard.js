/**
 * RESQAI Operations Dashboard Script
 * Connects directly to FastAPI backend, updates metrics, charts, mini-map, and modal dispatch.
 */

let miniMap = null;
let miniMapMarkersGroup = null;
let riskChart = null;
let statusChart = null;
let allIncidents = [];
let currentFilter = "All";
let selectedIncidentId = null;

document.addEventListener("DOMContentLoaded", () => {
  initMiniMap();
  initCharts();
  loadDashboardData();

  // Refresh button
  const refreshBtn = document.getElementById("btn-refresh-dashboard");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.querySelector("i")?.classList.add("spin-icon");
      loadDashboardData().finally(() => {
        setTimeout(() => refreshBtn.querySelector("i")?.classList.remove("spin-icon"), 600);
      });
    });
  }

  // Recenter button
  const recenterBtn = document.getElementById("btn-recenter-mini-map");
  if (recenterBtn && miniMap) {
    recenterBtn.addEventListener("click", () => {
      miniMap.setView([CONFIG.PUNE_COORDINATES.lat, CONFIG.PUNE_COORDINATES.lng], CONFIG.PUNE_COORDINATES.defaultZoom);
    });
  }

  // Filter tabs
  document.querySelectorAll("#incident-filter-tabs .filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#incident-filter-tabs .filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      renderPriorityIncidentsTable();
    });
  });

  // Modal event listeners
  initModalListeners();

  // Auto-refresh interval (every 30 seconds)
  setInterval(() => {
    loadDashboardData(true);
  }, CONFIG.REFRESH_INTERVAL_MS);
});

// Initialize Leaflet Mini-Map
function initMiniMap() {
  const container = document.getElementById("mini-map");
  if (!container || miniMap) return;

  miniMap = L.map("mini-map", {
    zoomControl: true,
    attributionControl: false
  }).setView([CONFIG.PUNE_COORDINATES.lat, CONFIG.PUNE_COORDINATES.lng], CONFIG.PUNE_COORDINATES.defaultZoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(miniMap);

  miniMapMarkersGroup = L.layerGroup().addTo(miniMap);
}

// Initialize Chart.js
function initCharts() {
  // 1. Risk Chart
  const riskCtx = document.getElementById("risk-chart-canvas");
  if (riskCtx) {
    riskChart = new Chart(riskCtx, {
      type: "doughnut",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ["#FF626D", "#FFAA45", "#FFA000", "#18B89A"],
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
          }
        },
        cutout: "68%"
      }
    });
  }

  // 2. Status Chart
  const statusCtx = document.getElementById("status-chart-canvas");
  if (statusCtx) {
    statusChart = new Chart(statusCtx, {
      type: "bar",
      data: {
        labels: ["Reported", "Verified", "Assigned", "In Progress", "Resolved"],
        datasets: [{
          label: "Incidents",
          data: [0, 0, 0, 0, 0],
          backgroundColor: ["#FFAA45", "#2583F5", "#8B7CF6", "#FF626D", "#18B89A"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: "'Plus Jakarta Sans', sans-serif" } },
            grid: { color: "#F0F4F8" }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 } }
          }
        }
      }
    });
  }
}

// Master Data Loader
async function loadDashboardData(silent = false) {
  try {
    // 1. Load Summary Stats
    const stats = await API.getStats(silent);
    updateSummaryStats(stats);

    // 2. Load Weather
    loadWeather();

    // 3. Load Incidents
    const incidents = await API.getIncidents();
    allIncidents = incidents;
    renderPriorityIncidentsTable();
    updateMiniMapMarkers(incidents);
    updateCharts(incidents);

    // 4. Load Activity Feed from Alerts
    loadActivityFeed();

    // Update timestamp
    const timeEl = document.getElementById("last-updated-time");
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = `Updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  } catch (err) {
    console.error("Dashboard reload failed:", err);
  }
}

// Update the 8 Stat Cards
function updateSummaryStats(stats) {
  document.getElementById("stat-total-incidents").textContent = stats.total_incidents || 0;
  document.getElementById("stat-active-incidents-sub").textContent = `${stats.active_incidents || 0} Active in pipeline`;
  
  document.getElementById("stat-critical-incidents").textContent = stats.critical_incidents || 0;
  document.getElementById("stat-high-incidents").textContent = stats.high_incidents || 0;
  
  document.getElementById("stat-assigned-teams").textContent = stats.assigned_resources || 0;
  document.getElementById("stat-total-teams-sub").textContent = `out of ${stats.total_resources || 0} units (${stats.available_resources || 0} available)`;
  
  document.getElementById("stat-ambulances").textContent = stats.available_ambulances || 0;
  document.getElementById("stat-open-shelters").textContent = stats.open_shelters || 0;
  document.getElementById("stat-shelters-sub").textContent = `${stats.total_shelters || 0} total registered`;
  
  document.getElementById("stat-people-at-risk").textContent = (stats.people_at_risk || 0).toLocaleString();
  document.getElementById("stat-people-assist-sub").textContent = `${stats.people_needing_assistance || 0} needing urgent extraction`;
  
  document.getElementById("stat-resolved-incidents").textContent = stats.resolved_incidents || 0;
}

// Load Weather Advisory
async function loadWeather() {
  try {
    const w = await API.getWeather();
    document.getElementById("weather-condition-text").textContent = `${w.location_name}: ${w.condition}`;
    document.getElementById("weather-advisory-text").textContent = w.advisory || "Monitor low-lying sectors.";
    document.getElementById("weather-temp-badge").textContent = `${w.temperature_c}°C`;
    document.getElementById("weather-rain-badge").textContent = `${w.precipitation_mm} mm Rain`;
    document.getElementById("weather-wind-badge").textContent = `${w.wind_speed_kmh} km/h Wind`;
  } catch (e) {
    // Keep fallback
  }
}

// Update Mini-Map Pins
function updateMiniMapMarkers(incidents) {
  if (!miniMap || !miniMapMarkersGroup) return;
  miniMapMarkersGroup.clearLayers();

  const bounds = [];

  incidents.forEach(inc => {
    if (inc.latitude && inc.longitude) {
      const latLng = [inc.latitude, inc.longitude];
      bounds.push(latLng);

      const sev = inc.severity ? inc.severity.toLowerCase() : "medium";
      let pinClass = `pin-${sev}`;
      if (inc.status === "Resolved") pinClass = "pin-low";

      const customIcon = L.divIcon({
        className: "",
        html: `<div class="custom-map-pin ${pinClass}"><i data-lucide="alert-circle" style="width:16px;height:16px;"></i></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker(latLng, { icon: customIcon });
      marker.bindPopup(`
        <div class="popup-container">
          <div class="popup-header">
            <span class="status-pill status-${inc.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(inc.status)}</span>
            <span style="font-weight:700; color:var(--coral); font-size:0.75rem;">Risk: ${inc.risk_score}</span>
          </div>
          <div class="popup-title">${escapeHTML(inc.title)}</div>
          <div class="popup-meta"><i data-lucide="map-pin" style="width:12px;"></i> ${escapeHTML(inc.location_name)}</div>
          <div style="font-size:0.78rem; margin-bottom:8px;"><strong>Affected:</strong> ${inc.people_affected} (${inc.people_needing_assistance} need assistance)</div>
          <button class="btn btn-primary btn-sm" onclick="openDispatchModal(${inc.id})" style="width:100%;">
            View & Dispatch
          </button>
        </div>
      `);

      miniMapMarkersGroup.addLayer(marker);
    }
  });

  if (window.lucide) window.lucide.createIcons();

  if (bounds.length > 0) {
    miniMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }
}

// Render Priority Incidents Table
function renderPriorityIncidentsTable() {
  const tbody = document.getElementById("priority-incidents-tbody");
  if (!tbody) return;

  let filtered = allIncidents;

  if (currentFilter !== "All") {
    if (["Critical", "High", "Medium", "Low"].includes(currentFilter)) {
      filtered = filtered.filter(i => i.severity === currentFilter);
    } else {
      // By disaster type
      filtered = filtered.filter(i => i.incident_type === currentFilter);
    }
  }

  // Hide resolved incidents in priority triage view unless specifically filtered
  if (currentFilter === "All") {
    filtered = filtered.filter(i => !["Resolved", "Closed"].includes(i.status));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state" style="padding: 30px;">
            <p>No incidents match the active filter '${currentFilter}'.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(inc => {
    const sev = inc.severity || "Medium";
    const sevClass = sev.toLowerCase();
    const statusSlug = (inc.status || "reported").toLowerCase().replace(/\s+/g, '-');

    return `
      <tr>
        <td>
          <strong style="color:var(--primary); font-size:0.84rem;">${escapeHTML(inc.incident_code)}</strong>
        </td>
        <td>
          <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${escapeHTML(inc.title)}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px; margin-top:2px;">
            <i data-lucide="map-pin" style="width:12px; height:12px;"></i> ${escapeHTML(inc.location_name)}
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="alert-badge badge-${sevClass}">${escapeHTML(sev)}</span>
            <span style="font-weight:800; font-size:0.82rem; color:${inc.risk_score >= 75 ? 'var(--coral)' : (inc.risk_score >= 50 ? 'var(--orange)' : 'var(--teal)')}">
              ${inc.risk_score}
            </span>
          </div>
        </td>
        <td>
          <span style="font-weight:600;">${inc.people_affected}</span>
          ${inc.people_needing_assistance > 0 ? `<div style="font-size:0.72rem; color:var(--coral); font-weight:700;">${inc.people_needing_assistance} urgent</div>` : ''}
        </td>
        <td>
          ${inc.assigned_resource_name ? `
            <span style="font-size:0.82rem; font-weight:700; color:var(--purple); display:flex; align-items:center; gap:4px;">
              <i data-lucide="shield" style="width:13px;"></i> ${escapeHTML(inc.assigned_resource_name)}
            </span>
          ` : `
            <span style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">None assigned</span>
          `}
        </td>
        <td>
          <span class="status-pill status-${statusSlug}">${escapeHTML(inc.status)}</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openDispatchModal(${inc.id})" title="View Risk & Dispatch Asset">
            <i data-lucide="send" style="width:14px; height:14px;"></i> Action
          </button>
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

// Update Charts from live incident collection
function updateCharts(incidents) {
  if (riskChart) {
    const crit = incidents.filter(i => i.risk_level === "Critical").length;
    const high = incidents.filter(i => i.risk_level === "High").length;
    const med = incidents.filter(i => i.risk_level === "Medium").length;
    const low = incidents.filter(i => i.risk_level === "Low").length;

    riskChart.data.datasets[0].data = [crit, high, med, low];
    riskChart.update();
  }

  if (statusChart) {
    const rep = incidents.filter(i => i.status === "Reported").length;
    const ver = incidents.filter(i => i.status === "Verified").length;
    const ass = incidents.filter(i => i.status === "Assigned").length;
    const rip = incidents.filter(i => i.status === "Response in Progress").length;
    const res = incidents.filter(i => ["Resolved", "Closed"].includes(i.status)).length;

    statusChart.data.datasets[0].data = [rep, ver, ass, rip, res];
    statusChart.update();
  }
}

// Load Activity Feed
async function loadActivityFeed() {
  const container = document.getElementById("dashboard-activity-feed");
  if (!container) return;

  try {
    const alerts = await API.getAlerts();
    if (alerts.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-muted);">No activity logged.</div>`;
      return;
    }

    container.innerHTML = alerts.slice(0, 5).map(a => {
      const sev = a.severity.toLowerCase();
      let dotClass = "dot-teal";
      if (sev === "critical") dotClass = "dot-critical";
      if (sev === "high") dotClass = "dot-high";

      return `
        <div class="timeline-item">
          <div class="timeline-dot ${dotClass}">
            <i data-lucide="${sev === 'critical' ? 'alert-octagon' : (a.alert_type === 'Dispatch' ? 'truck' : 'info')}" style="width:16px; height:16px;"></i>
          </div>
          <div class="timeline-body">
            <h5>${escapeHTML(a.alert_type)} Update</h5>
            <p>${escapeHTML(a.message)}</p>
            <span class="timeline-time">${formatDateTime(a.created_at)}</span>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    container.innerHTML = `<div style="color:var(--text-muted); text-align:center;">Feed unavailable</div>`;
  }
}

// Modal Handlers for View & Dispatch
function initModalListeners() {
  const modal = document.getElementById("dispatch-modal-overlay");
  const closeBtn = document.getElementById("modal-close-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const getRecsBtn = document.getElementById("modal-get-recommendations-btn");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("open");

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (getRecsBtn) {
    getRecsBtn.addEventListener("click", async () => {
      if (!selectedIncidentId) return;
      getRecsBtn.disabled = true;
      getRecsBtn.innerHTML = `<div class="spinner" style="width:14px; height:14px;"></div> Analyzing Assets...`;
      await loadResourceRecommendations(selectedIncidentId);
      getRecsBtn.disabled = false;
      getRecsBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Re-Calculate`;
      if (window.lucide) window.lucide.createIcons();
    });
  }
}

// Open Dispatch Modal
window.openDispatchModal = async function(incidentId) {
  selectedIncidentId = incidentId;
  const modal = document.getElementById("dispatch-modal-overlay");
  if (!modal) return;

  try {
    const inc = await API.getIncident(incidentId);
    
    document.getElementById("modal-incident-title").textContent = `[${inc.incident_code}] ${inc.title}`;
    
    document.getElementById("modal-incident-meta").innerHTML = `
      <div><strong>Type:</strong> ${escapeHTML(inc.incident_type)} | <strong>Location:</strong> ${escapeHTML(inc.location_name)}</div>
      <div style="margin-top:4px;"><strong>Description:</strong> ${escapeHTML(inc.description)}</div>
      <div style="margin-top:4px;"><strong>Affected:</strong> ${inc.people_affected} people (${inc.people_needing_assistance} needing extraction)</div>
    `;

    const pill = document.getElementById("modal-risk-pill");
    pill.textContent = `Risk: ${inc.risk_score}/100 (${inc.risk_level})`;
    pill.className = `status-pill status-${inc.severity.toLowerCase()}`;

    const factorsContainer = document.getElementById("modal-risk-factors");
    const factors = inc.risk_factors || [];
    const limitations = inc.risk_limitations || [];

    factorsContainer.innerHTML = `
      <div style="margin-bottom:6px;"><strong>Contributing Factors:</strong></div>
      <ul style="padding-left:18px; margin-bottom:8px;">
        ${factors.map(f => `<li>${escapeHTML(f)}</li>`).join("")}
      </ul>
      <div style="font-size:0.75rem; color:var(--text-muted);">
        <strong>Uncertainty / Limitations:</strong> ${limitations.map(l => escapeHTML(l)).join(" ")}
      </div>
    `;

    // Clear previous recommendations
    const recsList = document.getElementById("modal-recommendations-list");
    recsList.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">Click 'AI Recommend Assets' to generate ranked rescue units.</div>`;

    modal.classList.add("open");
    if (window.lucide) window.lucide.createIcons();

    // Automatically trigger recommendations for convenience
    loadResourceRecommendations(incidentId);
  } catch (err) {
    showToast("Failed to load incident details.", "error");
  }
};

// Load and Render Dispatch Recommendations
async function loadResourceRecommendations(incidentId) {
  const container = document.getElementById("modal-recommendations-list");
  if (!container) return;

  try {
    container.innerHTML = `<div style="text-align:center; padding:20px;"><div class="spinner spinner-primary"></div><div style="margin-top:8px;">Evaluating proximity & capability affinity...</div></div>`;

    const res = await API.recommendResources(incidentId);
    const recs = res.recommendations || [];

    if (recs.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:15px; color:var(--text-secondary);">No registered rescue units found in registry.</div>`;
      return;
    }

    container.innerHTML = recs.map(r => {
      const isAvail = r.is_available;
      const distText = r.distance_km !== null ? `${r.distance_km} km away` : "Distance N/A";

      return `
        <div style="background:white; border:1px solid ${isAvail ? 'var(--border-color)' : '#FED7D7'}; border-radius:var(--radius-sm); padding:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="color:var(--text-main); font-size:0.88rem;">${escapeHTML(r.name)}</strong>
              <span class="status-pill ${isAvail ? 'status-available' : 'status-unavailable'}" style="font-size:0.68rem;">
                ${escapeHTML(r.current_status)}
              </span>
              <span style="font-size:0.75rem; font-weight:700; color:var(--primary);">
                Match: ${r.suitability_score}%
              </span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:2px;">
              ${escapeHTML(r.resource_type)} • Capacity: ${r.capacity} • ${distText}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); margin-top:3px;">
              ${r.recommendation_reasons.slice(0, 2).map(re => escapeHTML(re)).join(" | ")}
            </div>
          </div>

          <div>
            ${isAvail ? `
              <button class="btn btn-primary btn-sm" onclick="executeAssignResource(${incidentId}, ${r.resource_id}, '${escapeHTML(r.name)}')">
                <i data-lucide="check"></i> Dispatch
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" disabled style="opacity:0.6; cursor:not-allowed;">
                Unavailable
              </button>
            `}
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div style="color:var(--coral); text-align:center; padding:10px;">Failed to generate recommendations: ${err.message}</div>`;
  }
}

// Assign Resource Action
window.executeAssignResource = async function(incidentId, resourceId, resourceName) {
  if (!confirm(`Confirm dispatch of ${resourceName} to this incident?`)) {
    return;
  }

  try {
    await API.assignResource(incidentId, resourceId, "Dispatched from Operations Command Dashboard.");
    showToast(`Successfully dispatched ${resourceName}!`, "success");
    
    // Close modal & reload dashboard
    document.getElementById("dispatch-modal-overlay")?.classList.remove("open");
    loadDashboardData();
  } catch (err) {
    showToast(`Dispatch failed: ${err.message}`, "error");
  }
};
