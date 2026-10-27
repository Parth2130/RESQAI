# RESQAI: AI-Powered Emergency Management & Response System

**International Grand Challenge 2026 • Pune, India**  
**Theme:** AI for Climate Change | **Domain:** Disaster Management & Civic Resilience  
**Concept:** *"Transforming fragmented situational data into intelligent, coordinated, real-time rescue operations."*

---

## 1. Executive Summary & Problem Statement

Climate change has precipitated a marked increase in extreme, localized meteorological events across the Indian subcontinent. In the Western Maharashtra basin and Pune metropolitan corridor, intensified monsoon cloudbursts, sudden dam outflow surges (e.g. Khadakwasla reservoir discharges into the Mutha River), and ghat sector landslides repeatedly compromise critical infrastructure.

During crisis onset, emergency response suffers from four critical systemic failures:
1. **Fragmented & Delayed Field Intake:** Citizen distress calls and ground warden reports arrive via disjointed channels without standardized risk indexing.
2. **Subjective & Opaque Triage:** First-response coordinators lack transparent, explainable scoring algorithms to prioritize mass-casualty extractions over minor road blockages.
3. **Resource Misallocation & Double-Booking:** Heavy assets (e.g. motorized evacuation boats, specialized hydraulic collapse cutters) are frequently dispatched without distance-capability affinity checks.
4. **Hazard-Blind Route Navigation:** Responders navigate transit corridors unaware of active neighboring hazards (e.g. secondary wall collapse risks or submerged underpasses).

**RESQAI** is a full-stack emergency management platform engineered to resolve these bottlenecks through explainable risk intelligence, geospatial hazard tracking, capability-driven asset dispatching, and live shelter capacity audits.

---

## 2. Key Capabilities & Features

### 🛡️ 1. Explainable AI Risk Assessment Engine (`risk_engine.py`)
- Computes bounded, explainable scores ($0 - 100$) for every logged event.
- Factors in disaster hazard type, reported severity grade, count of individuals in immediate peril, total affected radius, vulnerable demographics, and compound weather warnings.
- Classifies incidents into four standardized triage tiers: **Critical** (75–100), **High** (50–74), **Medium** (25–49), and **Low** (0–24).
- Outlines exact contributing weights and explicit data uncertainty warnings.

### 🗺️ 2. Geospatial Disaster Map & Hazard-Aware Routing (`routing_engine.py` + Leaflet.js)
- Full interactive mapping of Pune sector incidents with color-coded markers (Critical: Coral Red, High: Orange, Medium: Yellow, Low: Teal).
- Dynamic layer controls for Incidents, Rescue Asset Staging points, and Relief Shelters.
- **Corridor Router:** Computes road transit vectors between staging bases and incident scenes, applying simulated tortuosity (factor $1.32\times$) and scanning for proximal active hazards ($< 1.8\text{ km}$) to safeguard frontline crews.

### 🚑 3. Intelligent Resource Allocation & Dispatch (`dispatch_engine.py`)
- Evaluates disaster-capability affinity matrices (e.g., Inflatable Boats for Floods, NDRF Search Units for Building Collapses).
- Computes great-circle spatial proximity using the spherical Haversine formula.
- **Strict Concurrency Protection:** Prevents asset double-booking by enforcing state locks (`Available` vs `Assigned` vs `Busy`). Requires authorized officer confirmation before assignment.

### 🏠 4. Evacuation Shelter & Vulnerability Tracking
- Live capacity progress tracking with automatic warnings when occupancy nears $\ge 85\%$ or reaches maximum capacity.
- Strict input validation preventing impossible negative headcounts or over-capacity entries.
- Humanitarian aggregation metrics tracking elderly residents, mobility-impaired citizens, children, and urgent medical transfers without exposing private personal data.

### 📊 5. Situation Analytics & SITREP Generation
- Direct integration with SQLite database providing live distribution charts for incident types, severity spreads, lifecycle states, and resource utilization.
- Printable summary report layout and one-click **CSV SITREP Export**.

---

## 3. Technology Stack

- **Frontend:**
  - Semantic HTML5 & Modern Responsive CSS3 (Emergency-inspired bright design palette)
  - Vanilla JavaScript (ES6+ modular architecture, zero npm build dependencies)
  - **Leaflet.js (v1.9.4)** with OpenStreetMap tile feeds
  - **Chart.js (v4.4)** for responsive situation charts
  - **Lucide Icons** for accessible symbology
- **Backend:**
  - **Python 3.13+**
  - **FastAPI** for high-throughput, asynchronous REST endpoints
  - **Uvicorn** ASGI web server
  - **Pydantic (v2)** for strict request/response data contracts
  - **SQLAlchemy (v2.0)** ORM for relational persistence
- **Database:**
  - **SQLite 3** (`resqai.db`) for persistent zero-configuration local execution and verifiable demonstrations.

---

## 4. Project Directory Structure

```
RESQAI/
│
├── frontend/                     # Modern, responsive client-side interface
│   ├── index.html                # Public homepage & innovation showcase
│   ├── dashboard.html            # Emergency operations centre (EOC) dashboard
│   ├── incidents.html            # Incident queue, filter/search & management
│   ├── report.html               # Field incident reporting & coordinate picker
│   ├── map.html                  # Interactive Leaflet disaster map & router
│   ├── resources.html            # Rescue asset pool & deployment readiness
│   ├── shelters.html             # Relief shelters & vulnerable demographics
│   ├── analytics.html            # SITREP analytics & CSV exporter
│   ├── about.html                # Project background, theme & ethics
│   │
│   ├── css/
│   │   ├── style.css             # Design tokens, navbar, buttons, modals, toasts
│   │   ├── dashboard.css         # 8 KPI cards, widgets, timelines, mini-map
│   │   ├── map.css               # Leaflet custom pins, legend, floating drawer
│   │   └── responsive.css        # Mobile, tablet, and desktop media queries
│   │
│   ├── js/
│   │   ├── config.js             # API base URL & coordination settings
│   │   ├── api.js                # Centralized Fetch wrapper & toast manager
│   │   ├── app.js                # Health monitor & in-app alerts drawer
│   │   ├── dashboard.js          # Operations centre charts & triage feed
│   │   ├── incidents.js          # Incident CRUD, notes log & status changes
│   │   ├── report.js             # Geolocation, map picker & intake validation
│   │   ├── map.js                # Leaflet layers & corridor route calculations
│   │   ├── resources.js          # Fleet registration, status toggles & release
│   │   ├── shelters.js           # Capacity bounds validation & occupancy
│   │   └── analytics.js          # Chart.js metrics & CSV export utility
│   │
│   └── assets/images/            # Icons, graphics, and visual assets
│
├── backend/                      # Modular Python FastAPI services
│   ├── main.py                   # REST API routes & CORS configuration
│   ├── database.py               # SQLite connection & session management
│   ├── models.py                 # SQLAlchemy relational ORM models
│   ├── schemas.py                # Pydantic validation schemas
│   ├── risk_engine.py            # Transparent explainable risk scoring
│   ├── dispatch_engine.py        # Proximity & capability affinity engine
│   ├── routing_engine.py         # Hazard-aware road corridor routing
│   ├── seed_data.py              # Idempotent realistic demonstration data
│   ├── test_app.py               # Automated 17-point verification suite
│   ├── requirements.txt          # Production Python dependencies
│   ├── .env.example              # Environment configuration template
│   │
│   └── services/
│       ├── __init__.py
│       ├── weather_service.py    # Live/simulated meteorological feeds
│       ├── location_service.py   # Geocoding & Pune landmark gazetteer
│       ├── places_service.py     # Critical trauma hospitals & fire brigades
│       └── alert_service.py      # In-app operational notifications
│
├── .gitignore                    # Git tracking exclusions
├── README.md                     # Comprehensive project documentation
└── PROJECT_GUIDE.md              # Beginner-friendly step-by-step VS Code guide
```

---

## 5. Quickstart & Installation Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### Step 1: Clone or Navigate to Project
```bash
cd RESQAI
```

### Step 2: Set Up Python Virtual Environment
```bash
# Windows (PowerShell)
python -m venv .venv
.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 4: Seed Database (Optional - runs automatically on startup if empty)
```bash
# Windows
python backend/seed_data.py
```

### Step 5: Start the FastAPI Backend Server
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*API will be available at:* `http://127.0.0.1:8000`  
*Interactive Swagger Documentation:* `http://127.0.0.1:8000/docs`

### Step 6: Start the Frontend Interface
Open a second terminal window:
```bash
# Navigate to the frontend directory
cd RESQAI/frontend

# Launch a lightweight local HTTP server:
python -m http.server 5500
```
*Open your browser and navigate to:* **`http://127.0.0.1:5500`**

*(Alternatively, you can open `frontend/index.html` directly in VS Code using the "Live Server" extension).*

---

## 6. Running the Verification Suite

A comprehensive 17-point automated test suite is bundled in `backend/test_app.py`:

```bash
python backend/test_app.py
```

**Verification Results:**
```
============================================================
STARTING RESQAI AUTOMATED TEST VERIFICATION SUITE
============================================================
[PASS] TEST 1: Health endpoint operational.
[PASS] TEST 2: Stats endpoint retrieved.
[PASS] TEST 3: Incident reported successfully with risk score.
[PASS] TEST 4: Incident verified in persistent SQLite database.
[PASS] TEST 5: Incident retrieved via GET endpoint with full details.
[PASS] TEST 6: Dashboard count increased.
[PASS] TEST 7: Search query located created incident.
[PASS] TEST 8: GeoJSON map feed verified for new incident.
[PASS] TEST 9: Risk engine returned transparent score with factors.
[PASS] TEST 10: Dispatch recommendations returned.
[PASS] TEST 11: Asset assigned to incident.
[PASS] TEST 12: Double-booking prevention verified (blocked concurrent assignment).
[PASS] TEST 13: Shelter occupancy bounds & auto-status transition validated.
[PASS] TEST 14: In-app operational alerts verified & marked as read.
[PASS] TEST 15: Analytics SITREP summary computed directly from database.
[PASS] TEST 16: Safe route corridor generated with waypoints.
[PASS] TEST 17: Weather resilience feed operational.
============================================================
ALL 17 VERIFICATION TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL
============================================================
```

---

## 7. Key REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and operational status |
| `GET` | `/api/stats` | Dashboard KPI overview metrics |
| `GET` | `/api/incidents` | Search, filter, and sort incident records |
| `POST` | `/api/incidents` | Submit report, calculate risk score, create alerts |
| `GET` | `/api/incidents/{id}` | Full incident details with audit notes & assignments |
| `PATCH` | `/api/incidents/{id}/status` | Transition operational status with remarks |
| `POST` | `/api/incidents/{id}/recommend-resources` | AI-ranked suitable rescue assets |
| `POST` | `/api/incidents/{id}/assign-resource` | Authorize asset dispatch to incident |
| `POST` | `/api/risk/assess` | Standalone hypothetical risk calculation |
| `GET` | `/api/resources` | Query rescue fleet availability |
| `POST` | `/api/resources/{id}/release` | Release unit back to available pool |
| `GET` | `/api/shelters` | Query relief shelter occupancy & capacities |
| `PATCH` | `/api/shelters/{id}` | Update headcount with boundary enforcement |
| `GET` | `/api/map/incidents` | GeoJSON incident features for Leaflet |
| `POST` | `/api/routes/recommend` | Compute transit corridor avoiding hazard nodes |
| `GET` | `/api/weather` | Retrieve meteorological conditions for disaster sector |
| `GET` | `/api/alerts` | In-app operational notifications |
| `GET` | `/api/analytics/summary` | Aggregated situation data for Chart.js |

---

## 8. Real-World Limitations & Ethical Disclosure

RESQAI was developed as an academic prototype for the **International Grand Challenge 2026**. In compliance with competition guidelines and ethical engineering principles:
1. **Decision Support, Not Autonomy:** AI models provide advisory risk scores and asset recommendations. Real-world emergency dispatch must always be reviewed and authorized by certified human officers.
2. **Transit Routing Limitations:** Routing calculations evaluate geometric waypoints and historical road tortuosity ($1.32\times$) while checking proximity to reported database hazard nodes. It does not replace physical driver reconnaissance of live flash flooding, power line downings, or local police barricades.
3. **No Direct Emergency Dispatch:** Submitting reports on this prototype does not initiate official municipal 112/NDRF dispatch without production authenticated CAD gateways.
4. **Data Privacy:** Demonstrations utilize synthetic test records around Pune landmarks to avoid exposing real personally identifiable information (PII).

---

## 9. Future Scope & Roadmap

- **Official IMD Radar Gateway:** Integrate India Meteorological Department Doppler radar APIs for rainfall nowcasting.
- **IoT River Gauging:** Link ultrasonic water depth sensors along the Mutha and Mula river channels for automated flash-flood triggers.
- **Multilingual Citizen Intake:** Add voice intake in Marathi, Hindi, and English with automated speech recognition.
- **Offline Mesh Networking:** Support LoRaWAN or disaster mesh radio packet synchronization for field operation during cellular grid collapse.

---

## 10. License & Attribution

Built for the **International Grand Challenge 2026, Pune, India**.  
Maps © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Icons by [Lucide](https://lucide.dev/).
