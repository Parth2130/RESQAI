/**
 * RESQAI Shelter and Vulnerable Population Script
 * Manages shelter capacity thresholds, occupancy updates, and demographic tracking.
 */

let activeShelterForUpdate = null;

document.addEventListener("DOMContentLoaded", () => {
  initAddShelterModal();
  initUpdateOccupancyModal();
  loadShelters();

  document.getElementById("btn-refresh-shelters")?.addEventListener("click", loadShelters);
});

// Load Shelters from Backend API
async function loadShelters() {
  const container = document.getElementById("shelters-cards-grid");
  if (!container) return;

  try {
    container.innerHTML = `
      <div style="grid-column: span 2; text-align: center; padding: 40px;">
        <div class="spinner spinner-primary"></div>
        <div style="margin-top: 10px; color: var(--text-secondary);">Querying shelter network...</div>
      </div>
    `;

    const shelters = await API.getShelters();

    // Calculate Aggregates
    updateShelterMetrics(shelters);

    if (shelters.length === 0) {
      container.innerHTML = `
        <div style="grid-column: span 2;">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="home"></i></div>
            <h4>No Evacuation Shelters Registered</h4>
            <p>Click 'Register New Shelter' to establish emergency relief points.</p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = shelters.map(s => {
      const occRate = s.occupancy_rate || 0;
      let barColor = "var(--teal)";
      let statusClass = "status-available";

      if (occRate >= 90) {
        barColor = "var(--coral)";
        statusClass = "status-unavailable";
      } else if (occRate >= 70) {
        barColor = "var(--orange)";
        statusClass = "status-busy";
      }

      const facilities = s.facilities || [];
      const totalVuln = (s.vulnerable_elderly || 0) + (s.vulnerable_mobility || 0) + 
                        (s.vulnerable_children || 0) + (s.vulnerable_medical || 0);

      return `
        <div class="card" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span style="font-size:0.8rem; font-weight:800; color:var(--cyan);">${escapeHTML(s.shelter_code)}</span>
                <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-top:2px;">${escapeHTML(s.name)}</h4>
                <div style="font-size:0.78rem; color:var(--text-secondary); display:flex; align-items:center; gap:4px; margin-top:2px;">
                  <i data-lucide="map-pin" style="width:13px; height:13px;"></i> ${escapeHTML(s.location_name)}
                </div>
              </div>
              <span class="status-pill ${statusClass}" style="font-size:0.72rem;">
                ${escapeHTML(s.status)}
              </span>
            </div>

            <!-- Capacity Progress Bar -->
            <div style="margin: 14px 0;">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:6px;">
                <span style="color:var(--text-main); font-weight:600;">Occupancy: <strong>${s.current_occupancy}</strong> / ${s.total_capacity} beds</span>
                <span style="font-weight:700; color:${barColor};">${occRate}%</span>
              </div>
              <div style="height:8px; background:#EDF2F7; border-radius:99px; overflow:hidden;">
                <div style="width:${Math.min(100, occRate)}%; height:100%; background:${barColor}; transition:width 0.4s ease;"></div>
              </div>
              <div style="font-size:0.74rem; color:var(--text-muted); margin-top:4px;">
                ${s.available_capacity} bed spaces currently available
              </div>
            </div>

            <!-- Facilities and Support Tags -->
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
              ${s.accessibility_support ? `<span style="background:var(--teal-light); color:var(--teal); font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px;"><i data-lucide="check" style="width:10px;"></i> Accessible</span>` : ''}
              ${s.medical_support ? `<span style="background:var(--coral-light); color:var(--coral); font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px;"><i data-lucide="cross" style="width:10px;"></i> Medical Clinic</span>` : ''}
              ${facilities.slice(0, 3).map(f => `<span style="background:#F0F4F8; color:var(--text-secondary); font-size:0.7rem; padding:2px 6px; border-radius:4px;">${escapeHTML(f)}</span>`).join("")}
            </div>

            <!-- Vulnerable Demographics Pill -->
            <div style="background:#F8FBFE; border:1px solid var(--border-color); border-radius:6px; padding:10px 12px; margin-bottom:14px; font-size:0.78rem;">
              <div style="font-weight:700; color:var(--text-main); margin-bottom:4px; display:flex; justify-content:space-between;">
                <span>Vulnerable Persons Supported:</span>
                <span style="color:var(--purple); font-weight:800;">${totalVuln}</span>
              </div>
              <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; text-align:center; font-size:0.72rem; color:var(--text-secondary);">
                <div>Elderly: <strong>${s.vulnerable_elderly || 0}</strong></div>
                <div>Mobility: <strong>${s.vulnerable_mobility || 0}</strong></div>
                <div>Kids: <strong>${s.vulnerable_children || 0}</strong></div>
                <div>Medical: <strong>${s.vulnerable_medical || 0}</strong></div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.75rem; color:var(--text-muted);">
              Hotline: ${escapeHTML(s.contact_details || 'HQ Direct')}
            </div>
            <button class="btn btn-primary btn-sm" onclick="openUpdateOccupancyModal(${s.id})">
              <i data-lucide="edit-3"></i> Update Headcount
            </button>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();

  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: var(--coral); padding: 30px;">
        Failed to load shelters: ${err.message}
      </div>
    `;
  }
}

function updateShelterMetrics(shelters) {
  const totalCap = shelters.reduce((acc, s) => acc + (s.total_capacity || 0), 0);
  const occupied = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const available = Math.max(0, totalCap - occupied);
  const rate = totalCap > 0 ? Math.round((occupied / totalCap) * 100) : 0;

  const vulnerableTotal = shelters.reduce((acc, s) => 
    acc + (s.vulnerable_elderly || 0) + (s.vulnerable_mobility || 0) + 
          (s.vulnerable_children || 0) + (s.vulnerable_medical || 0), 0);

  document.getElementById("stat-shl-total-cap").textContent = totalCap.toLocaleString();
  document.getElementById("stat-shl-count-sub").textContent = `Across ${shelters.length} relief shelters`;

  document.getElementById("stat-shl-occupied").textContent = occupied.toLocaleString();
  document.getElementById("stat-shl-rate-sub").textContent = `${rate}% aggregate occupancy`;

  document.getElementById("stat-shl-available").textContent = available.toLocaleString();
  document.getElementById("stat-shl-vulnerable").textContent = vulnerableTotal.toLocaleString();
}

// Update Occupancy Modal Logic
function initUpdateOccupancyModal() {
  const modal = document.getElementById("update-occupancy-modal");
  const closeBtn = document.getElementById("occ-modal-close");
  const cancelBtn = document.getElementById("occ-modal-cancel");
  const form = document.getElementById("update-occupancy-form");

  if (!modal) return;

  const closeModal = () => modal.classList.remove("open");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeShelterForUpdate) return;

      const occ = parseInt(document.getElementById("input-current-occ")?.value || "0", 10);
      const elderly = parseInt(document.getElementById("input-vuln-elderly")?.value || "0", 10);
      const mobility = parseInt(document.getElementById("input-vuln-mobility")?.value || "0", 10);
      const kids = parseInt(document.getElementById("input-vuln-children")?.value || "0", 10);
      const medical = parseInt(document.getElementById("input-vuln-medical")?.value || "0", 10);

      // Validation
      if (occ < 0) {
        showToast("Occupancy cannot be negative.", "warning");
        return;
      }

      if (occ > activeShelterForUpdate.total_capacity) {
        showToast(`Occupancy (${occ}) cannot exceed shelter capacity (${activeShelterForUpdate.total_capacity}).`, "error");
        return;
      }

      try {
        const btn = document.getElementById("btn-save-occupancy");
        btn.disabled = true;
        btn.textContent = "Saving...";

        await API.updateShelter(activeShelterForUpdate.id, {
          current_occupancy: occ,
          vulnerable_elderly: elderly,
          vulnerable_mobility: mobility,
          vulnerable_children: kids,
          vulnerable_medical: medical
        });

        showToast(`Occupancy updated for ${activeShelterForUpdate.name}!`, "success");
        closeModal();
        loadShelters();
      } catch (err) {
        showToast(`Update failed: ${err.message}`, "error");
      } finally {
        const btn = document.getElementById("btn-save-occupancy");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Save Headcount";
        }
      }
    });
  }
}

window.openUpdateOccupancyModal = async function(shelterId) {
  const modal = document.getElementById("update-occupancy-modal");
  if (!modal) return;

  try {
    const s = await API.getShelter(shelterId);
    activeShelterForUpdate = s;

    document.getElementById("occ-modal-title").textContent = `Update Headcount: ${s.name}`;
    document.getElementById("occ-modal-max").textContent = s.total_capacity;

    const occInput = document.getElementById("input-current-occ");
    occInput.value = s.current_occupancy;
    occInput.max = s.total_capacity;

    document.getElementById("input-vuln-elderly").value = s.vulnerable_elderly || 0;
    document.getElementById("input-vuln-mobility").value = s.vulnerable_mobility || 0;
    document.getElementById("input-vuln-children").value = s.vulnerable_children || 0;
    document.getElementById("input-vuln-medical").value = s.vulnerable_medical || 0;

    // Check warning
    const warning = document.getElementById("occ-modal-warning");
    warning.style.display = (s.occupancy_rate >= 85) ? "block" : "none";

    modal.classList.add("open");
  } catch (err) {
    showToast(`Failed to fetch shelter: ${err.message}`, "error");
  }
};

// Add Shelter Modal Logic
function initAddShelterModal() {
  const modal = document.getElementById("add-shelter-modal");
  const openBtn = document.getElementById("btn-open-add-shelter");
  const closeBtn = document.getElementById("add-shl-close");
  const cancelBtn = document.getElementById("btn-cancel-add-shl");
  const form = document.getElementById("add-shelter-form");

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

      const name = document.getElementById("shl-name")?.value.trim();
      const location_name = document.getElementById("shl-location")?.value.trim();
      const total_capacity = parseInt(document.getElementById("shl-capacity")?.value || "100", 10);
      const latVal = document.getElementById("shl-lat")?.value;
      const lngVal = document.getElementById("shl-lng")?.value;
      const facilitiesRaw = document.getElementById("shl-facilities")?.value.trim() || "";
      const accessibility_support = document.getElementById("shl-accessibility")?.checked || false;
      const medical_support = document.getElementById("shl-medical")?.checked || false;
      const contact_details = document.getElementById("shl-contact")?.value.trim() || null;

      const facilities = facilitiesRaw ? facilitiesRaw.split(",").map(f => f.trim()).filter(Boolean) : [];
      const latitude = latVal ? parseFloat(latVal) : null;
      const longitude = lngVal ? parseFloat(lngVal) : null;

      try {
        const btn = document.getElementById("btn-submit-add-shl");
        btn.disabled = true;
        btn.textContent = "Saving...";

        await API.createShelter({
          name,
          location_name,
          total_capacity,
          current_occupancy: 0,
          latitude,
          longitude,
          facilities,
          accessibility_support,
          medical_support,
          contact_details,
          status: "Operational"
        });

        showToast(`Relief shelter "${name}" established.`, "success");
        form.reset();
        closeModal();
        loadShelters();
      } catch (err) {
        showToast(`Failed to register shelter: ${err.message}`, "error");
      } finally {
        const btn = document.getElementById("btn-submit-add-shl");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Save Shelter";
        }
      }
    });
  }
}
