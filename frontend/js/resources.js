/**
 * RESQAI Resource Management Script
 * Handles asset directory, operational availability, new asset registration, and release actions.
 */

document.addEventListener("DOMContentLoaded", () => {
  initResourceFilters();
  initAddResourceModal();
  loadResources();

  document.getElementById("btn-refresh-resources")?.addEventListener("click", loadResources);
});

function initResourceFilters() {
  const typeSelect = document.getElementById("filter-resource-type");
  const statusSelect = document.getElementById("filter-resource-status");

  if (typeSelect) typeSelect.addEventListener("change", loadResources);
  if (statusSelect) statusSelect.addEventListener("change", loadResources);
}

// Load and Render Resources
async function loadResources() {
  const tbody = document.getElementById("resources-table-body");
  if (!tbody) return;

  const resource_type = document.getElementById("filter-resource-type")?.value || "All";
  const status = document.getElementById("filter-resource-status")?.value || "All";

  try {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 35px;">
          <div class="spinner spinner-primary"></div>
          <div style="margin-top: 8px; color: var(--text-secondary);">Querying fleet registry...</div>
        </td>
      </tr>
    `;

    const resources = await API.getResources({ resource_type, status });

    // Update Stats Cards
    updateResourceStats(resources);

    if (resources.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="truck"></i></div>
              <h4>No Rescue Assets Found</h4>
              <p>No units match the selected filters.</p>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = resources.map(res => {
      const isAvail = (res.status === "Available");
      const isAssigned = (res.status === "Assigned");
      const caps = res.capabilities || [];

      return `
        <tr>
          <td>
            <strong style="color:var(--purple); font-size:0.84rem;">${escapeHTML(res.resource_code)}</strong>
          </td>
          <td>
            <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${escapeHTML(res.name)}</div>
          </td>
          <td>
            <span style="font-size:0.82rem; font-weight:600; color:var(--text-secondary);">${escapeHTML(res.resource_type)}</span>
          </td>
          <td>
            <div style="font-size:0.82rem; color:var(--text-main); display:flex; align-items:center; gap:4px;">
              <i data-lucide="map-pin" style="width:12px; height:12px; color:var(--text-muted);"></i> ${escapeHTML(res.location_name)}
            </div>
          </td>
          <td>
            <span style="font-weight:700;">${res.capacity}</span> <span style="font-size:0.75rem; color:var(--text-muted);">crew</span>
          </td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:4px; max-width:280px;">
              ${caps.map(c => `<span style="background:#F0F4F8; color:var(--text-main); font-size:0.7rem; padding:2px 6px; border-radius:4px;">${escapeHTML(c)}</span>`).join("")}
            </div>
          </td>
          <td>
            <span class="status-pill ${isAvail ? 'status-available' : (isAssigned ? 'status-assigned' : 'status-busy')}">
              ${escapeHTML(res.status)}
            </span>
          </td>
          <td style="font-size:0.78rem; color:var(--text-secondary);">
            ${escapeHTML(res.contact_info || 'Command Staging Radio')}
          </td>
          <td style="text-align: right; white-space:nowrap;">
            ${isAssigned ? `
              <button class="btn btn-secondary btn-sm" onclick="releaseResource(${res.id}, '${escapeHTML(res.name)}')">
                <i data-lucide="unlock" style="width:13px;"></i> Release
              </button>
            ` : (isAvail ? `
              <button class="btn btn-secondary btn-sm" onclick="toggleStatus(${res.id}, 'Busy')">
                Set Busy
              </button>
            ` : `
              <button class="btn btn-success btn-sm" onclick="toggleStatus(${res.id}, 'Available')">
                Set Available
              </button>
            `)}
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--coral); padding: 30px;">
          Failed to load resource list: ${err.message}
        </td>
      </tr>
    `;
  }
}

function updateResourceStats(resources) {
  const total = resources.length;
  const avail = resources.filter(r => r.status === "Available").length;
  const assigned = resources.filter(r => r.status === "Assigned").length;
  const amb = resources.filter(r => r.resource_type === "Ambulance").length;

  document.getElementById("stat-res-total").textContent = total;
  document.getElementById("stat-res-available").textContent = avail;
  document.getElementById("stat-res-assigned").textContent = assigned;
  document.getElementById("stat-res-ambulances").textContent = amb;
}

// Add New Resource Modal
function initAddResourceModal() {
  const modal = document.getElementById("add-resource-modal");
  const openBtn = document.getElementById("btn-open-add-resource");
  const closeBtn = document.getElementById("modal-add-res-close");
  const cancelBtn = document.getElementById("btn-cancel-add-res");
  const form = document.getElementById("add-resource-form");

  if (!modal) return;

  const openModal = () => modal.classList.add("open");
  const closeModal = () => modal.classList.remove("open");

  if (openBtn) openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("res-name")?.value.trim();
      const resource_type = document.getElementById("res-type")?.value;
      const capacity = parseInt(document.getElementById("res-capacity")?.value || "1", 10);
      const location_name = document.getElementById("res-location")?.value.trim();
      const latVal = document.getElementById("res-lat")?.value;
      const lngVal = document.getElementById("res-lng")?.value;
      const contact_info = document.getElementById("res-contact")?.value.trim() || null;

      const capsRaw = document.getElementById("res-capabilities")?.value.trim() || "";
      const capabilities = capsRaw ? capsRaw.split(",").map(c => c.trim()).filter(Boolean) : [];

      const latitude = latVal ? parseFloat(latVal) : null;
      const longitude = lngVal ? parseFloat(lngVal) : null;

      try {
        const submitBtn = document.getElementById("btn-submit-add-res");
        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";

        await API.createResource({
          name,
          resource_type,
          capacity,
          location_name,
          latitude,
          longitude,
          capabilities,
          contact_info,
          status: "Available"
        });

        showToast(`Asset "${name}" registered into fleet.`, "success");
        form.reset();
        closeModal();
        loadResources();
      } catch (err) {
        showToast(`Registration failed: ${err.message}`, "error");
      } finally {
        const submitBtn = document.getElementById("btn-submit-add-res");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Register Asset";
        }
      }
    });
  }
}

// Release Resource
window.releaseResource = async function(id, name) {
  if (!confirm(`Release ${name} from its active assignment back to Available status?`)) return;

  try {
    await API.releaseResource(id);
    showToast(`${name} has returned to staging pool.`, "success");
    loadResources();
  } catch (err) {
    showToast(`Release failed: ${err.message}`, "error");
  }
};

// Toggle status
window.toggleStatus = async function(id, newStatus) {
  try {
    await API.updateResource(id, { status: newStatus });
    showToast(`Status updated to ${newStatus}.`, "success");
    loadResources();
  } catch (err) {
    showToast(`Failed to update status: ${err.message}`, "error");
  }
};
