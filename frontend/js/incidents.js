/**
 * RESQAI Incident Management Script
 * Handles searchable and sortable table, detail modal, live status updates,
 * AI dispatch ranking, note logs, and deletion with confirmation.
 */

let activeIncident = null;
let searchDebounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  // Parse query params if redirected from report or map
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get("search");
  if (initialSearch) {
    const searchInput = document.getElementById("incidents-search-input");
    if (searchInput) searchInput.value = initialSearch;
  }

  initFiltersAndSearch();
  initDetailModalListeners();
  loadIncidents();
});

function initFiltersAndSearch() {
  const searchInput = document.getElementById("incidents-search-input");
  const statusSelect = document.getElementById("filter-status-select");
  const sevSelect = document.getElementById("filter-severity-select");
  const typeSelect = document.getElementById("filter-type-select");
  const sortSelect = document.getElementById("sort-select");

  const triggerReload = () => loadIncidents();

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(triggerReload, 300);
    });
  }

  if (statusSelect) statusSelect.addEventListener("change", triggerReload);
  if (sevSelect) sevSelect.addEventListener("change", triggerReload);
  if (typeSelect) typeSelect.addEventListener("change", triggerReload);
  if (sortSelect) sortSelect.addEventListener("change", triggerReload);
}

// Load and Render Incidents Table
async function loadIncidents() {
  const tbody = document.getElementById("incidents-table-body");
  if (!tbody) return;

  const search = document.getElementById("incidents-search-input")?.value.trim() || "";
  const status = document.getElementById("filter-status-select")?.value || "All";
  const severity = document.getElementById("filter-severity-select")?.value || "All";
  const incident_type = document.getElementById("filter-type-select")?.value || "All";
  
  const sortVal = document.getElementById("sort-select")?.value || "created_at:desc";
  const [sort_by, sort_order] = sortVal.split(":");

  try {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 35px;">
          <div class="spinner spinner-primary"></div>
          <div style="margin-top: 10px; color: var(--text-secondary);">Querying database...</div>
        </td>
      </tr>
    `;

    const incidents = await API.getIncidents({
      search,
      status,
      severity,
      incident_type,
      sort_by,
      sort_order
    });

    if (incidents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
              <h4>No Incidents Match Search Criteria</h4>
              <p>Try clearing filters or enter a different keyword.</p>
              <a href="report.html" class="btn btn-primary btn-sm">Report New Incident</a>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = incidents.map(inc => {
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
            <span style="font-size:0.82rem; font-weight:600; color:var(--text-secondary);">${escapeHTML(inc.incident_type)}</span>
          </td>
          <td>
            <span class="alert-badge badge-${sevClass}">${escapeHTML(sev)}</span>
          </td>
          <td>
            <span style="font-weight:800; font-size:0.86rem; color:${inc.risk_score >= 75 ? 'var(--coral)' : (inc.risk_score >= 50 ? 'var(--orange)' : 'var(--teal)')}">
              ${inc.risk_score} / 100
            </span>
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
              <span style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">None</span>
            `}
          </td>
          <td>
            <span class="status-pill status-${statusSlug}">${escapeHTML(inc.status)}</span>
          </td>
          <td style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">
            ${formatDateTime(inc.created_at)}
          </td>
          <td style="text-align: right; white-space:nowrap;">
            <button class="btn btn-primary btn-sm" onclick="openIncidentDetailsModal(${inc.id})" title="View Risk & Manage Operations">
              Manage
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--coral); padding: 30px;">
          Failed to load incidents: ${err.message}
        </td>
      </tr>
    `;
  }
}

// Open and Populate Incident Details Modal
window.openIncidentDetailsModal = async function(incidentId) {
  const modal = document.getElementById("incident-detail-modal");
  if (!modal) return;

  try {
    const inc = await API.getIncident(incidentId);
    activeIncident = inc;

    document.getElementById("detail-modal-title").textContent = inc.title;
    document.getElementById("detail-modal-code").textContent = inc.incident_code;
    
    const typeBadge = document.getElementById("detail-modal-type-badge");
    typeBadge.textContent = inc.incident_type;

    const statusBadge = document.getElementById("detail-modal-status-badge");
    const statusSlug = (inc.status || "reported").toLowerCase().replace(/\s+/g, '-');
    statusBadge.textContent = inc.status;
    statusBadge.className = `status-pill status-${statusSlug}`;

    document.getElementById("detail-modal-desc").textContent = inc.description;
    document.getElementById("detail-modal-location").textContent = inc.location_name;
    
    document.getElementById("detail-modal-coords").textContent = 
      (inc.latitude && inc.longitude) ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}` : "Coordinates not provided";
    
    document.getElementById("detail-modal-affected").textContent = 
      `${inc.people_affected} affected (${inc.people_needing_assistance} needing immediate extraction)`;
    
    document.getElementById("detail-modal-reporter").textContent = 
      inc.reporter_name ? `${inc.reporter_name} (${inc.reporter_contact || 'No phone'})` : "Anonymous / Citizen Intake";

    // Risk Assessment
    document.getElementById("detail-modal-risk-score").textContent = `Score: ${inc.risk_score}/100 (${inc.risk_level})`;
    document.getElementById("detail-modal-priority").textContent = inc.response_priority;
    
    const factorsList = document.getElementById("detail-modal-factors");
    const factors = inc.risk_factors || [];
    factorsList.innerHTML = factors.length > 0 
      ? factors.map(f => `<li>${escapeHTML(f)}</li>`).join("")
      : "<li>No specific aggravating factors noted.</li>";

    // Set Status dropdown to current status
    const statusSelect = document.getElementById("modal-status-select");
    if (statusSelect) statusSelect.value = inc.status;
    document.getElementById("modal-status-note").value = "";

    // Current assigned asset display
    const assetEl = document.getElementById("detail-modal-current-asset");
    if (inc.assigned_resource_name) {
      assetEl.innerHTML = `
        <div style="background:var(--purple-light); padding:10px 14px; border-radius:6px; border-left:3px solid var(--purple); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${escapeHTML(inc.assigned_resource_name)}</strong> (${escapeHTML(inc.assigned_resource_type || 'Unit')})
            <div style="font-size:0.75rem; color:var(--text-secondary);">Currently deployed on active assignment.</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="releaseLinkedAsset(${inc.assigned_resource_id})">
            Release Asset
          </button>
        </div>
      `;
    } else {
      assetEl.innerHTML = `<span style="color:var(--text-muted); font-style:italic;">No asset currently assigned to this incident.</span>`;
    }

    // Reset recommendations container
    document.getElementById("detail-modal-dispatch-recommendations").innerHTML = "";

    // Render Timeline Notes
    renderModalNotes(inc.notes || []);

    modal.classList.add("open");
    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    showToast(`Failed to retrieve incident: ${err.message}`, "error");
  }
};

function renderModalNotes(notes) {
  const container = document.getElementById("detail-modal-notes-list");
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center;">No log notes yet.</div>`;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div style="background:#FAFDFE; border:1px solid var(--border-color); border-radius:6px; padding:8px 12px; font-size:0.8rem;">
      <div style="display:flex; justify-content:space-between; margin-bottom:2px; font-size:0.72rem; color:var(--text-muted);">
        <strong>${escapeHTML(n.author)}</strong>
        <span>${formatDateTime(n.created_at)}</span>
      </div>
      <div style="color:var(--text-main);">${escapeHTML(n.note)}</div>
    </div>
  `).join("");
}

function initDetailModalListeners() {
  const modal = document.getElementById("incident-detail-modal");
  const closeBtn1 = document.getElementById("detail-modal-close");
  const closeBtn2 = document.getElementById("detail-modal-close-btn");
  const saveStatusBtn = document.getElementById("btn-save-status-change");
  const loadRecsBtn = document.getElementById("btn-modal-load-dispatch-recs");
  const addNoteBtn = document.getElementById("btn-add-note");
  const deleteBtn = document.getElementById("btn-delete-incident");

  const closeModal = () => modal.classList.remove("open");

  if (closeBtn1) closeBtn1.addEventListener("click", closeModal);
  if (closeBtn2) closeBtn2.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Update Status
  if (saveStatusBtn) {
    saveStatusBtn.addEventListener("click", async () => {
      if (!activeIncident) return;
      const newStatus = document.getElementById("modal-status-select")?.value;
      const note = document.getElementById("modal-status-note")?.value.trim() || null;

      try {
        saveStatusBtn.disabled = true;
        await API.updateIncidentStatus(activeIncident.id, newStatus, note);
        showToast(`Status updated to '${newStatus}'!`, "success");
        openIncidentDetailsModal(activeIncident.id);
        loadIncidents();
      } catch (err) {
        showToast(`Status update failed: ${err.message}`, "error");
      } finally {
        saveStatusBtn.disabled = false;
      }
    });
  }

  // AI Recommend Units
  if (loadRecsBtn) {
    loadRecsBtn.addEventListener("click", async () => {
      if (!activeIncident) return;
      const container = document.getElementById("detail-modal-dispatch-recommendations");
      container.innerHTML = `<div style="text-align:center; padding:15px;"><div class="spinner spinner-primary"></div><div style="margin-top:6px; font-size:0.8rem;">Calculating proximity & capacity...</div></div>`;

      try {
        const response = await API.recommendResources(activeIncident.id);
        const recs = response.recommendations || [];

        if (recs.length === 0) {
          container.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">No rescue units registered in system.</div>`;
          return;
        }

        container.innerHTML = recs.map(r => {
          const isAvail = r.is_available;
          const dist = r.distance_km !== null ? `${r.distance_km} km away` : "Distance N/A";

          return `
            <div style="background:white; border:1px solid ${isAvail ? 'var(--border-color)' : '#FED7D7'}; border-radius:6px; padding:10px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <strong style="font-size:0.85rem; color:var(--text-main);">${escapeHTML(r.name)}</strong>
                  <span class="status-pill ${isAvail ? 'status-available' : 'status-unavailable'}" style="font-size:0.65rem;">${escapeHTML(r.current_status)}</span>
                  <span style="font-size:0.75rem; font-weight:700; color:var(--primary);">${r.suitability_score}% match</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">
                  ${escapeHTML(r.resource_type)} • Cap: ${r.capacity} • ${dist}
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                  ${r.recommendation_reasons.slice(0, 2).map(re => escapeHTML(re)).join(" | ")}
                </div>
              </div>
              <div>
                ${isAvail ? `
                  <button class="btn btn-primary btn-sm" onclick="dispatchUnitToIncident(${activeIncident.id}, ${r.resource_id}, '${escapeHTML(r.name)}')">
                    Dispatch
                  </button>
                ` : `
                  <button class="btn btn-secondary btn-sm" disabled style="opacity:0.5;">Busy</button>
                `}
              </div>
            </div>
          `;
        }).join("");

        if (window.lucide) window.lucide.createIcons();
      } catch (err) {
        container.innerHTML = `<div style="color:var(--coral); font-size:0.8rem;">Error: ${err.message}</div>`;
      }
    });
  }

  // Add Log Note
  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", async () => {
      if (!activeIncident) return;
      const noteInput = document.getElementById("new-note-text");
      const noteText = noteInput?.value.trim();
      if (!noteText) {
        showToast("Please enter a note before submitting.", "warning");
        return;
      }

      try {
        addNoteBtn.disabled = true;
        await API.addIncidentNote(activeIncident.id, noteText, "Operations Officer");
        noteInput.value = "";
        showToast("Operational note logged.", "success");
        // Reload modal
        openIncidentDetailsModal(activeIncident.id);
      } catch (err) {
        showToast(`Failed to add note: ${err.message}`, "error");
      } finally {
        addNoteBtn.disabled = false;
      }
    });
  }

  // Delete Incident
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!activeIncident) return;
      if (!confirm(`Are you sure you want to permanently delete incident [${activeIncident.incident_code}] "${activeIncident.title}"? This cannot be undone.`)) {
        return;
      }

      try {
        deleteBtn.disabled = true;
        await API.deleteIncident(activeIncident.id);
        showToast(`Incident ${activeIncident.incident_code} deleted successfully.`, "success");
        closeModal();
        loadIncidents();
      } catch (err) {
        showToast(`Failed to delete incident: ${err.message}`, "error");
      } finally {
        deleteBtn.disabled = false;
      }
    });
  }
}

// Dispatch Action
window.dispatchUnitToIncident = async function(incidentId, resourceId, resourceName) {
  if (!confirm(`Confirm authorization to dispatch ${resourceName} to this incident?`)) {
    return;
  }

  try {
    await API.assignResource(incidentId, resourceId, "Dispatched from incident management modal.");
    showToast(`Unit ${resourceName} dispatched!`, "success");
    openIncidentDetailsModal(incidentId);
    loadIncidents();
  } catch (err) {
    showToast(`Dispatch assignment failed: ${err.message}`, "error");
  }
};

// Release Linked Asset
window.releaseLinkedAsset = async function(resourceId) {
  if (!confirm("Release this resource and return it to Available status?")) return;

  try {
    await API.releaseResource(resourceId);
    showToast("Resource released to pool.", "success");
    if (activeIncident) openIncidentDetailsModal(activeIncident.id);
    loadIncidents();
  } catch (err) {
    showToast(`Release failed: ${err.message}`, "error");
  }
};
