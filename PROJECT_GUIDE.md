# RESQAI: Beginner-Friendly VS Code Setup & Testing Guide

Welcome to the **RESQAI** project guide! This document is written step-by-step for students, judges, and developers learning full-stack development who want to run, evaluate, and test the complete application in **Visual Studio Code (VS Code)** on Windows, macOS, or Linux.

---

## Part 1: Prerequisites Check

Before starting, make sure you have:
1. **VS Code** installed on your system.
2. **Python 3.10 or higher** installed. (Check by typing `python --version` in terminal).
3. A modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari).

---

## Part 2: Open the Project in VS Code

1. Launch **Visual Studio Code**.
2. Click **File > Open Folder...** from the top menu.
3. Browse to and select the project folder:
   ```
   C:\Users\<YourUser>\.gemini\antigravity\scratch\RESQAI
   ```
4. You should see the following folders in the VS Code Explorer pane on the left:
   - `backend/`
   - `frontend/`
   - `README.md`
   - `PROJECT_GUIDE.md`

---

## Part 3: Step-by-Step Backend Setup

### Step 3.1: Open a Terminal in VS Code
1. In VS Code, click **Terminal > New Terminal** from the top menu (or press `` Ctrl + ` ``).
2. By default, this opens PowerShell on Windows or Bash on macOS/Linux.

### Step 3.2: Create and Activate the Python Virtual Environment
Run the following commands in the terminal:

**On Windows (PowerShell):**
```powershell
# Create a virtual environment named .venv inside the RESQAI folder
python -m venv .venv

# Activate the virtual environment
.venv\Scripts\activate
```
*(If you see an error like "execution of scripts is disabled on this system", run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and then run `.venv\Scripts\activate` again).*

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

When activated, you will see `(.venv)` at the beginning of your terminal command prompt.

### Step 3.3: Install Backend Dependencies
Run:
```bash
pip install -r backend/requirements.txt
```
This installs FastAPI, Uvicorn, SQLAlchemy, Pydantic, Requests, and Httpx.

### Step 3.4: (Optional) Pre-Seed the Database
The application automatically creates `backend/resqai.db` and loads realistic initial demo records if the database is empty. You can also run the seed script directly:
```bash
python backend/seed_data.py
```
You should see:
```
[INFO] Seeded Shelters successfully.
[INFO] Seeded Resources successfully.
[INFO] Seeded Incidents with Risk Assessments successfully.
[INFO] Seeded Alerts successfully.
```

### Step 3.5: Run the Verification Test Suite
Before starting the servers, run the automated test suite to confirm everything is configured properly:
```bash
python backend/test_app.py
```
You should see:
```
ALL 17 VERIFICATION TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL
```

### Step 3.6: Start the FastAPI Backend Server
Now start the live Uvicorn ASGI server:
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```
> **Keep this terminal running!** Do not close it. This is your backend server.

---

## Part 4: Step-by-Step Frontend Setup

To test the frontend, open a **second terminal** in VS Code:
1. In the top-right corner of the terminal pane, click the **`+` (Split or New Terminal)** button.
2. In this second terminal, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Start Python's built-in lightweight web server on port 5500:
   ```bash
   python -m http.server 5500
   ```
   You should see:
   ```
   Serving HTTP on :: port 5500 (http://[::]:5500/) ...
   ```

*(Alternatively: If you have the "Live Server" extension installed in VS Code, right-click `frontend/index.html` and click "Open with Live Server").*

---

## Part 5: Opening and Exploring the Application

Open your browser and navigate to:

| Page / Tool | Local URL | What It Does |
|---|---|---|
| **RESQAI Homepage** | **`http://127.0.0.1:5500`** | Public presentation, features, problem statement |
| **Live Operations Dashboard** | **`http://127.0.0.1:5500/dashboard.html`** | 8 KPI cards, priority table, mini-map, charts |
| **Incident Management Queue** | **`http://127.0.0.1:5500/incidents.html`** | Search, filter, status lifecycle, dispatch |
| **Report Incident Intake** | **`http://127.0.0.1:5500/report.html`** | Form, GPS locator, map pin picker, risk calculation |
| **Interactive Disaster Map** | **`http://127.0.0.1:5500/map.html`** | Full Leaflet map, layer toggles, corridor routing |
| **Rescue Resource Fleet** | **`http://127.0.0.1:5500/resources.html`** | Fleet directory, add unit, status toggles, release |
| **Relief Shelters** | **`http://127.0.0.1:5500/shelters.html`** | Capacity progress bars, headcount updater |
| **Situation Analytics (SITREP)** | **`http://127.0.0.1:5500/analytics.html`** | Chart.js breakdowns, CSV export, printable SITREP |
| **About Project** | **`http://127.0.0.1:5500/about.html`** | Competition submission context & ethics |
| **FastAPI Interactive Docs** | **`http://127.0.0.1:8000/docs`** | Swagger UI to inspect and test all backend endpoints |

---

## Part 6: Step-by-Step End-to-End Workflow Test

Follow these exact steps to demonstrate the entire disaster response lifecycle:

### Step 1: Check Live Health & Statistics
1. Go to `http://127.0.0.1:5500/dashboard.html`.
2. Notice the green **API Online** indicator in the top navbar.
3. Observe the 8 live KPI cards (Total Incidents, Critical Situations, Available Ambulances, etc.).
4. Notice the Pune Weather Ticker displaying meteorological conditions.

### Step 2: Log a New Disaster Incident
1. Click **"Report Incident"** in the navigation bar.
2. Fill in the intake form:
   - **Title:** `Submerged School Bus at Deccan Underpass`
   - **Type:** `Flash flood`
   - **Severity:** `Critical`
   - **Description:** `Heavy cloudburst runoff flooded the underpass up to 1.5 meters. 14 children and driver stranded.`
   - **People Affected:** `20`
   - **Needing Urgent Rescue:** `15`
   - **Location:** `Deccan Gymkhana Underpass, Pune`
3. Click anywhere on the interactive map picker to adjust the coordinates.
4. Click **"Submit & Run Risk Assessment"**.
5. Observe the immediate success confirmation:
   - Generated code (e.g. `INC-1007`).
   - Risk Score calculated (e.g. `98/100 (Critical)`).
   - Contributing factor explanation (Mass casualty threat, critical severity grade, weather advisory modifier).
6. Click **"Manage in Incident Queue"**.

### Step 3: Triage and Dispatch Rescue Asset
1. You are now on `incidents.html`. The new incident appears at the top of the table.
2. Click the **"Manage"** button next to the incident.
3. In the modal, review the AI Risk Assessment.
4. Click **"AI Recommend Units"**.
5. Notice how the engine suggests water rescue assets (e.g. *Sahyadri Flood Rescue Boat Alpha* or *NDRF Search Unit*) based on capability affinity and proximity.
6. Click **"Dispatch"** next to an available unit and confirm.
7. Observe:
   - Toast notification confirms dispatch.
   - The asset is marked **Assigned**.
   - An operational audit note is added to the timeline.
   - An in-app alert is generated in the top bell icon.

### Step 4: Inspect the Geospatial Disaster Map
1. Click **"Disaster Map"** in the top navigation bar (`map.html`).
2. Notice the color-coded markers across the Pune basin:
   - Red pins: Critical incidents.
   - Orange pins: High risk.
   - Purple pins: Rescue staging units.
   - Cyan pins: Relief shelters.
3. In the floating panel on the left, use the **Transit Corridor Router**:
   - Select an **Origin** (e.g. *Sahyadri Flood Rescue Boat*).
   - Select a **Destination** (e.g. the newly logged incident).
   - Click **"Calculate Safe Corridor"**.
4. Observe the polyline drawn along the road network with estimated driving distance, transit time, and hazard proximity warnings.

### Step 5: Update Shelter Headcount & Verify Constraints
1. Click **"Shelters"** (`shelters.html`).
2. Pick any shelter and click **"Update Headcount"**.
3. Try entering an invalid number greater than the total capacity: notice how the system refuses and displays an error toast.
4. Enter a valid high number (e.g. 92% of capacity):
   - Notice the progress bar turns coral red.
   - The status updates to **"Near Capacity"**.
   - A high-severity capacity alert is pushed to the operations bell.

### Step 6: Export SITREP Analytics
1. Click **"Analytics"** (`analytics.html`).
2. View the 4 interactive Chart.js graphs reflecting the updated database state.
3. Click **"Export Incidents CSV"** to download `RESQAI_Incident_SITREP.csv` to your computer.
4. Click **"Print Summary Report"** for an officer briefing format.

---

## Part 7: Troubleshooting Common Issues

### Issue 1: "Cannot connect to RESQAI backend server"
- **Cause:** The FastAPI backend is not running on port 8000.
- **Fix:** Open terminal 1, activate `.venv`, and make sure you run:
  ```bash
  python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
  ```
  Visit `http://127.0.0.1:8000/api/health` in your browser. It should return `{"status": "healthy"}`.

### Issue 2: "Port 8000 or 5500 already in use"
- **Cause:** Another program is using port 8000 or 5500.
- **Fix (Windows):**
  ```powershell
  # Find process using port 8000
  netstat -ano | findstr :8000
  # Or simply run uvicorn on another port, e.g. 8080:
  python -m uvicorn backend.main:app --port 8080
  ```
  *(If you change the port to 8080, remember to update `API_BASE_URL` in `frontend/js/config.js` to `http://127.0.0.1:8080/api`).*

### Issue 3: "Execution of scripts is disabled on this system"
- **Cause:** Windows PowerShell execution policy restriction.
- **Fix:** In PowerShell as Administrator or user:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Then activate `.venv\Scripts\activate` again.

### Issue 4: Resetting the Database to Fresh Demo State
If you want to wipe test records and return to the clean demo state:
1. Stop the backend server (`Ctrl + C` in Terminal 1).
2. Delete the file `backend/resqai.db`.
3. Run `python backend/seed_data.py`.
4. Restart the backend server.
