/**
 * RESQAI Common Application UI Logic
 * Navbar, active page indicator, alerts drawer, system health pill, and footer.
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initSystemHealthMonitor();
  initAlertsDropdown();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function initNavbar() {
  const currentPath = window.location.pathname;
  const pageName = currentPath.split("/").pop() || "index.html";

  // Highlight active link
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href === pageName || (pageName === "" && href === "index.html")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      navMenu.classList.toggle("open");
    });
  }
}

// Check backend connectivity and update health badge
async function initSystemHealthMonitor() {
  const healthPill = document.getElementById("system-health-pill");
  if (!healthPill) return;

  try {
    const health = await API.getHealth();
    healthPill.className = "health-indicator health-online";
    healthPill.innerHTML = `
      <span class="health-dot"></span>
      <span>API Online</span>
    `;
    healthPill.title = "Connected to RESQAI Core Backend at http://127.0.0.1:8000";
  } catch (e) {
    healthPill.className = "health-indicator health-offline";
    healthPill.innerHTML = `
      <span class="health-dot offline"></span>
      <span>API Offline</span>
    `;
    healthPill.title = "Backend server unreachable. Start uvicorn backend on port 8000.";
  }
}

// In-App Alerts Drawer and Badge
async function initAlertsDropdown() {
  const alertBtn = document.getElementById("alerts-toggle-btn");
  const badge = document.getElementById("alerts-badge");
  const dropdown = document.getElementById("alerts-dropdown-menu");
  const alertsList = document.getElementById("alerts-list-container");
  const markAllBtn = document.getElementById("mark-all-alerts-read");

  if (!alertBtn || !badge) return;

  async function refreshAlerts() {
    try {
      const alerts = await API.getAlerts();
      const unread = alerts.filter(a => !a.is_read);

      if (unread.length > 0) {
        badge.textContent = unread.length > 9 ? "9+" : unread.length;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }

      if (alertsList) {
        if (alerts.length === 0) {
          alertsList.innerHTML = `<div class="empty-alerts">No operational alerts.</div>`;
        } else {
          alertsList.innerHTML = alerts.slice(0, 8).map(a => `
            <div class="alert-item ${a.is_read ? 'read' : 'unread'} alert-item-${a.severity.toLowerCase()}">
              <div class="alert-item-header">
                <span class="alert-badge badge-${a.severity.toLowerCase()}">${escapeHTML(a.severity)}</span>
                <span class="alert-time">${formatDateTime(a.created_at)}</span>
              </div>
              <p class="alert-item-msg">${escapeHTML(a.message)}</p>
              ${!a.is_read ? `<button class="btn-mark-read" onclick="markSingleRead(${a.id}, event)">Mark Read</button>` : ''}
            </div>
          `).join("");
        }
      }
    } catch (e) {
      // Quiet fail if backend off
    }
  }

  // Load initially
  refreshAlerts();
  // Poll every 25 seconds
  setInterval(refreshAlerts, 25000);

  if (alertBtn && dropdown) {
    alertBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== alertBtn) {
        dropdown.classList.remove("show");
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", async () => {
      try {
        await API.markAllAlertsRead();
        showToast("All alerts marked as read.", "success");
        refreshAlerts();
      } catch (e) {
        showToast("Failed to mark alerts read.", "error");
      }
    });
  }

  window.markSingleRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await API.markAlertRead(id);
      refreshAlerts();
    } catch (err) {
      console.error(err);
    }
  };
}
