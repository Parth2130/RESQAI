# RESQAI — AI-Powered Emergency Management & Response System

> **Tagline:** Detect Faster. Respond Smarter. Save Lives.  
> **Official Design System:** Design C — Premium Pastel & Gradient SaaS Interface  
> **Target Region:** Subcontinent Telemetry & India National Emergency 112 Protocol  

---

## 📌 Executive Overview

**RESQAI** is a real-world disaster management and emergency response system. It unifies satellite thermal feeds, live USGS seismic telemetry, and Open-Meteo meteorological models with community crowd-reporting, transparent AI triage (Nugen AI), hazard-aware rescue transit routing, and coordinated responder dispatch.

Built to address the critical friction points of natural disasters (floods, earthquakes, cyclones, structural blazes, landslides), RESQAI ensures:
- **Instant Citizen SOS & Reporting** with unique, human-readable Tracking IDs (e.g., `RQ-2026-0001`).
- **4 Autonomous Nugen AI Modules** for emergency classification, explainable multi-factor risk scoring (0–100), conversational safety guidance, and tactical responder dispatch recommendations.
- **Strict PII Protection** ensuring citizen phone numbers and names are never leaked on public maps or feeds, while securely accessible to verified rescue commanders.
- **Interactive Geospatial Disaster Map** with light pastel Positron/OSM tiles and color-coded hazard indicators.
- **Hazard-Aware Route Planning** alerting rescue units if transit corridors cross active flash floods or rockfalls.

---

## 🎨 Official Design System (Design C: Premium Pastel & Gradient)

RESQAI features a light, modern SaaS aesthetic avoiding dark dashboards:

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Main Background** | `#F8FAFF` | Soft, ambient canvas |
| **Primary Blue** | `#5278E8` | Primary brand accent & active states |
| **Secondary Lavender** | `#A5B4FC` | Soft gradient bridges & highlights |
| **Accent Sky Blue** | `#38BDF8` | Telemetry & geolocation markers |
| **Success Green** | `#22C55E` | Verified resources & resolved cases |
| **Warning Orange** | `#F59E0B` | High severity & advisory alerts |
| **Critical Red** | `#EF4444` | Critical life peril & SOS beacons |
| **Card Background** | `#FFFFFF` | Crisp rounded cards with subtle drop shadows |
| **Primary Text** | `#1E293B` | High-contrast readable typography |
| **Secondary Text** | `#64748B` | Subtitles, timestamps, and metadata |
| **Border Color** | `#E8ECF5` | Delicate, unobtrusive card dividing lines |

---

## 🏗️ 15 Connected Platform Pages

Every page in RESQAI is connected through functional navigation:

1. **Landing Portal (`/home`):** Hero section with the official mission heading, two primary CTAs (*Explore Live Dashboard* & *Report Emergency*), 4-step lifecycle (*Detect $\rightarrow$ Analyze $\rightarrow$ Coordinate $\rightarrow$ Guide*), challenge breakdowns, telemetry statistics, and verified helpline links.
2. **Citizen Operations Hub (`/dashboard`):** 4 real-time metric cards (Active Emergencies, Critical Alerts, Nearby Hazards, SOS Requests), Open-Meteo weather card with 5-day precipitation forecasts, USGS seismic feed, ground reports, and resource directory.
3. **Live Geospatial Disaster Map (`/map`):** Interactive Leaflet map with CartoDB Voyager tiles, user GPS geolocation, layer toggles (Incidents, Earthquakes, Facilities), color-coded pins, clickable detail panels, and interactive hazard-aware route generator.
4. **Emergency Incident Reporting (`/report`):** 8 disaster hazard categories, description, auto-detect GPS coordinates, affected and injured counts, vulnerable demographic toggle (infants/elderly), optional image upload, and immediate AI triage result.
5. **SOS Emergency Beacon (`/sos`):** Prominent one-tap distress beacon with confirmation dialog to prevent accidental triggers, automated GPS coordinate transmission, and clear 112 national emergency guidance.
6. **AI Safety Assistant (`/ai-assistant`):** Dedicated conversational assistant powered by Nugen AI, live-grounded with Open-Meteo and USGS feeds, supporting **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
7. **Safety Center & Preparedness (`/safety`):** 8 comprehensive disaster manuals (Earthquakes, Floods, Cyclones, Fires, Heatwaves, Landslides, Lightning, and the 72-Hour Go-Bag Kit) organized into **Before**, **During**, and **After** action items.
8. **Emergency Resource Center (`/resources`):** Searchable, filterable directory of verified facilities (Hospitals, Ambulances, Fire Stations, Shelters, Rescue Teams, Relief Centers) with live occupancy ratios, direct dialers, and admin creation modal.
9. **Incident Tracking Pipeline (`/track`):** Search by Incident ID (e.g. `RQ-2026-0001`) with a 5-stage visual response pipeline: `New` $\rightarrow$ `Under Verification` $\rightarrow$ `Verified` $\rightarrow$ `Assigned` $\rightarrow$ `Resolved`.
10. **Responder Tactical Command (`/responder`):** Role-protected operational interface displaying incoming triage queues, confidential citizen phone numbers, Nugen AI Module 4 recommendations, and status progression controls.
11. **Administrative Control Center (`/admin`):** High-command dashboard with 6 KPIs, user directory with one-click verification for newly registered responders, and immutable chronological audit log trails.
12. **Operations Analytics (`/analytics`):** Real-time Recharts visualizations showing Category Distributions (Bar Chart), Severity Breakdown (Donut Chart), and 7-Day Timeline Trends (Area Chart) directly aggregated from live database records.
13. **User Profile & Settings (`/profile`):** Role badges, user metadata, family emergency contact manager, and telemetry notification preferences.
14. **Authentication Portal — Sign In (`/login`):** JWT token authentication with 1-click hackathon demo presets for Citizen, Responder, and Administrator roles.
15. **User Registration (`/register`):** Account registration with role selection and an explicit notice that responder and admin privileges require official verification.

---

## 🤖 Nugen AI Integration Architecture

RESQAI integrates Nugen AI across 4 modular layers via backend proxies, ensuring API keys are never exposed to the client:

- **Module 1: Emergency Classification & Triage (`POST /api/ai/classify`)**  
  Accepts citizen descriptions and outputs structured JSON containing disaster type, extracted severity, affected count, vulnerable population presence, and confidence score.
- **Module 2: Multi-Factor Risk Assessment Engine (`POST /api/ai/assess-risk`)**  
  Computes an explainable 0–100 risk score and categorical grade (`Critical`, `High`, `Medium`, `Low`) based on base hazard weights, reported severity, rescue needs, vulnerable demographics, and compounding weather alerts.
- **Module 3: Grounded Conversational Assistant (`POST /api/ai/chat`)**  
  Chatbot grounded with real-time Open-Meteo weather telemetry, USGS tremors, and NDMA advisory feeds. Strictly enforces safety rules (always advising 112 in immediate danger and never fabricating dispatch claims).
- **Module 4: Tactical Response Recommendations (`POST /api/ai/recommend-response`)**  
  Generates tactical briefings for incident commanders, recommending appropriate resource categories (boats, cardiac units, heavy tenders), perimeter safety precautions, and evacuation zones.

*Fallback Strategy:* If Nugen credentials are not yet supplied, RESQAI gracefully switches to an intelligent internal rule-based decision matrix labeled as **"AI Standby Mode"** without failing or pretending that unverified AI predictions were made.

---

## 📡 Real-World External APIs

1. **Open-Meteo Weather API:** Real-time temperature, wind velocity, precipitation, and 5-day forecasts by geographical coordinates.
2. **USGS Earthquake GeoJSON API:** Real-time seismic tremor telemetry with South Asia tectonic plate highlighting and magnitude filtering.
3. **NASA FIRMS (Fire Information for Resource Management System):** Satellite thermal anomaly and hotspot monitoring.
4. **NDMA SACHET Portal:** India's disaster alert portal status and guidelines.
5. **OpenStreetMap & CartoDB Positron:** Fast, accessible map rendering and waypoint route geometry.

---

## 🗄️ Database Architecture (PostgreSQL & SQLite)

The platform supports both local SQLite (`resqai.db`) and cloud-hosted Supabase PostgreSQL via SQLAlchemy ORM.

### Tables & Schema
1. `users` (`profiles`): Authentication, encrypted password hashes, roles (`citizen`, `responder`, `admin`), phone, agency, and verification flags.
2. `incidents` (`emergency_reports`): Unique Tracking IDs (`RQ-2026-XXXX`), coordinates, severity, impact counts, vulnerable flags, status pipeline, and AI triage summaries.
3. `incident_updates` (`report_history`): Audit history tracking status changes, timestamps, notes, and responder names.
4. `sos_requests`: Distress beacon logs with live GPS coordinates and contact phone numbers.
5. `disaster_events`: Live external seismic, thermal, and meteorological event cache.
6. `resources`: Capacity, current occupancy, operational availability, GPS coordinates, and contact details for hospitals, shelters, fire stations, ambulances, and rescue teams.
7. `responders`: Badge IDs, specialized training, duty status (`Available`, `On Mission`, `Off Duty`), agency affiliation, and live coordinates.
8. `assignments`: Tactical deployment links connecting incidents to specific responder units and equipment.
9. `notifications`: Real-time emergency broadcasts and status alert records.
10. `risk_assessments`: Mathematical weight breakdowns, contributing factors, recommendations, and explainability limitations.
11. `audit_logs`: Immutable chronological log of administrative and command-level actions.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm
- (Optional) Nugen API Key & Model ID

### 1. Environment Setup

Create a `.env` file in the project root or inside `backend/`:

```env
# Database (SQLite default; replace with Supabase PostgreSQL connection string for production)
DATABASE_URL=sqlite:///./resqai.db

# JWT Secret Key
JWT_SECRET_KEY=resqai-super-secure-production-key-2026-disaster-response
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Initial Admin Seed Credentials
INITIAL_ADMIN_EMAIL=admin@resqai.in
INITIAL_ADMIN_PASSWORD=ResqAdmin@2026
INITIAL_ADMIN_NAME=Emergency Control Officer

# Nugen AI Credentials (docs.nugen.in)
NUGEN_API_KEY=your_nugen_api_key_here
NUGEN_MODEL=your_nugen_model_id_here
NUGEN_BASE_URL=https://api.nugen.in/api/v3/inference/chat/completions

# NASA FIRMS (Optional)
NASA_FIRMS_MAP_KEY=
```

### 2. Backend Installation & Startup

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
..\venv\Scripts\activate
# Linux/macOS:
source ../venv/bin/activate

# Install requirements (if setting up fresh)
pip install -r requirements.txt

# Run automated test suite
python test_api.py

# Start FastAPI server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be accessible at:
- **API Base:** `http://localhost:8000/api`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **System Health:** `http://localhost:8000/api/health`

### 3. Frontend Installation & Startup

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Build production bundle
npm run build

# Start Vite development server
npm run dev
```

The frontend will be available at `http://localhost:5173`. When deployed with FastAPI, FastAPI automatically serves the built static frontend directly on `http://localhost:8000/`.

---

## 🧪 Automated Test Suite Results

The test suite in `backend/test_api.py` executes 7 automated end-to-end integration tests:

| Test Case | Module | Result | Details |
| :--- | :--- | :---: | :--- |
| `test_health` | System | **PASSED** | Database connectivity & telemetry online |
| `test_weather_endpoint` | Open-Meteo | **PASSED** | Real-time weather, humidity, and wind feeds |
| `test_earthquakes_endpoint` | USGS GeoJSON | **PASSED** | Seismic magnitude filtering & South Asia highlighting |
| `test_alerts_endpoint` | NDMA SACHET | **PASSED** | Warning portal verification |
| `test_fires_endpoint` | NASA FIRMS | **PASSED** | Satellite thermal anomaly parser |
| `test_ai_modules` | Nugen AI | **PASSED** | Modules 1, 2, and 3 structured classification & chat |
| `test_full_emergency_workflow`| End-to-End | **PASSED** | Registration $\rightarrow$ Report $\rightarrow$ Unique ID $\rightarrow$ Tracking $\rightarrow$ PII Privacy $\rightarrow$ Responder Update $\rightarrow$ Route $\rightarrow$ Analytics |

---

## 🌐 Production Deployment Guide

### Frontend on Vercel
1. Link your GitHub repository in the Vercel dashboard.
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Add environment variable: `VITE_API_URL=https://your-backend-app.onrender.com`.
5. Deploy.

### Backend on Render
1. Create a new **Web Service** on Render pointing to your repository.
2. Root Directory: `backend`.
3. Environment: `Python 3`.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
6. Configure environment variables (`DATABASE_URL`, `JWT_SECRET_KEY`, `NUGEN_API_KEY`, `NUGEN_MODEL`).

### Database on Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Retrieve the PostgreSQL connection string from **Project Settings $\rightarrow$ Database**.
3. Set `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` in your Render environment variables. SQLAlchemy automatically creates all 11 tables and seeds initial demonstration records on startup.

---

## 👥 Hackathon Pre-Seeded Accounts

For presentation and live demonstration:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@resqai.in` | `ResqAdmin@2026` | Full system control, user verification, audit logs, resource creation |
| **Field Responder** | `responder@resqai.in` | `Responder@2026` | Triage queue, confidential contact numbers, status progression, unit dispatch |
| **Citizen** | `citizen@resqai.in` | `Citizen@2026` | Emergency reporting, SOS beacons, incident tracking, personal emergency contacts |

---

## 📜 Compliance & Safety Disclaimers

1. **National Emergency 112 Priority:** RESQAI displays prominent notices on all views emphasizing that web reports do not substitute for dialing India's unified emergency number **112**.
2. **Citizen Data Confidentiality:** Citizen names and contact numbers are encrypted and restricted to verified rescue commanders. Public map markers display situational summaries only.
3. **No Fabricated Data:** Telemetry feeds, earthquake records, weather forecasts, and operational analytics are grounded in verified databases and live APIs.
