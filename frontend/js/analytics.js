/**
 * RESQAI Situation Analytics & Reporting Script
 * Chart.js visualizations, KPI summaries, and CSV data export.
 */

let typeChart = null;
let sevChart = null;
let statusChart = null;
let resChart = null;

document.addEventListener("DOMContentLoaded", () => {
  initAnalyticsCharts();
  loadAnalyticsData();

  document.getElementById("btn-refresh-analytics")?.addEventListener("click", loadAnalyticsData);
  document.getElementById("btn-export-csv")?.addEventListener("click", exportIncidentsToCSV);
});

function initAnalyticsCharts() {
  const fontConfig = { family: "'Plus Jakarta Sans', sans-serif" };

  // 1. Incidents by Type (Bar)
  const typeCtx = document.getElementById("chart-types-canvas");
  if (typeCtx) {
    typeChart = new Chart(typeCtx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Incidents Logged",
          data: [],
          backgroundColor: "#2583F5",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0, font: fontConfig } },
          x: { ticks: { font: fontConfig, size: 10 } }
        }
      }
    });
  }

  // 2. Severity Breakdown (Doughnut)
  const sevCtx = document.getElementById("chart-severity-canvas");
  if (sevCtx) {
    sevChart = new Chart(sevCtx, {
      type: "doughnut",
      data: {
        labels: ["Critical", "High", "Medium", "Low"],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ["#FF626D", "#FFAA45", "#E5A122", "#18B89A"],
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { font: fontConfig, boxWidth: 12 } }
        }
      }
    });
  }

  // 3. Status Lifecycle (Bar)
  const statusCtx = document.getElementById("chart-status-canvas");
  if (statusCtx) {
    statusChart = new Chart(statusCtx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Incidents in Stage",
          data: [],
          backgroundColor: ["#FFAA45", "#2583F5", "#8B7CF6", "#FF626D", "#18B89A", "#4A5568"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0, font: fontConfig } },
          x: { ticks: { font: fontConfig, size: 10 } }
        }
      }
    });
  }

  // 4. Resource Pool Saturation (Doughnut)
  const resCtx = document.getElementById("chart-resource-canvas");
  if (resCtx) {
    resChart = new Chart(resCtx, {
      type: "doughnut",
      data: {
        labels: ["Available", "Assigned", "Busy", "Unavailable"],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ["#18B89A", "#8B7CF6", "#FFAA45", "#FF626D"],
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { font: fontConfig, boxWidth: 12 } }
        }
      }
    });
  }
}

// Load Backend Analytics Summary
async function loadAnalyticsData() {
  try {
    const summary = await API.getAnalyticsSummary();

    // 1. Update KPIs
    document.getElementById("kpi-avg-risk").textContent = `${summary.average_risk_score || 0}/100`;
    document.getElementById("kpi-affected").textContent = (summary.total_people_affected || 0).toLocaleString();
    document.getElementById("kpi-assisted").textContent = (summary.total_people_needing_assistance || 0).toLocaleString();

    const shl = summary.shelter_stats || {};
    document.getElementById("kpi-shelter-rate").textContent = `${shl.overall_occupancy_rate || 0}%`;
    document.getElementById("kpi-shelter-sub").textContent = `${shl.current_occupancy || 0} / ${shl.total_capacity || 0} beds occupied`;

    // 2. Update Vulnerable Demographics
    const vuln = summary.vulnerable_populations || {};
    document.getElementById("vuln-elderly").textContent = (vuln.elderly || 0).toLocaleString();
    document.getElementById("vuln-mobility").textContent = (vuln.mobility_impaired || 0).toLocaleString();
    document.getElementById("vuln-children").textContent = (vuln.children || 0).toLocaleString();
    document.getElementById("vuln-medical").textContent = (vuln.urgent_medical || 0).toLocaleString();

    // 3. Update Chart 1: Types
    if (typeChart) {
      const typeMap = summary.incidents_by_type || {};
      typeChart.data.labels = Object.keys(typeMap);
      typeChart.data.datasets[0].data = Object.values(typeMap);
      typeChart.update();
    }

    // 4. Update Chart 2: Severity
    if (sevChart) {
      const sevMap = summary.incidents_by_severity || {};
      sevChart.data.datasets[0].data = [
        sevMap["Critical"] || 0,
        sevMap["High"] || 0,
        sevMap["Medium"] || 0,
        sevMap["Low"] || 0
      ];
      sevChart.update();
    }

    // 5. Update Chart 3: Status
    if (statusChart) {
      const statusMap = summary.incidents_by_status || {};
      statusChart.data.labels = Object.keys(statusMap);
      statusChart.data.datasets[0].data = Object.values(statusMap);
      statusChart.update();
    }

    // 6. Update Chart 4: Resources
    if (resChart) {
      const resMap = summary.resource_utilization || {};
      resChart.data.datasets[0].data = [
        resMap["Available"] || 0,
        resMap["Assigned"] || 0,
        resMap["Busy"] || 0,
        resMap["Unavailable"] || 0
      ];
      resChart.update();
    }

    showToast("Analytics refreshed from database.", "info");

  } catch (err) {
    showToast(`Failed to load analytics: ${err.message}`, "error");
  }
}

// Export Incidents CSV
async function exportIncidentsToCSV() {
  try {
    const incidents = await API.getIncidents();
    if (incidents.length === 0) {
      showToast("No incident records available to export.", "warning");
      return;
    }

    const headers = [
      "Incident Code",
      "Title",
      "Type",
      "Severity",
      "Risk Score",
      "Risk Level",
      "Status",
      "Location Sector",
      "Latitude",
      "Longitude",
      "People Affected",
      "People Needing Extraction",
      "Assigned Asset",
      "Reported Timestamp"
    ];

    const rows = incidents.map(i => [
      `"${i.incident_code || ''}"`,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${i.incident_type || ''}"`,
      `"${i.severity || ''}"`,
      i.risk_score || 0,
      `"${i.risk_level || ''}"`,
      `"${i.status || ''}"`,
      `"${(i.location_name || '').replace(/"/g, '""')}"`,
      i.latitude || '',
      i.longitude || '',
      i.people_affected || 0,
      i.people_needing_assistance || 0,
      `"${(i.assigned_resource_name || 'None').replace(/"/g, '""')}"`,
      `"${i.created_at || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RESQAI_Incident_SITREP_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Situation report exported as CSV.", "success");

  } catch (err) {
    showToast(`Export failed: ${err.message}`, "error");
  }
}
