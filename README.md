# RESQAI — AI-Powered Emergency Management & Disaster Response Platform

> **Tagline:** Detect Faster. Respond Smarter. Save Lives.  
> **Region:** India (Unified 112 Protocol & Subcontinent Telemetry)

---

## 📌 Overview

**RESQAI** is a full-stack, real-time emergency management and disaster response web platform built from scratch. It bridges satellite, seismic, and meteorological telemetry with community crowd-reporting and AI-driven preparedness.

Built specifically for the Indian geographical context, RESQAI connects live data feeds with citizen safety guidance and incident triage.

---

## 🚀 Key Capabilities & Modules

1. **Home / Landing Portal:**
   - Real-time telemetry ticker (Open-Meteo & USGS feeds).
   - "How RESQAI Works" 4-step lifecycle (Detect $\rightarrow$ Analyze $\rightarrow$ Coordinate $\rightarrow$ Guide).
   - Instant access to Emergency SOS reporting, live dashboard, and AI assistant.
   - Prominent 112 national emergency disclaimer.

2. **Live Disaster Operations Dashboard:**
   - Real-time weather and 5-day precipitation forecasts via **Open-Meteo API** (New Delhi, Mumbai, Pune, Kolkata, Bengaluru, Chennai, Kochi, etc.).
   - Live seismic monitor via **USGS Earthquake GeoJSON API** with magnitude filters (M2.5+, M4.5+, M6.0+) and South Asia tectonic plate highlighting.
   - Official national disaster alerts status via **NDMA SACHET**.
   - Satellite thermal anomaly monitoring via **NASA FIRMS**.
   - Verified community citizen reports with status tracking and severity tags.

3. **Real-Time Geospatial Disaster Map:**
   - Interactive **Leaflet.js** map with dark CartoDB tiles.
   - Color-coded severity pins (Red: Critical / M6.0+, Amber: High / M4.5+, Yellow: Medium / Light).
   - Detailed incident popups with coordinates, depth, and safety instructions.
   - Layer toggles (Earthquakes vs Citizen Reports) and Indian regional jump presets.
   - "My Current Location" button using browser geolocation.

4. **Citizen Emergency SOS Reporting & Tracking:**
   - Form for reporting emergencies (Floods, Earthquakes, Cyclones, Landslides, Fires, Waterlogging, Medical).
   - GPS auto-detection button or manual landmark input.
   - Severity selection, number of affected people, and description.
   - Generates unique alphanumeric tracking IDs (e.g. `RESQ-9824X`).
   - Incident Tracking tab with a 5-step visual pipeline: `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Acknowledged` $\rightarrow$ `Resolved` $\rightarrow$ `Closed`.
   - **Confidentiality:** Citizen names and contact numbers are strictly protected and never displayed in public endpoints.

5. **AI Emergency Assistant (Nugen AI):**
   - Multilingual support: **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
   - Grounded with live backend telemetry (current weather, recent earthquakes, and NDMA advisory).
   - Enforces strict safety rules: advises dialing 112, avoids claiming rescue dispatches, provides NDMA-aligned first aid and preparedness steps.
   - Graceful standby handling when API keys are not yet configured.

6. **Educational Preparedness Manual (8 Categories):**
   - Earthquakes, Floods, Cyclones, Structural & Wildfires, Heatwaves, Landslides, Lightning, and the 72-Hour Emergency Go-Bag Kit checklist.
   - Structured into **Before**, **During**, and **After** action items.

7. **Verified Emergency Directory:**
   - Direct dialer for India's unified emergency number **112**.
   - National helplines: NDMA (1070), SDRF (1077), Ambulance (108), Fire (101), Police (100).
   - Verified official portals (NDMA SACHET, IMD Mausam, CWC Flood Forecasting, GSI Landslides).
   - Guidance on locating verified hospitals via the Ayushman Bharat Health Facility Registry.

8. **Admin / Control Room Portal:**
   - Protected with JWT token authentication and bcrypt password hashing.
   - Complete incident triage queue with confidential citizen phone numbers and names.
   - Status update modal with audit history logging and internal notes.
   - Search by tracking ID, citizen name, or location.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React icons, Leaflet.js (OpenStreetMap)
- **Backend:** Python FastAPI, SQLAlchemy ORM, SQLite (`resqai.db` — ready for PostgreSQL), Uvicorn
- **HTTP / APIs:** HTTPX, Requests, Open-Meteo API, USGS Earthquake Hazards GeoJSON API, NDMA SACHET, NASA FIRMS, Nugen AI Inference API
- **Security:** PyJWT, Bcrypt, CORS middleware, PII sanitization on public endpoints

---

## 📂 Project Structure

```
RESQAI/
├── backend/
│   ├── main.py                  # FastAPI application entrypoint & API routes
│   ├── database.py              # SQLAlchemy engine & session dependency
│   ├── models.py                # Database models (User, EmergencyReport, ReportHistory)
│   ├── schemas.py               # Pydantic schemas for validation & responses
│   ├── auth.py                  # Password hashing & JWT bearer authentication
│   ├── config.py                # Environment configuration loader
│   ├── test_api.py              # Automated unit and integration test suite
│   ├── services/
│   │   ├── weather.py           # Open-Meteo real-time weather & forecast
│   │   ├── earthquakes.py       # USGS seismic GeoJSON parser & South Asia filter
│   │   ├── alerts.py            # NDMA SACHET disaster warning portal check
│   │   ├── fires.py             # NASA FIRMS thermal anomalies parser
│   │   └── nugen_ai.py          # Nugen AI multilingual assistant integration
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Local backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Brand logo, nav links, and AI trigger
│   │   │   ├── Footer.jsx       # Emergency disclaimers, helplines & source credits
│   │   │   ├── EmergencyBanner.jsx # Sticky 112 national alert notification
│   │   │   └── AIAssistantDrawer.jsx # Multilingual Nugen AI chatbot drawer
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Landing page with hero & live telemetry cards
│   │   │   ├── DashboardPage.jsx# Live disaster dashboard with city & quake filters
│   │   │   ├── MapPage.jsx      # Leaflet geospatial map with severity markers
│   │   │   ├── ReportPage.jsx   # Citizen SOS submission & report tracking
│   │   │   ├── PreparednessPage.jsx # 8-category disaster survival manual
│   │   │   ├── ResourcesPage.jsx# 112 hotline & official government portals
│   │   │   └── AdminPage.jsx    # Secure control room & triage dashboard
│   │   ├── services/
│   │   │   └── api.js           # Centralized API client
│   │   ├── App.jsx              # Main React application layout
│   │   ├── main.jsx             # React entrypoint
│   │   └── index.css            # Tailwind directives & dark theme styling
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration with /api backend proxy
│   └── tailwind.config.js       # Emergency palette (navy, blue, red, amber, green)
│
├── .env.example                 # Example environment variables template
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation & run guide
```

---

## ⚡ Setup & Execution Guide (VS Code)

### Prerequisites

- **Python 3.10+** (Python 3.13 tested and verified)
- **Node.js 18+** and **npm**

---

### Step 1: Open the Project in VS Code

```powershell
cd C:\Users\parth\.gemini\antigravity\scratch\RESQAI
code .
```

---

### Step 2: Configure Environment Variables

Create or inspect `backend/.env` (a template is provided in `.env.example`):

```ini
DATABASE_URL=sqlite:///./resqai.db
JWT_SECRET_KEY=resqai-super-secret-key-2026-disaster-response
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

INITIAL_ADMIN_EMAIL=admin@resqai.in
INITIAL_ADMIN_PASSWORD=ResqAdmin@2026
INITIAL_ADMIN_NAME=Emergency Control Officer

# Nugen AI Inference Credentials (Optional for live assistant)
NUGEN_API_KEY=
NUGEN_MODEL_ID=
NUGEN_API_URL=https://api.nugen.in/api/v3/inference/chat/completions

# NASA FIRMS API Key (Optional for satellite thermal anomaly feed)
NASA_FIRMS_MAP_KEY=
```

---

### Step 3: Run the FastAPI Backend

Open a terminal in VS Code:

```powershell
cd backend
# If using the existing virtual environment:
..\venv\Scripts\activate
# Run the FastAPI server:
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

> **Backend URL:** `http://127.0.0.1:8000`  
> **Interactive Swagger API Docs:** `http://127.0.0.1:8000/docs`

---

### Step 4: Run the React + Vite Frontend

Open a second terminal in VS Code:

```powershell
cd frontend
npm run dev
```

> **Frontend URL:** `http://localhost:5173`

---

### Step 5 (Optional): Run the Full Application in Standalone Mode

The FastAPI backend automatically mounts and serves the production-built React application from `frontend/dist`. You can access the entire application directly on port 8000:

```powershell
# In the frontend directory:
npm run build

# In the backend directory:
uvicorn main:app --port 8000
```
Then visit `http://localhost:8000` in any web browser!

---

## 🧪 Testing the API

To run the automated test suite verifying database models, live weather, USGS earthquake feeds, report lifecycle, and admin auth:

```powershell
cd backend
..\venv\Scripts\python test_api.py
```

All 8 tests should pass with `OK`.

---

## 🔑 Default Administrator Credentials

When the database is first initialized, the following administrator is automatically seeded:

- **Email:** `admin@resqai.in`
- **Password:** `ResqAdmin@2026`
- **Portal:** Click **"Admin Portal"** on the navigation bar.

---

## 📡 Live Integration Status

| Integration | Status | Notes |
| :--- | :--- | :--- |
| **Open-Meteo Weather API** | ✅ **Live & Verified** | Live weather, temp, wind, rain, and 5-day daily forecasts for major Indian cities. Requires no API key. |
| **USGS Earthquake GeoJSON API** | ✅ **Live & Verified** | Real-time seismic monitor across the globe with South Asia plate highlights. Requires no API key. |
| **NDMA SACHET Portal** | ✅ **Connected / Portal Linked** | Connects to public bulletin gateway; provides direct links to official NDMA SACHET CAP alerts. Never fabricates fake warnings. |
| **NASA FIRMS** | ⚠️ **Standby (Key Required)** | Displays thermal hotspots when `NASA_FIRMS_MAP_KEY` is provided. Clearly labels detections as unverified satellite hotspots. |
| **Nugen AI Assistant** | ⚠️ **Standby (Key Required)** | Fully implemented backend endpoint with live telemetry grounding. Activated by setting `NUGEN_API_KEY` and `NUGEN_MODEL_ID` in `.env`. Displays graceful setup guidance when unconfigured. |

---

## ⚠️ Emergency Disclaimer

> **RESQAI is an informational intelligence and community reporting platform. It is NOT an official emergency dispatch service.**  
> In immediate danger, citizens should call **India's unified emergency number 112** directly.
