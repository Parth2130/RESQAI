/**
 * RESQAI Incident Intake & Risk Calculation Script
 * Connects intake form to FastAPI /api/incidents endpoint, manages Leaflet picker map,
 * and renders explainable risk assessment cards.
 */

let pickerMap = null;
let pickerMarker = null;

document.addEventListener("DOMContentLoaded", () => {
  initPickerMap();
  initFormHandler();
  initGpsButton();
  initResetButton();
});

// Initialize Leaflet Map for Pin Placement
function initPickerMap() {
  const container = document.getElementById("picker-map");
  if (!container || pickerMap) return;

  const defaultLat = 18.5204;
  const defaultLng = 73.8567;

  pickerMap = L.map("picker-map", {
    zoomControl: true,
    attributionControl: false
  }).setView([defaultLat, defaultLng], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18
  }).addTo(pickerMap);

  const customIcon = L.divIcon({
    className: "",
    html: `<div class="custom-map-pin pin-critical"><i data-lucide="map-pin" style="width:16px;height:16px;"></i></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  pickerMarker = L.marker([defaultLat, defaultLng], {
    draggable: true,
    icon: customIcon
  }).addTo(pickerMap);

  // Drag event
  pickerMarker.on("dragend", (e) => {
    const pos = e.target.getLatLng();
    updateCoordinates(pos.lat, pos.lng);
  });

  // Map Click event
  pickerMap.on("click", (e) => {
    pickerMarker.setLatLng(e.latlng);
    updateCoordinates(e.latlng.lat, e.latlng.lng);
  });

  // Manual input changes
  document.getElementById("incident-lat")?.addEventListener("change", syncMarkerFromInputs);
  document.getElementById("incident-lng")?.addEventListener("change", syncMarkerFromInputs);

  if (window.lucide) window.lucide.createIcons();
}

function updateCoordinates(lat, lng) {
  const roundedLat = parseFloat(lat.toFixed(6));
  const roundedLng = parseFloat(lng.toFixed(6));

  const latInput = document.getElementById("incident-lat");
  const lngInput = document.getElementById("incident-lng");
  const label = document.getElementById("picker-coords-text");

  if (latInput) latInput.value = roundedLat;
  if (lngInput) lngInput.value = roundedLng;
  if (label) label.textContent = `${roundedLat}, ${roundedLng}`;
}

function syncMarkerFromInputs() {
  const lat = parseFloat(document.getElementById("incident-lat")?.value);
  const lng = parseFloat(document.getElementById("incident-lng")?.value);
  if (!isNaN(lat) && !isNaN(lng) && pickerMarker && pickerMap) {
    pickerMarker.setLatLng([lat, lng]);
    pickerMap.setView([lat, lng], pickerMap.getZoom());
    document.getElementById("picker-coords-text").textContent = `${lat}, ${lng}`;
  }
}

// Browser Geolocation API
function initGpsButton() {
  const gpsBtn = document.getElementById("btn-get-current-gps");
  if (!gpsBtn) return;

  gpsBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.", "warning");
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.innerHTML = `<div class="spinner" style="width:12px; height:12px;"></div> Fetching...`;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateCoordinates(lat, lng);
        if (pickerMarker && pickerMap) {
          pickerMarker.setLatLng([lat, lng]);
          pickerMap.setView([lat, lng], 14);
        }
        showToast("GPS coordinates acquired.", "success");
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<i data-lucide="navigation"></i> Use My GPS`;
        if (window.lucide) window.lucide.createIcons();
      },
      (error) => {
        showToast(`GPS Error: ${error.message}. Defaulting to Pune Sector.`, "warning");
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `<i data-lucide="navigation"></i> Use My GPS`;
        if (window.lucide) window.lucide.createIcons();
      },
      { timeout: 8000 }
    );
  });
}

// Form Submission Handler
function initFormHandler() {
  const form = document.getElementById("incident-report-form");
  const submitBtn = document.getElementById("btn-submit-report");
  const successPanel = document.getElementById("report-success-panel");
  const formCard = document.getElementById("report-form-card");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect values
    const title = document.getElementById("incident-title")?.value.trim();
    const incident_type = document.getElementById("incident-type")?.value;
    const severity = document.getElementById("incident-severity")?.value;
    const description = document.getElementById("incident-description")?.value.trim();
    const people_affected = parseInt(document.getElementById("people-affected")?.value || "0", 10);
    const people_needing_assistance = parseInt(document.getElementById("people-needing-assistance")?.value || "0", 10);
    const location_name = document.getElementById("location-name")?.value.trim();
    const reporter_name = document.getElementById("reporter-name")?.value.trim() || null;
    const reporter_contact = document.getElementById("reporter-contact")?.value.trim() || null;

    const latVal = document.getElementById("incident-lat")?.value;
    const lngVal = document.getElementById("incident-lng")?.value;
    const latitude = latVal ? parseFloat(latVal) : null;
    const longitude = lngVal ? parseFloat(lngVal) : null;

    // Validate
    if (!title || !incident_type || !severity || !description || !location_name) {
      showToast("Please fill in all required fields marked with *.", "warning");
      return;
    }

    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      showToast("Latitude must be between -90 and 90 degrees.", "error");
      return;
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      showToast("Longitude must be between -180 and 180 degrees.", "error");
      return;
    }

    const payload = {
      title,
      incident_type,
      severity,
      description,
      people_affected,
      people_needing_assistance,
      location_name,
      latitude,
      longitude,
      reporter_name,
      reporter_contact,
      is_demo: false
    };

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="spinner"></div> Computing Risk & Storing Report...`;

      const response = await API.createIncident(payload);
      const inc = response.incident;
      const risk = response.risk_assessment;

      // Populate Success Card
      document.getElementById("success-incident-title").textContent = `[${inc.incident_code}] ${inc.title}`;
      
      const badge = document.getElementById("success-risk-badge");
      badge.textContent = `Risk: ${risk.risk_score}/100 (${risk.risk_level})`;
      badge.className = `status-pill status-${risk.risk_level.toLowerCase()}`;

      document.getElementById("success-priority-text").textContent = risk.priority;
      document.getElementById("success-location-text").textContent = inc.location_name;

      const factorsList = document.getElementById("success-factors-list");
      if (factorsList) {
        factorsList.innerHTML = risk.factors.map(f => `<li>${escapeHTML(f)}</li>`).join("");
      }

      const manageLink = document.getElementById("success-view-details-link");
      if (manageLink) {
        manageLink.href = `incidents.html?search=${inc.incident_code}`;
      }

      // Show panel & hide form
      formCard.style.display = "none";
      successPanel.style.display = "block";
      successPanel.scrollIntoView({ behavior: "smooth" });

      showToast(`Incident ${inc.incident_code} recorded and prioritized!`, "success", 5000);
      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      showToast(`Submission failed: ${err.message}`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send"></i> Submit & Run Risk Assessment`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

function initResetButton() {
  const btn = document.getElementById("btn-submit-another");
  const successPanel = document.getElementById("report-success-panel");
  const formCard = document.getElementById("report-form-card");
  const form = document.getElementById("incident-report-form");

  if (btn && successPanel && formCard && form) {
    btn.addEventListener("click", () => {
      form.reset();
      updateCoordinates(18.5204, 73.8567);
      if (pickerMarker && pickerMap) {
        pickerMarker.setLatLng([18.5204, 73.8567]);
        pickerMap.setView([18.5204, 73.8567], 12);
      }
      successPanel.style.display = "none";
      formCard.style.display = "block";
      formCard.scrollIntoView({ behavior: "smooth" });
    });
  }
}
