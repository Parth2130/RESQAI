/**
 * RESQAI Frontend Configuration
 * Competition: International Grand Challenge 2026, Pune, India
 */
const isLocalDevServer = window.location.port === "5500" || window.location.port === "3000" || window.location.port === "5501";
const API_BASE_URL = isLocalDevServer 
  ? "http://127.0.0.1:8000/api" 
  : `${window.location.origin}/api`;

const CONFIG = {
  API_BASE_URL: API_BASE_URL,
  APP_NAME: "RESQAI",
  COMPETITION_TITLE: "International Grand Challenge 2026",
  PUNE_COORDINATES: {
    lat: 18.5204,
    lng: 73.8567,
    defaultZoom: 12
  },
  REFRESH_INTERVAL_MS: 30000, // 30s auto-refresh for operations dashboard
  IS_DEMO: true
};

window.CONFIG = CONFIG;
