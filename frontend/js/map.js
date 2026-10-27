/**
 * RESQAI Geospatial Disaster Map Script
 * Leaflet map visualization, multi-layer toggles, and hazard-aware corridor routing.
 */

let map = null;
let incidentsLayer = null;
let resourcesLayer = null;
let sheltersLayer = null;
let routeLayer = null;

let allIncidentsData = [];
let allResourcesData = [];
let allSheltersData = [];

document.addEventListener("DOMContentLoaded", () => {
  initMainMap();
  loadMapData();
  initLayerToggles();
  initMapControlButtons();
  initRoutePlanner();
});

function initMainMap() {
  const container = document.getElementById("disaster-map");
  if (!container || map) return;

  map = L.map("disaster-map", {
    zoomControl: true,
    attributionControl: false
  }).setView([CONFIG.PUNE_COORDINATES.lat, CONFIG.PUNE_COORDINATES.lng], CONFIG.PUNE_COORDINATES.defaultZoom);

  // OpenStreetMap Tile Layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  // Initialize Layer Groups
  incidentsLayer = L.layerGroup().addTo(map);
  resourcesLayer = L.layerGroup().addTo(map);
  sheltersLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  // Map Click (coordinates logger)
  map.on("click", (e) => {
    console.log(`Map clicked: [${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}]`);
  });
}

// Master Map Data Loader
async function loadMapData() {
  try {
    const [incidentsRes, resourcesRes, sheltersRes] = await Promise.all([
      API.getMapIncidents(),
      API.getMapResources(),
      API.getMapShelters()
    ]);

    allIncidentsData = (incidentsRes.features || []).map(f => f.properties);
    allResourcesData = (resourcesRes.features || []).map(f => f.properties);
    allSheltersData = (sheltersRes.features || []).map(f => f.properties);

    renderIncidentMarkers(allIncidentsData);
    renderResourceMarkers(allResourcesData);
    renderShelterMarkers(allSheltersData);

    // Update marker count badge
    const totalCount = allIncidentsData.length + allResourcesData.length + allSheltersData.length;
    document.getElementById("map-total-markers-count").textContent = `${totalCount} Objects Plotted`;

    // Populate route planner dropdowns
    populateRouteDropdowns(allResourcesData, allIncidentsData);

    // Fit map bounds to encompass all plotted points
    fitAllPlottedObjects();

  } catch (err) {
    showToast(`Failed to load geospatial data: ${err.message}`, "error");
  }
}

// Render Incident Pins
function renderIncidentMarkers(incidents) {
  incidentsLayer.clearLayers();

  incidents.forEach(inc => {
    if (!inc.latitude || !inc.longitude) return;

    const sev = inc.severity ? inc.severity.toLowerCase() : "medium";
    let pinClass = `pin-${sev}`;
    if (inc.status === "Resolved") pinClass = "pin-low";

    const customIcon = L.divIcon({
      className: "",
      html: `<div class="custom-map-pin ${pinClass}"><i data-lucide="alert-octagon" style="width:16px;height:16px;"></i></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });
    
    marker.bindPopup(`
      <div class="popup-container">
        <div class="popup-header">
          <span style="font-weight:800; color:var(--primary); font-size:0.8rem;">${escapeHTML(inc.incident_code)}</span>
          <span class="status-pill status-${inc.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(inc.status)}</span>
        </div>
        <div class="popup-title">${escapeHTML(inc.title)}</div>
        <div class="popup-meta">
          <i data-lucide="map-pin" style="width:12px;"></i> ${escapeHTML(inc.location_name)}
        </div>
        <div style="font-size:0.78rem; margin-bottom:8px; line-height:1.4;">
          <strong>Severity:</strong> ${escapeHTML(inc.severity)} | <strong>Risk Score:</strong> ${inc.risk_score}/100<br>
          <strong>Affected:</strong> ${inc.people_affected} (${inc.people_needing_assistance} needing assistance)<br>
          <strong>Assigned:</strong> ${escapeHTML(inc.assigned_resource_name || 'None')}
        </div>
        <div class="popup-actions">
          <a href="incidents.html?search=${inc.incident_code}" class="btn btn-primary btn-sm" style="flex:1; text-align:center;">
            Manage Incident
          </a>
        </div>
      </div>
    `);

    incidentsLayer.addLayer(marker);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Render Resource Pins
function renderResourceMarkers(resources) {
  resourcesLayer.clearLayers();

  resources.forEach(res => {
    if (!res.latitude || !res.longitude) return;

    const customIcon = L.divIcon({
      className: "",
      html: `<div class="custom-map-pin pin-resource"><i data-lucide="shield" style="width:16px;height:16px;"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    const marker = L.marker([res.latitude, res.longitude], { icon: customIcon });

    marker.bindPopup(`
      <div class="popup-container">
        <div class="popup-header">
          <span style="font-weight:800; color:var(--purple); font-size:0.8rem;">${escapeHTML(res.resource_code)}</span>
          <span class="status-pill ${res.status === 'Available' ? 'status-available' : 'status-busy'}">${escapeHTML(res.status)}</span>
        </div>
        <div class="popup-title">${escapeHTML(res.name)}</div>
        <div class="popup-meta">
          <i data-lucide="truck" style="width:12px;"></i> ${escapeHTML(res.resource_type)} • Capacity: ${res.capacity}
        </div>
        <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:8px;">
          <strong>Base:</strong> ${escapeHTML(res.location_name)}<br>
          <strong>Contact:</strong> ${escapeHTML(res.contact_info || 'Command Staging Radio')}
        </div>
        <div class="popup-actions">
          <a href="resources.html" class="btn btn-secondary btn-sm" style="width:100%; text-align:center;">
            View in Resource Pool
          </a>
        </div>
      </div>
    `);

    resourcesLayer.addLayer(marker);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Render Shelter Pins
function renderShelterMarkers(shelters) {
  sheltersLayer.clearLayers();

  shelters.forEach(s => {
    if (!s.latitude || !s.longitude) return;

    const customIcon = L.divIcon({
      className: "",
      html: `<div class="custom-map-pin pin-shelter"><i data-lucide="home" style="width:16px;height:16px;"></i></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    const marker = L.marker([s.latitude, s.longitude], { icon: customIcon });

    marker.bindPopup(`
      <div class="popup-container">
        <div class="popup-header">
          <span style="font-weight:800; color:var(--cyan); font-size:0.8rem;">${escapeHTML(s.shelter_code)}</span>
          <span class="status-pill status-verified">${escapeHTML(s.status)}</span>
        </div>
        <div class="popup-title">${escapeHTML(s.name)}</div>
        <div class="popup-meta">
          <i data-lucide="map-pin" style="width:12px;"></i> ${escapeHTML(s.location_name)}
        </div>
        <div style="font-size:0.78rem; margin-bottom:8px;">
          <strong>Occupancy:</strong> ${s.current_occupancy} / ${s.total_capacity} (${s.occupancy_rate}%)<br>
          <strong>Available Capacity:</strong> ${s.available_capacity} persons<br>
          <strong>Medical Support:</strong> ${s.medical_support ? 'Yes' : 'No'}
        </div>
        <div class="popup-actions">
          <a href="shelters.html" class="btn btn-secondary btn-sm" style="width:100%; text-align:center;">
            Shelter Management
          </a>
        </div>
      </div>
    `);

    sheltersLayer.addLayer(marker);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Fit bounds around all plotted objects
function fitAllPlottedObjects() {
  const allPoints = [];

  allIncidentsData.forEach(i => { if (i.latitude && i.longitude) allPoints.push([i.latitude, i.longitude]); });
  allResourcesData.forEach(r => { if (r.latitude && r.longitude) allPoints.push([r.latitude, r.longitude]); });
  allSheltersData.forEach(s => { if (s.latitude && s.longitude) allPoints.push([s.latitude, s.longitude]); });

  if (allPoints.length > 0 && map) {
    map.fitBounds(allPoints, { padding: [40, 40], maxZoom: 13 });
  }
}

// Layer Toggle Checkboxes
function initLayerToggles() {
  const incToggle = document.getElementById("layer-toggle-incidents");
  const resToggle = document.getElementById("layer-toggle-resources");
  const shlToggle = document.getElementById("layer-toggle-shelters");

  if (incToggle) {
    incToggle.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(incidentsLayer);
      else map.removeLayer(incidentsLayer);
    });
  }

  if (resToggle) {
    resToggle.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(resourcesLayer);
      else map.removeLayer(resourcesLayer);
    });
  }

  if (shlToggle) {
    shlToggle.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(sheltersLayer);
      else map.removeLayer(sheltersLayer);
    });
  }
}

// Map Action Buttons (Fit All & Recenter)
function initMapControlButtons() {
  const fitBtn = document.getElementById("btn-fit-all-incidents");
  const recenterBtn = document.getElementById("btn-recenter-pune");

  if (fitBtn) {
    fitBtn.addEventListener("click", fitAllPlottedObjects);
  }

  if (recenterBtn && map) {
    recenterBtn.addEventListener("click", () => {
      map.setView([CONFIG.PUNE_COORDINATES.lat, CONFIG.PUNE_COORDINATES.lng], CONFIG.PUNE_COORDINATES.defaultZoom);
    });
  }
}

// Populate Route Origin & Destination Selectors
function populateRouteDropdowns(resources, incidents) {
  const originSelect = document.getElementById("route-origin-select");
  const destSelect = document.getElementById("route-dest-select");

  if (originSelect) {
    originSelect.innerHTML = `<option value="" disabled selected>Select origin resource...</option>` +
      resources
        .filter(r => r.latitude && r.longitude)
        .map(r => `<option value="${r.latitude},${r.longitude}">${escapeHTML(r.name)} (${escapeHTML(r.resource_type)})</option>`)
        .join("");
  }

  if (destSelect) {
    destSelect.innerHTML = `<option value="" disabled selected>Select destination incident...</option>` +
      incidents
        .filter(i => i.latitude && i.longitude)
        .map(i => `<option value="${i.latitude},${i.longitude}">[${i.incident_code}] ${escapeHTML(i.title)}</option>`)
        .join("");
  }
}

// Calculate Safe Route Corridor
function initRoutePlanner() {
  const btn = document.getElementById("btn-calculate-route");
  const originSelect = document.getElementById("route-origin-select");
  const destSelect = document.getElementById("route-dest-select");
  const resultsBox = document.getElementById("route-results-container");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    const originVal = originSelect?.value;
    const destVal = destSelect?.value;

    if (!originVal || !destVal) {
      showToast("Please choose both an origin resource and destination incident.", "warning");
      return;
    }

    const [originLat, originLng] = originVal.split(",").map(Number);
    const [destLat, destLng] = destVal.split(",").map(Number);

    try {
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner" style="width:12px;height:12px;"></div> Analyzing Corridors...`;

      const routeResult = await API.recommendRoute(originLat, originLng, destLat, destLng);

      // Clear previous route
      routeLayer.clearLayers();

      // Draw polyline
      const waypoints = routeResult.waypoints;
      const polyline = L.polyline(waypoints, {
        color: routeResult.is_safe_corridor ? "#2583F5" : "#FF626D",
        weight: 5,
        opacity: 0.85,
        dashArray: routeResult.is_safe_corridor ? null : "6, 8"
      }).addTo(routeLayer);

      // Fit map to route
      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      // Render Results Box
      resultsBox.style.display = "block";
      const hasHazards = routeResult.hazards_near_corridor && routeResult.hazards_near_corridor.length > 0;

      resultsBox.innerHTML = `
        <div class="route-result-box">
          <div style="font-weight:700; margin-bottom:4px; display:flex; justify-content:space-between;">
            <span>Estimated Transit Corridor</span>
            <span style="color:var(--primary); font-weight:800;">${routeResult.estimated_driving_distance_km} km</span>
          </div>
          <div>Estimated Drive Time: <strong>~${routeResult.estimated_duration_minutes} mins</strong> (tortuosity 1.32x)</div>
          
          ${hasHazards ? `
            <div class="hazard-warning-box">
              <strong>CAUTION:</strong> Route passes near ${routeResult.hazards_near_corridor.length} active hazard zone(s):
              <ul style="padding-left:14px; margin-top:4px;">
                ${routeResult.hazards_near_corridor.map(h => `<li>${escapeHTML(h.type)} (${escapeHTML(h.severity)}) - ${h.distance_to_corridor_km} km away</li>`).join("")}
              </ul>
            </div>
          ` : `
            <div style="margin-top:6px; color:var(--teal); font-weight:700; font-size:0.75rem;">
              ✓ Transit corridor clear of immediate recorded hazard intersections.
            </div>
          `}

          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:8px;">
            * Waypoint interpolation. Ground road conditions and waterlogging must be confirmed by crew commander.
          </div>
        </div>
      `;

      showToast("Hazard-aware transit corridor calculated.", "success");

    } catch (err) {
      showToast(`Routing failed: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="compass"></i> Calculate Safe Corridor`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
