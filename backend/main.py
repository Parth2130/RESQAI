import sys
import os
import random
import string
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from database import engine, Base, get_db
from models import User, EmergencyReport, ReportHistory
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_admin
from config import INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME

# Services
from services.weather import fetch_weather_data
from services.earthquakes import fetch_earthquakes_data
from services.alerts import fetch_ndma_alerts
from services.fires import fetch_nasa_fires
from services.nugen_ai import generate_chat_response, is_nugen_configured

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RESQAI Emergency Response API",
    description="Real-Time Disaster Telemetry, Citizen SOS Reporting, and AI Preparedness Platform",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_tracking_id() -> str:
    """Generates an alphanumeric tracking ID e.g. RESQ-9824X"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"RESQ-{suffix}"

@app.on_event("startup")
def startup_event():
    """Initializes tables and creates initial administrator if none exists."""
    db = next(get_db())
    try:
        # Check if default admin exists
        admin = db.query(User).filter(User.email == INITIAL_ADMIN_EMAIL).first()
        if not admin:
            hashed = hash_password(INITIAL_ADMIN_PASSWORD)
            new_admin = User(
                name=INITIAL_ADMIN_NAME,
                email=INITIAL_ADMIN_EMAIL,
                password_hash=hashed,
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print(f"[RESQAI-STARTUP] Created default admin account: {INITIAL_ADMIN_EMAIL}")

        # Seed initial realistic demonstration citizen reports if database is empty
        if db.query(EmergencyReport).count() == 0:
            sample_reports = [
                {
                    "name": "Ramesh Patil",
                    "contact": "+91 98230 45671",
                    "emergency_type": "Flood",
                    "description": "Flash flooding in low-lying area near Mutha riverbank. 4 elderly citizens stranded on rooftop.",
                    "location": "Shivaji Nagar, Pune, Maharashtra",
                    "latitude": 18.5308,
                    "longitude": 73.8475,
                    "severity": "Critical",
                    "affected_count": 4,
                    "status": "Acknowledged"
                },
                {
                    "name": "Aarav Sharma",
                    "contact": "+91 98112 34567",
                    "emergency_type": "Waterlogging",
                    "description": "Heavy water accumulation blocking main hospital access route under Minto bridge.",
                    "location": "Connaught Place, New Delhi",
                    "latitude": 28.6315,
                    "longitude": 77.2167,
                    "severity": "High",
                    "affected_count": 12,
                    "status": "Under Review"
                },
                {
                    "name": "Sunita Deshmukh",
                    "contact": "+91 94220 89123",
                    "emergency_type": "Landslide",
                    "description": "Small rockslide blocking lane on ghat road after heavy monsoon precipitation. Traffic halted.",
                    "location": "Lonavala Ghats, Maharashtra",
                    "latitude": 18.7557,
                    "longitude": 73.4091,
                    "severity": "Medium",
                    "affected_count": 6,
                    "status": "Submitted"
                },
                {
                    "name": "Vikram Sen",
                    "contact": "+91 98301 77654",
                    "emergency_type": "Cyclone",
                    "description": "Fallen banyan tree damaged power cables and blocked community center entrance.",
                    "location": "Digha Coastal Belt, West Bengal",
                    "latitude": 21.6266,
                    "longitude": 87.5074,
                    "severity": "High",
                    "affected_count": 25,
                    "status": "Resolved"
                }
            ]

            for s in sample_reports:
                t_id = generate_tracking_id()
                report = EmergencyReport(
                    tracking_id=t_id,
                    name=s["name"],
                    contact=s["contact"],
                    emergency_type=s["emergency_type"],
                    description=s["description"],
                    location=s["location"],
                    latitude=s["latitude"],
                    longitude=s["longitude"],
                    severity=s["severity"],
                    affected_count=s["affected_count"],
                    status=s["status"]
                )
                db.add(report)
                db.flush()

                hist = ReportHistory(
                    report_id=report.id,
                    previous_status=None,
                    new_status=s["status"],
                    notes="Initial report logged into RESQAI community portal.",
                    updated_by="System Initializer"
                )
                db.add(hist)

            db.commit()
            print("[RESQAI-STARTUP] Seeded initial demonstration community reports.")
    except Exception as e:
        db.rollback()
        print(f"[RESQAI-STARTUP-WARN] Startup check encountered: {e}")
    finally:
        db.close()

# ============================================================================
# GENERAL & HEALTH
# ============================================================================

@app.get("/api/health", tags=["General"])
def health_check(db: Session = Depends(get_db)):
    """System health check and operational status."""
    try:
        report_count = db.query(EmergencyReport).count()
        return {
            "status": "healthy",
            "service": "RESQAI Emergency Response API",
            "database_connected": True,
            "total_citizen_reports": report_count,
            "nugen_configured": is_nugen_configured(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "national_emergency_number": "112"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )

# ============================================================================
# LIVE TELEMETRY APIS
# ============================================================================

@app.get("/api/weather", response_model=schemas.WeatherResponse, tags=["Live Telemetry"])
async def get_weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    city: Optional[str] = Query(None, description="City name (e.g. delhi, mumbai, pune, kolkata, bengaluru)")
):
    """Fetches real-time weather and precipitation risks from Open-Meteo."""
    try:
        return await fetch_weather_data(lat=lat, lon=lon, city=city)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo weather fetch error: {str(e)}")

@app.get("/api/earthquakes", response_model=schemas.EarthquakesResponse, tags=["Live Telemetry"])
async def get_earthquakes(
    min_magnitude: float = Query(2.0, ge=0.0, le=10.0, description="Minimum magnitude filter"),
    region: str = Query("all", description="'all' or 'india' (South Asia seismic zone)")
):
    """Fetches real-time earthquake feeds from USGS GeoJSON API."""
    try:
        return await fetch_earthquakes_data(min_mag=min_magnitude, region_filter=region)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"USGS Earthquake API fetch error: {str(e)}")

@app.get("/api/alerts", response_model=schemas.AlertsResponse, tags=["Live Telemetry"])
async def get_alerts():
    """Queries NDMA SACHET public disaster alerts for India or explains availability status."""
    try:
        return await fetch_ndma_alerts()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NDMA Alerts service error: {str(e)}")

@app.get("/api/fires", response_model=schemas.FiresResponse, tags=["Live Telemetry"])
async def get_fires():
    """Queries satellite-based thermal anomalies from NASA FIRMS when key is configured."""
    try:
        return await fetch_nasa_fires()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA FIRMS service error: {str(e)}")

# ============================================================================
# CITIZEN EMERGENCY SOS REPORTING & TRACKING
# ============================================================================

@app.get("/api/reports", response_model=List[schemas.ReportPublic], tags=["Citizen SOS"])
def list_reports(
    status_filter: Optional[str] = Query(None, description="Submitted, Under Review, Acknowledged, Resolved, Closed"),
    type_filter: Optional[str] = Query(None, description="Flood, Cyclone, Earthquake, Fire, Landslide, Medical, Other"),
    severity_filter: Optional[str] = Query(None, description="Critical, High, Medium, Low"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Public situational awareness report list.
    STRICT PRIVACY: Does NOT expose citizen names or phone numbers.
    """
    query = db.query(EmergencyReport)
    if status_filter:
        query = query.filter(EmergencyReport.status == status_filter)
    if type_filter:
        query = query.filter(EmergencyReport.emergency_type.ilike(f"%{type_filter}%"))
    if severity_filter:
        query = query.filter(EmergencyReport.severity == severity_filter)

    reports = query.order_by(desc(EmergencyReport.created_at)).limit(limit).all()
    return reports

@app.post("/api/reports", tags=["Citizen SOS"])
def submit_emergency_report(
    report_data: schemas.ReportCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a citizen emergency SOS report.
    Validates input, stores in DB, generates unique tracking ID.
    Displays clear non-dispatch emergency disclaimer.
    """
    tracking_id = generate_tracking_id()

    report = EmergencyReport(
        tracking_id=tracking_id,
        name=report_data.name.strip(),
        contact=report_data.contact.strip(),
        emergency_type=report_data.emergency_type.strip(),
        description=report_data.description.strip(),
        location=report_data.location.strip(),
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        severity=report_data.severity,
        affected_count=report_data.affected_count,
        image_url=report_data.image_url,
        status="Submitted"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Initial history log
    initial_history = ReportHistory(
        report_id=report.id,
        previous_status=None,
        new_status="Submitted",
        notes="Emergency report logged by citizen into RESQAI portal.",
        updated_by="Citizen Submission"
    )
    db.add(initial_history)
    db.commit()

    return {
        "success": True,
        "tracking_id": tracking_id,
        "status": "Submitted",
        "created_at": report.created_at.isoformat() + "Z",
        "message": "Emergency report recorded successfully. Save your tracking ID to follow status updates.",
        "disclaimer": "RESQAI is an informational and reporting platform. It is not an official emergency dispatch service. In immediate danger, call India's emergency number 112 directly."
    }

@app.get("/api/reports/{tracking_id}", response_model=schemas.ReportTrackingResponse, tags=["Citizen SOS"])
def track_report(tracking_id: str, db: Session = Depends(get_db)):
    """Enables citizens to track the status and responder notes of their emergency report."""
    report = db.query(EmergencyReport).filter(EmergencyReport.tracking_id == tracking_id.strip().upper()).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with tracking ID '{tracking_id}' was not found. Please verify the ID."
        )
    return report

# ============================================================================
# AI EMERGENCY ASSISTANT (NUGEN AI)
# ============================================================================

@app.get("/api/assistant/status", tags=["AI Assistant"])
def assistant_status():
    """Checks whether Nugen AI credentials are configured in backend environment."""
    configured = is_nugen_configured()
    return {
        "configured": configured,
        "provider": "Nugen AI",
        "endpoint": "https://api.nugen.in/api/v3/inference/chat/completions",
        "languages_supported": ["en (English)", "hi (Hindi)", "mr (Marathi)"],
        "message": "Nugen AI is fully configured." if configured else "AI Assistant is not configured. Please configure Nugen credentials (NUGEN_API_KEY and NUGEN_MODEL_ID in .env)."
    }

@app.post("/api/assistant/chat", response_model=schemas.ChatResponse, tags=["AI Assistant"])
async def assistant_chat(
    req: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Conversational preparedness and safety assistant.
    Securely calls Nugen AI from backend with live weather and earthquake grounding.
    """
    # Build live grounding context if location or recent data is requested
    live_grounding = {}
    try:
        # Fetch weather for grounding
        weather_info = await fetch_weather_data(lat=req.latitude, lon=req.longitude, city=req.location)
        live_grounding["weather"] = weather_info
    except Exception:
        pass

    try:
        # Fetch earthquakes
        eq_info = await fetch_earthquakes_data(min_mag=3.0)
        live_grounding["recent_earthquakes"] = eq_info.get("earthquakes", [])[:5]
    except Exception:
        pass

    try:
        alert_info = await fetch_ndma_alerts()
        live_grounding["alerts"] = alert_info
    except Exception:
        pass

    history_dicts = [{"role": m.role, "content": m.content} for m in req.conversation_history] if req.conversation_history else []

    response = await generate_chat_response(
        message=req.message,
        language=req.language,
        live_grounding=live_grounding,
        history=history_dicts
    )

    return {
        "response": response.get("response", ""),
        "language": req.language,
        "grounding": live_grounding if live_grounding else None,
        "provider": response.get("provider", "Nugen AI"),
        "disclaimer": "RESQAI is an informational safety platform. Never substitute AI guidance for official government emergency orders. In immediate danger, call 112.",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ============================================================================
# ADMIN CONTROL ROOM DASHBOARD
# ============================================================================

@app.post("/api/admin/login", response_model=schemas.AdminTokenResponse, tags=["Admin Control"])
def admin_login(creds: schemas.AdminLoginRequest, db: Session = Depends(get_db)):
    """Authenticates admin officer and issues JWT bearer token."""
    user = db.query(User).filter(User.email == creds.email.strip().lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/admin/reports", response_model=List[schemas.ReportAdmin], tags=["Admin Control"])
def admin_list_reports(
    search: Optional[str] = Query(None, description="Search tracking ID, citizen name, location"),
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Protected admin endpoint to review citizen reports with complete contact details."""
    query = db.query(EmergencyReport)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EmergencyReport.tracking_id.ilike(search_pattern),
                EmergencyReport.name.ilike(search_pattern),
                EmergencyReport.location.ilike(search_pattern),
                EmergencyReport.emergency_type.ilike(search_pattern)
            )
        )

    if status_filter:
        query = query.filter(EmergencyReport.status == status_filter)

    if severity_filter:
        query = query.filter(EmergencyReport.severity == severity_filter)

    reports = query.order_by(desc(EmergencyReport.created_at)).all()
    return reports

@app.patch("/api/admin/reports/{report_id}/status", response_model=schemas.ReportAdmin, tags=["Admin Control"])
def admin_update_report_status(
    report_id: int,
    status_update: schemas.ReportStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Updates the operational status of an emergency report and appends to the audit trail history.
    """
    report = db.query(EmergencyReport).filter(EmergencyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Emergency report not found")

    valid_statuses = ["Submitted", "Under Review", "Acknowledged", "Resolved", "Closed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    prev_status = report.status
    report.status = status_update.status
    report.updated_at = datetime.utcnow()

    # Append to report history
    history_entry = ReportHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=status_update.status,
        notes=status_update.notes or f"Status changed from {prev_status} to {status_update.status}",
        updated_by=f"Admin ({admin_user.name})"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(report)

    return report

@app.post("/api/admin/setup", tags=["Admin Control"])
def setup_first_admin(setup_data: schemas.AdminSetupRequest, db: Session = Depends(get_db)):
    """Allows initial setup only if zero users exist in the system."""
    if db.query(User).count() > 0:
        raise HTTPException(status_code=400, detail="Administrator already initialized. Please log in.")

    new_admin = User(
        name=setup_data.name.strip(),
        email=setup_data.email.strip().lower(),
        password_hash=hash_password(setup_data.password),
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return {"message": "Admin user created successfully", "email": new_admin.email}

# Mount static frontend production build if available
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Don't intercept API routes or docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
