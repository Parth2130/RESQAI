/**
 * RESQAI Frontend Configuration
 * Competition: International Grand Challenge 2026, Pune, India
 */
const CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000/api",
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
