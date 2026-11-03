import os
import sys
import random
import string
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from database import engine, Base, get_db
from models import (
    User, Incident, IncidentUpdate, SOSRequest, DisasterEvent,
    Resource, Responder, Assignment, Notification, RiskAssessment, AuditLog,
    EmergencyReport, ReportHistory
)
import schemas
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_responder, get_current_admin, get_optional_user
)
from config import INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME

# Services
from services.weather import fetch_weather_data
from services.earthquakes import fetch_earthquakes_data
from services.alerts import fetch_ndma_alerts
from services.fires import fetch_nasa_fires
from services.nugen_ai import (
    classify_emergency_report, assess_incident_risk,
    generate_chat_response, generate_response_recommendations,
    is_nugen_configured
)
from routing_engine import plan_hazard_aware_route
from seed_data import seed_database

# Initialize database schema and initial data
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RESQAI Emergency Management API",
    description="Real-Time Disaster Telemetry, Citizen SOS, Intelligent Triage & Response Routing",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_tracking_id() -> str:
    """Generates an official Incident ID e.g. RQ-2026-9824X"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"RQ-2026-{suffix}"

@app.on_event("startup")
def startup_event():
    """Seeds initial demonstration data and administrator accounts on first run."""
    seed_database()

# ============================================================================
# SYSTEM HEALTH & STATUS
# ============================================================================

@app.get("/api/health", tags=["General"])
def health_check(db: Session = Depends(get_db)):
    """System operational telemetry and service status."""
    try:
        report_count = db.query(Incident).count()
        resource_count = db.query(Resource).count()
        responder_count = db.query(Responder).count()
        return {
            "status": "operational",
            "service": "RESQAI Emergency Management System",
            "version": "3.0.0",
            "database_connected": True,
            "total_incidents": report_count,
            "total_resources": resource_count,
            "active_responders": responder_count,
            "nugen_ai_configured": is_nugen_configured(),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "national_emergency_helpline": "112"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")

# ============================================================================
# AUTHENTICATION & USER MANAGEMENT
# ============================================================================

@app.post("/api/auth/register", response_model=schemas.TokenResponse, tags=["Authentication"])
def register_user(reg: schemas.UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user. Responders require authorized admin verification."""
    existing = db.query(User).filter(User.email == reg.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    # Citizens are verified by default; Responders and Admins require explicit verification
    is_verified = (reg.role == "citizen")

    new_user = User(
        name=reg.name.strip(),
        email=reg.email.strip().lower(),
        password_hash=hash_password(reg.password),
        role=reg.role if reg.role in ["citizen", "responder", "admin"] else "citizen",
        phone=reg.phone,
        agency=reg.agency,
        verified=is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit
    audit = AuditLog(
        user_id=new_user.id,
        user_name=new_user.name,
        action="USER_REGISTRATION",
        target_type="USER",
        target_id=str(new_user.id),
        details=f"User registered with role: {new_user.role} (verified={is_verified})"
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role, "name": new_user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Authentication"])
def login_user(creds: schemas.UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates citizen, responder, or administrator."""
    user = db.query(User).filter(User.email == creds.email.strip().lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email address or password.")

    token = create_access_token(data={"sub": str(user.id), "role": user.role, "name": user.name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.UserProfileResponse, tags=["Authentication"])
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return current_user

# Legacy admin auth endpoints for backward compatibility
@app.post("/api/admin/login", response_model=schemas.TokenResponse, tags=["Authentication"])
def admin_login_legacy(creds: schemas.AdminLoginRequest, db: Session = Depends(get_db)):
    return login_user(creds, db)

@app.post("/api/admin/setup", tags=["Authentication"])
def admin_setup_legacy(setup: schemas.AdminSetupRequest, db: Session = Depends(get_db)):
    if db.query(User).count() > 0:
        raise HTTPException(status_code=400, detail="System already initialized.")
    new_admin = User(
        name=setup.name.strip(),
        email=setup.email.strip().lower(),
        password_hash=hash_password(setup.password),
        role="admin",
        verified=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return {"message": "Admin user created successfully", "email": new_admin.email}

# ============================================================================
# INCIDENT REPORTING & TRIAGE
# ============================================================================

@app.get("/api/incidents", response_model=List[schemas.IncidentPublic], tags=["Incidents"])
def list_incidents(
    status_filter: Optional[str] = Query(None, description="New, Under Verification, Verified, Assigned, Rescue in Progress, Resolved, Closed"),
    type_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Public situational awareness incident list.
    Hides personal citizen contact info for privacy.
    """
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if type_filter:
        query = query.filter(Incident.emergency_type.ilike(f"%{type_filter}%"))
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)

    incidents = query.order_by(desc(Incident.created_at)).limit(limit).all()
    return incidents

# Backward compatibility alias
@app.get("/api/reports", response_model=List[schemas.IncidentPublic], tags=["Incidents"])
def list_reports_compat(
    status_filter: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    return list_incidents(status_filter, type_filter, severity_filter, limit, db)

@app.post("/api/incidents", tags=["Incidents"])
async def create_incident(
    report_data: schemas.IncidentCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Submits a citizen emergency incident report.
    Triggers AI classification and risk analysis, stores incident, generates unique tracking ID.
    """
    tracking_id = generate_tracking_id()

    # Step 1: AI Analysis (Module 1)
    ai_classification = await classify_emergency_report(
        description=report_data.description,
        location=report_data.location
    )

    # Use AI classification if user selected general type or severity
    detected_type = report_data.emergency_type
    if detected_type in ["Other", "General"] and ai_classification.get("emergency_type"):
        detected_type = ai_classification["emergency_type"]

    detected_severity = report_data.severity
    if ai_classification.get("severity"):
        # Take the more conservative (higher) severity between citizen report and AI
        severity_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        if severity_rank.get(ai_classification["severity"], 2) > severity_rank.get(report_data.severity, 2):
            detected_severity = ai_classification["severity"]

    incident = Incident(
        tracking_id=tracking_id,
        user_id=current_user.id if current_user else None,
        name=report_data.name.strip(),
        contact=report_data.contact.strip(),
        emergency_type=detected_type,
        description=report_data.description.strip(),
        location=report_data.location.strip(),
        latitude=report_data.latitude,
        longitude=report_data.longitude,
        severity=detected_severity,
        priority=ai_classification.get("priority", "Standard"),
        affected_count=report_data.affected_count,
        injured_count=report_data.injured_count,
        vulnerable_people=report_data.vulnerable_people or ai_classification.get("vulnerable_people", False),
        image_url=report_data.image_url,
        status="New",
        source="Citizen Report",
        ai_classified=True,
        ai_summary=ai_classification.get("summary"),
        ai_confidence=ai_classification.get("confidence_score"),
        ai_raw_json=json.dumps(ai_classification)
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Initial history log
    history = IncidentUpdate(
        incident_id=incident.id,
        previous_status=None,
        new_status="New",
        notes=f"Emergency report registered. AI Triage: {ai_classification.get('summary', 'Standard triage')}",
        updated_by=f"Citizen ({report_data.name.strip()})"
    )
    db.add(history)

    # Step 2: Risk Assessment (Module 2)
    risk_data = await assess_incident_risk(
        incident_type=incident.emergency_type,
        severity=incident.severity,
        people_affected=incident.affected_count,
        people_needing_assistance=incident.injured_count,
        vulnerable_present=incident.vulnerable_people
    )
    risk = RiskAssessment(
        incident_id=incident.id,
        risk_level=risk_data.get("risk_level", incident.severity),
        score=risk_data.get("score", 50.0),
        hazard_points=risk_data.get("breakdown", {}).get("hazard_type_points", 0.0),
        severity_points=risk_data.get("breakdown", {}).get("severity_points", 0.0),
        assistance_points=risk_data.get("breakdown", {}).get("assistance_points", 0.0),
        vulnerable_points=risk_data.get("breakdown", {}).get("vulnerable_points", 0.0),
        environmental_points=risk_data.get("breakdown", {}).get("environmental_points", 0.0),
        explanation=risk_data.get("explanation", "Standard incident assessment"),
        contributing_factors=json.dumps(risk_data.get("contributing_factors", [])),
        recommendations=json.dumps(risk_data.get("recommendations", [])),
        limitations=json.dumps(risk_data.get("limitations", [])),
        ai_generated=risk_data.get("ai_generated", False)
    )
    db.add(risk)

    # Create in-app notification for responders/admins
    notif = Notification(
        title=f"New {incident.severity} Incident: {incident.emergency_type}",
        message=f"{incident.location}: {incident.description[:100]}... (ID: {incident.tracking_id})",
        type="alert",
        priority="critical" if incident.severity == "Critical" else "high"
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "incident_id": incident.id,
        "tracking_id": tracking_id,
        "emergency_type": incident.emergency_type,
        "severity": incident.severity,
        "status": incident.status,
        "ai_summary": incident.ai_summary,
        "created_at": incident.created_at.isoformat() + "Z",
        "message": "Emergency report registered successfully. Save your Tracking ID to monitor response status.",
        "disclaimer": "RESQAI is an informational disaster response platform. In immediate danger, call national emergency 112 directly."
    }

# Backward compatibility alias
@app.post("/api/reports", tags=["Incidents"])
async def create_report_compat(report_data: schemas.IncidentCreate, db: Session = Depends(get_db)):
    return await create_incident(report_data, None, db)

@app.get("/api/incidents/{identifier}", response_model=schemas.IncidentTrackingResponse, tags=["Incidents"])
def get_incident_detail(identifier: str, db: Session = Depends(get_db)):
    """Looks up incident by ID or unique tracking ID (e.g. RQ-2026-0001)."""
    query = db.query(Incident)
    if identifier.isdigit():
        incident = query.filter(Incident.id == int(identifier)).first()
    else:
        incident = query.filter(Incident.tracking_id == identifier.strip().upper()).first()

    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{identifier}' not found.")
    return incident

@app.get("/api/reports/{tracking_id}", response_model=schemas.IncidentTrackingResponse, tags=["Incidents"])
def get_report_compat(tracking_id: str, db: Session = Depends(get_db)):
    return get_incident_detail(tracking_id, db)

@app.patch("/api/incidents/{incident_id}/status", response_model=schemas.IncidentDetail, tags=["Incidents"])
def update_incident_status(
    incident_id: int,
    status_update: schemas.IncidentStatusUpdate,
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """
    Updates the operational triage status of an incident.
    Restricted to authorized responders and administrators.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    valid_statuses = ["New", "Under Verification", "Verified", "Assigned", "Rescue in Progress", "Resolved", "Closed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    prev_status = incident.status
    incident.status = status_update.status
    incident.updated_at = datetime.utcnow()

    # Append to update history
    history = IncidentUpdate(
        incident_id=incident.id,
        previous_status=prev_status,
        new_status=status_update.status,
        notes=status_update.notes or f"Status updated from {prev_status} to {status_update.status}",
        updated_by=f"{current_responder.name} ({current_responder.role.capitalize()})"
    )
    db.add(history)

    # Log audit
    audit = AuditLog(
        user_id=current_responder.id,
        user_name=current_responder.name,
        action="INCIDENT_STATUS_UPDATE",
        target_type="INCIDENT",
        target_id=str(incident.id),
        details=f"Status changed from {prev_status} to {status_update.status}. Notes: {status_update.notes}"
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)
    return incident

@app.patch("/api/admin/reports/{report_id}/status", response_model=schemas.IncidentDetail, tags=["Incidents"])
def admin_update_report_status_compat(
    report_id: int,
    status_update: schemas.IncidentStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return update_incident_status(report_id, status_update, admin_user, db)

@app.get("/api/admin/reports", response_model=List[schemas.IncidentDetail], tags=["Incidents"])
def admin_list_reports_all(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """Responder and Admin full incident list with citizen phone/contact info."""
    query = db.query(Incident)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Incident.tracking_id.ilike(pattern),
                Incident.name.ilike(pattern),
                Incident.location.ilike(pattern),
                Incident.emergency_type.ilike(pattern)
            )
        )
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)

    return query.order_by(desc(Incident.created_at)).all()

# ============================================================================
# SOS EMERGENCY DISTRESS
# ============================================================================

@app.post("/api/sos", response_model=schemas.SOSResponse, tags=["SOS Emergency"])
def trigger_sos_distress(
    sos_data: schemas.SOSCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Instant SOS beacon trigger. Transmits GPS coordinates and generates urgent incident.
    """
    tracking_id = generate_tracking_id()

    # Create Incident
    incident = Incident(
        tracking_id=tracking_id,
        user_id=current_user.id if current_user else None,
        name=sos_data.name,
        contact=sos_data.contact,
        emergency_type="Immediate SOS Distress",
        description=sos_data.details or "Emergency SOS Distress triggered with live GPS coordinates.",
        location=sos_data.location_text or f"GPS ({round(sos_data.latitude, 4)}, {round(sos_data.longitude, 4)})",
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        severity="Critical",
        priority="Urgent",
        affected_count=1,
        status="New",
        source="SOS Distress",
        ai_classified=True,
        ai_summary="High-priority instant SOS distress beacon from mobile user.",
        ai_confidence=0.98
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Create SOS Record
    sos_req = SOSRequest(
        incident_id=incident.id,
        tracking_id=tracking_id,
        user_id=current_user.id if current_user else None,
        name=sos_data.name,
        contact=sos_data.contact,
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        location_text=sos_data.location_text,
        emergency_type="Immediate SOS Distress",
        details=sos_data.details,
        status="Active"
    )
    db.add(sos_req)

    # Initial history
    hist = IncidentUpdate(
        incident_id=incident.id,
        previous_status=None,
        new_status="New",
        notes="Urgent SOS Distress beacon triggered. Emergency coordinates received.",
        updated_by="SOS Automated System"
    )
    db.add(hist)

    # Notification
    notif = Notification(
        title="🚨 CRITICAL SOS DISTRESS BEACON",
        message=f"SOS beacon triggered at {incident.location}. Contact: {sos_data.contact} (ID: {tracking_id})",
        type="sos",
        priority="critical"
    )
    db.add(notif)
    db.commit()

    return {
        "success": True,
        "incident_id": incident.id,
        "tracking_id": tracking_id,
        "status": "Active",
        "latitude": sos_data.latitude,
        "longitude": sos_data.longitude,
        "created_at": incident.created_at.isoformat() + "Z",
        "message": "SOS distress beacon transmitted. Responders in your sector have been alerted.",
        "disclaimer": "RESQAI SOS transmits telemetry to response teams. If you are in immediate danger, dial 112 directly."
    }

@app.get("/api/sos", tags=["SOS Emergency"])
def list_active_sos(
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """Lists active SOS beacons for responders."""
    return db.query(SOSRequest).order_by(desc(SOSRequest.created_at)).all()

# ============================================================================
# NUGEN AI MODULES (1, 2, 3, 4)
# ============================================================================

@app.get("/api/ai/status", tags=["Nugen AI"])
@app.get("/api/assistant/status", tags=["Nugen AI"])
def get_ai_status():
    """Checks whether Nugen AI credentials and models are configured."""
    configured = is_nugen_configured()
    return {
        "configured": configured,
        "provider": "Nugen AI",
        "endpoint": "https://api.nugen.in/api/v3/inference/chat/completions",
        "supported_languages": ["en (English)", "hi (Hindi)", "mr (Marathi)"],
        "modules_active": [
            "Module 1: Emergency Classification",
            "Module 2: Risk Assessment Engine",
            "Module 3: Safety & Preparedness Assistant",
            "Module 4: Response Recommendations"
        ],
        "message": "Nugen AI is fully configured." if configured else "AI modules active via Rule-based Decision Engine (Nugen AI Standby). Configure NUGEN_API_KEY and NUGEN_MODEL for custom LLM inference."
    }

@app.post("/api/ai/classify", response_model=schemas.AIClassificationResponse, tags=["Nugen AI"])
async def api_ai_classify(req: schemas.AIClassificationRequest):
    """AI Module 1: Classify emergency description into structured triage JSON."""
    result = await classify_emergency_report(description=req.description, location=req.location)
    return result

@app.post("/api/ai/assess-risk", response_model=schemas.AIRiskAssessmentResponse, tags=["Nugen AI"])
async def api_ai_assess_risk(req: schemas.AIRiskAssessmentRequest):
    """AI Module 2: Compute multi-factor risk assessment and explanation."""
    result = await assess_incident_risk(
        incident_type=req.incident_type,
        severity=req.severity,
        people_affected=req.people_affected,
        people_needing_assistance=req.people_needing_assistance,
        vulnerable_present=req.vulnerable_present
    )
    return result

@app.post("/api/ai/chat", response_model=schemas.ChatResponse, tags=["Nugen AI"])
@app.post("/api/assistant/chat", response_model=schemas.ChatResponse, tags=["Nugen AI"])
async def api_ai_chat(req: schemas.ChatRequest):
    """
    AI Module 3: Conversational preparedness and safety guidance assistant.
    Grounded with live Open-Meteo weather and USGS earthquake feeds.
    """
    live_grounding = {}
    try:
        w_data = await fetch_weather_data(lat=req.latitude, lon=req.longitude, city=req.location)
        live_grounding["weather"] = w_data
    except Exception:
        pass

    try:
        eq_data = await fetch_earthquakes_data(min_mag=3.5)
        live_grounding["recent_earthquakes"] = eq_data.get("earthquakes", [])[:4]
    except Exception:
        pass

    try:
        alert_data = await fetch_ndma_alerts()
        live_grounding["alerts"] = alert_data
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
        "disclaimer": "RESQAI is an informational safety platform. In immediate danger, call national emergency 112 directly.",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.post("/api/ai/recommend-response", response_model=schemas.AIRecommendationResponse, tags=["Nugen AI"])
def api_ai_recommend_response(
    req: schemas.AIRecommendationRequest,
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """AI Module 4: Generates operational resource and triage recommendations for field responders."""
    incident = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    incident_dict = {
        "id": incident.id,
        "tracking_id": incident.tracking_id,
        "emergency_type": incident.emergency_type,
        "severity": incident.severity,
        "vulnerable_people": incident.vulnerable_people,
        "affected_count": incident.affected_count
    }
    return generate_response_recommendations(incident_dict)

# ============================================================================
# LIVE TELEMETRY APIS (Open-Meteo, USGS, NASA FIRMS, NDMA SACHET)
# ============================================================================

@app.get("/api/weather", response_model=schemas.WeatherResponse, tags=["Live Telemetry"])
async def get_weather(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    city: Optional[str] = Query(None)
):
    """Fetches real-time weather and 5-day precipitation forecasts from Open-Meteo."""
    try:
        return await fetch_weather_data(lat=lat, lon=lon, city=city)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {str(e)}")

@app.get("/api/earthquakes", response_model=schemas.EarthquakesResponse, tags=["Live Telemetry"])
async def get_earthquakes(
    min_magnitude: float = Query(2.0, ge=0.0, le=10.0),
    region: str = Query("all", description="'all' or 'india'")
):
    """Fetches real-time seismic events from USGS GeoJSON API."""
    try:
        return await fetch_earthquakes_data(min_mag=min_magnitude, region_filter=region)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"USGS Earthquake error: {str(e)}")

@app.get("/api/alerts", response_model=schemas.AlertsResponse, tags=["Live Telemetry"])
async def get_alerts():
    """Queries official NDMA SACHET disaster warning portal status."""
    try:
        return await fetch_ndma_alerts()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Alert service error: {str(e)}")

@app.get("/api/fires", response_model=schemas.FiresResponse, tags=["Live Telemetry"])
async def get_fires():
    """Queries satellite thermal anomalies from NASA FIRMS."""
    try:
        return await fetch_nasa_fires()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NASA FIRMS error: {str(e)}")

# ============================================================================
# EMERGENCY RESOURCES & DISPATCH
# ============================================================================

@app.get("/api/resources", response_model=List[schemas.ResourceResponse], tags=["Resources"])
def list_resources(
    category: Optional[str] = Query(None, description="Hospital, Ambulance, Fire Station, Shelter, Rescue Team, Relief Center"),
    availability: Optional[str] = Query(None, description="Available, Deployed, Maintenance"),
    db: Session = Depends(get_db)
):
    """Lists verified emergency resources (hospitals, shelters, ambulances, etc.)."""
    query = db.query(Resource)
    if category:
        query = query.filter(Resource.category.ilike(f"%{category}%"))
    if availability:
        query = query.filter(Resource.availability == availability)
    return query.order_by(Resource.category, Resource.name).all()

@app.post("/api/resources", response_model=schemas.ResourceResponse, tags=["Resources"])
def create_resource(
    res_data: schemas.ResourceCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Adds a new verified emergency resource. Restricted to administrators."""
    resource = Resource(**res_data.dict())
    db.add(resource)
    db.commit()
    db.refresh(resource)

    audit = AuditLog(
        user_id=current_admin.id,
        user_name=current_admin.name,
        action="CREATE_RESOURCE",
        target_type="RESOURCE",
        target_id=str(resource.id),
        details=f"Resource '{resource.name}' ({resource.category}) created in {resource.location}."
    )
    db.add(audit)
    db.commit()
    return resource

@app.patch("/api/resources/{resource_id}", response_model=schemas.ResourceResponse, tags=["Resources"])
def update_resource(
    resource_id: int,
    updates: Dict[str, Any],
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """Updates resource availability, capacity, or occupancy."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found.")

    for k, v in updates.items():
        if hasattr(res, k) and k not in ["id", "created_at"]:
            setattr(res, k, v)

    res.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(res)
    return res

@app.delete("/api/resources/{resource_id}", tags=["Resources"])
def delete_resource(
    resource_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deletes an emergency resource. Restricted to administrators."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found.")
    db.delete(res)
    db.commit()
    return {"message": "Resource deleted successfully"}

# ============================================================================
# RESPONDERS & ASSIGNMENTS
# ============================================================================

@app.get("/api/responders", response_model=List[schemas.ResponderResponse], tags=["Responders"])
def list_responders(
    status_filter: Optional[str] = Query(None),
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """Lists field responders, specializations, and availability."""
    query = db.query(Responder)
    if status_filter:
        query = query.filter(Responder.status == status_filter)
    return query.all()

@app.post("/api/incidents/{incident_id}/assign", response_model=schemas.AssignmentResponse, tags=["Responders"])
def assign_to_incident(
    incident_id: int,
    assign_data: schemas.AssignmentCreate,
    current_responder: User = Depends(get_current_responder),
    db: Session = Depends(get_db)
):
    """Assigns a responder unit and resource to an active incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    assignment = Assignment(
        incident_id=incident_id,
        responder_id=assign_data.responder_id,
        resource_id=assign_data.resource_id,
        notes=assign_data.notes or "Unit deployed to incident location.",
        status="Assigned"
    )
    db.add(assignment)

    # Progress incident status to Assigned if currently New or Under Verification
    if incident.status in ["New", "Under Verification", "Verified"]:
        incident.status = "Assigned"
        hist = IncidentUpdate(
            incident_id=incident.id,
            previous_status="Verified",
            new_status="Assigned",
            notes=f"Assigned by {current_responder.name}. {assign_data.notes or ''}",
            updated_by=f"Officer {current_responder.name}"
        )
        db.add(hist)

    db.commit()
    db.refresh(assignment)
    return assignment

# ============================================================================
# SMART RESCUE ROUTING (HAZARD-AWARE CORRIDOR)
# ============================================================================

@app.post("/api/routing/plan", response_model=schemas.RouteResponse, tags=["Routing"])
def plan_route(route_req: schemas.RouteRequest, db: Session = Depends(get_db)):
    """
    Computes a hazard-aware rescue transit route between origin and destination coordinates.
    Scans for nearby active incidents along the corridor.
    """
    # Fetch active incidents with GPS coordinates to evaluate corridor hazards
    active = db.query(Incident).filter(
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None),
        Incident.status.in_(["New", "Under Verification", "Verified", "Assigned", "Rescue in Progress"])
    ).all()

    incidents_list = [
        {
            "id": inc.id,
            "tracking_id": inc.tracking_id,
            "incident_type": inc.emergency_type,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "severity": inc.severity
        }
        for inc in active
    ]

    result = plan_hazard_aware_route(
        origin_lat=route_req.origin_lat,
        origin_lng=route_req.origin_lon,
        dest_lat=route_req.dest_lat,
        dest_lng=route_req.dest_lon,
        active_incidents=incidents_list
    )
    return {
        "distance_km": result.get("estimated_driving_distance_km", result.get("crow_distance_km", 0.0)),
        "duration_minutes": result.get("estimated_duration_minutes", 10),
        "waypoints": result.get("waypoints", []),
        "hazards_nearby": result.get("hazards_near_corridor", []),
        "hazard_warning": result.get("advisories", [None])[0] if result.get("advisories") else None,
        "verified_safe": result.get("is_safe_corridor", False),
        "disclaimer": "Rescue transit route recommendation. Road conditions must be verified by field responders."
    }

# ============================================================================
# NOTIFICATIONS & BROADCASTS
# ============================================================================

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse], tags=["Notifications"])
def list_notifications(
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetches broadcast and emergency notifications."""
    return db.query(Notification).order_by(desc(Notification.created_at)).limit(limit).all()

@app.patch("/api/notifications/{notif_id}/read", tags=["Notifications"])
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if n:
        n.read = True
        db.commit()
    return {"success": True}

# ============================================================================
# ANALYTICS & RECHARTS DATA
# ============================================================================

@app.get("/api/analytics", response_model=schemas.AnalyticsOverview, tags=["Analytics"])
def get_analytics(db: Session = Depends(get_db)):
    """
    Aggregates database metrics for live Recharts analytics dashboards.
    """
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(
        Incident.status.in_(["New", "Under Verification", "Verified", "Assigned", "Rescue in Progress"])
    ).count()
    critical_emergencies = db.query(Incident).filter(Incident.severity == "Critical").count()
    resolved_incidents = db.query(Incident).filter(Incident.status.in_(["Resolved", "Closed"])).count()
    sos_distress_count = db.query(SOSRequest).count()
    total_resources = db.query(Resource).count()
    available_resources = db.query(Resource).filter(Resource.availability == "Available").count()
    total_registered_users = db.query(User).count()

    # Category Breakdown
    cat_query = db.query(Incident.emergency_type, func.count(Incident.id)).group_by(Incident.emergency_type).all()
    category_distribution = [{"category": row[0], "count": row[1]} for row in cat_query]

    # Severity Breakdown
    sev_query = db.query(Incident.severity, func.count(Incident.id)).group_by(Incident.severity).all()
    severity_distribution = [{"severity": row[0], "count": row[1]} for row in sev_query]

    # Status Breakdown
    stat_query = db.query(Incident.status, func.count(Incident.id)).group_by(Incident.status).all()
    status_distribution = [{"status": row[0], "count": row[1]} for row in stat_query]

    # 7-day timeline simulation from database or recent entries
    today = datetime.utcnow().date()
    timeline = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%b %d")
        day_count = db.query(Incident).filter(
            func.date(Incident.created_at) == day
        ).count()
        timeline.append({"date": day_str, "incidents": day_count, "resolved": max(0, day_count - 1)})

    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "critical_emergencies": critical_emergencies,
        "resolved_incidents": resolved_incidents,
        "sos_distress_count": sos_distress_count,
        "total_resources": total_resources,
        "available_resources": available_resources,
        "total_registered_users": total_registered_users,
        "category_distribution": category_distribution,
        "severity_distribution": severity_distribution,
        "status_distribution": status_distribution,
        "timeline": timeline,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ============================================================================
# ADMIN AUDIT LOGS & USER MANAGEMENT
# ============================================================================

@app.get("/api/admin/audit-logs", tags=["Admin Control"])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Audit logs tracking all administrative and responder actions."""
    return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()

@app.get("/api/admin/users", tags=["Admin Control"])
def list_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists registered users and verification statuses."""
    return db.query(User).all()

@app.patch("/api/admin/users/{user_id}/verify", tags=["Admin Control"])
def verify_user_account(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Verifies a responder or administrative user account."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found.")
    u.verified = True
    db.commit()
    return {"message": f"User {u.name} ({u.email}) is now verified as {u.role}."}

# ============================================================================
# STATIC FRONTEND SERVING (PRODUCTION BUILD)
# ============================================================================

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
