"""
RESQAI FastAPI Application
AI-Powered Emergency Management & Response System API
Competition: International Grand Challenge 2026, Pune, India
"""
import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database import engine, Base, get_db
from models import Incident, Resource, Shelter, Alert, IncidentNote, ResourceAssignment
import schemas
from risk_engine import calculate_risk
from dispatch_engine import rank_resources_for_incident
from routing_engine import plan_hazard_aware_route
from services.weather_service import get_weather_data
from services.alert_service import create_alert, get_alerts, mark_alert_read, mark_all_alerts_read
from services.places_service import get_emergency_facilities
from services.location_service import reverse_geocode
from seed_data import seed_database

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RESQAI API",
    description="Emergency Management, Situational Risk Assessment, and Dispatch Coordination Backend",
    version="1.0.0"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Ensure database has initial demonstration data if empty."""
    db = next(get_db())
    try:
        if db.query(Incident).count() == 0:
            print("[INFO] Database empty on startup. Executing initial seeding...")
            seed_database()
    except Exception as e:
        print(f"[WARN] Startup seeding check failed: {e}")
    finally:
        db.close()


# ============================================================================
# GENERAL & HEALTH
# ============================================================================

@app.get("/api/health", tags=["General"])
def health_check(db: Session = Depends(get_db)):
    """System health check and operational status."""
    try:
        incident_count = db.query(Incident).count()
        return {
            "status": "healthy",
            "service": "RESQAI Emergency Response API",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "database_connected": True,
            "total_incidents_recorded": incident_count,
            "timestamp": datetime.utcnow().isoformat(),
            "demo_notice": "Academic prototype for International Grand Challenge 2026, Pune."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )


@app.get("/api/stats", tags=["General"])
def get_system_stats(db: Session = Depends(get_db)):
    """Key metric overview for operations dashboards."""
    total_incidents = db.query(Incident).count()
    critical_incidents = db.query(Incident).filter(Incident.severity == "Critical", Incident.status != "Resolved", Incident.status != "Closed").count()
    high_incidents = db.query(Incident).filter(Incident.severity == "High", Incident.status != "Resolved", Incident.status != "Closed").count()
    active_incidents = db.query(Incident).filter(Incident.status.notin_(["Resolved", "Closed"])).count()
    resolved_incidents = db.query(Incident).filter(Incident.status.in_(["Resolved", "Closed"])).count()
    
    total_resources = db.query(Resource).count()
    available_resources = db.query(Resource).filter(Resource.status == "Available").count()
    assigned_resources = db.query(Resource).filter(Resource.status == "Assigned").count()
    available_ambulances = db.query(Resource).filter(Resource.resource_type == "Ambulance", Resource.status == "Available").count()

    total_shelters = db.query(Shelter).count()
    open_shelters = db.query(Shelter).filter(Shelter.status.in_(["Operational", "Near Capacity"])).count()
    
    people_affected_sum = db.query(func.sum(Incident.people_affected)).scalar() or 0
    people_needing_assist_sum = db.query(func.sum(Incident.people_needing_assistance)).scalar() or 0

    unread_alerts = db.query(Alert).filter(Alert.is_read == False).count()

    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,
        "critical_incidents": critical_incidents,
        "high_incidents": high_incidents,
        "resolved_incidents": resolved_incidents,
        "total_resources": total_resources,
        "available_resources": available_resources,
        "assigned_resources": assigned_resources,
        "available_ambulances": available_ambulances,
        "total_shelters": total_shelters,
        "open_shelters": open_shelters,
        "people_at_risk": int(people_affected_sum),
        "people_needing_assistance": int(people_needing_assist_sum),
        "unread_alerts": unread_alerts,
        "is_demo_mode": True
    }


# ============================================================================
# INCIDENT REPORTING & MANAGEMENT
# ============================================================================

@app.get("/api/incidents", tags=["Incidents"])
def list_incidents(
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    incident_type: Optional[str] = Query(None, description="Filter by incident type"),
    search: Optional[str] = Query(None, description="Search term in title, code or location"),
    sort_by: str = Query("created_at", description="Sort field: created_at, risk_score, severity"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db)
):
    """Lists incidents with comprehensive filtering, sorting, and search."""
    query = db.query(Incident)

    if status and status != "All":
        query = query.filter(Incident.status == status)

    if severity and severity != "All":
        query = query.filter(Incident.severity == severity)

    if incident_type and incident_type != "All":
        query = query.filter(Incident.incident_type == incident_type)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Incident.title.ilike(term),
                Incident.incident_code.ilike(term),
                Incident.location_name.ilike(term),
                Incident.description.ilike(term)
            )
        )

    # Sorting
    sort_col = getattr(Incident, sort_by, Incident.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    incidents = query.all()
    return [inc.to_dict() for inc in incidents]


@app.post("/api/incidents", status_code=status.HTTP_201_CREATED, tags=["Incidents"])
def create_incident(data: schemas.IncidentCreate, db: Session = Depends(get_db)):
    """
    Submits a new incident report, runs transparent explainable risk assessment,
    persists in SQLite, and triggers operational in-app alert.
    """
    # 1. Reverse-geocode location name if coordinates provided and name is generic
    resolved_loc_name = data.location_name
    if data.latitude is not None and data.longitude is not None and len(data.location_name.strip()) <= 3:
        resolved_loc_name = reverse_geocode(data.latitude, data.longitude)

    # 2. Run Risk Assessment Engine
    has_coords = (data.latitude is not None and data.longitude is not None)
    risk_assessment = calculate_risk(
        incident_type=data.incident_type,
        severity=data.severity,
        people_affected=data.people_affected,
        people_needing_assistance=data.people_needing_assistance,
        has_coordinates=has_coords,
        vulnerable_present=(data.people_needing_assistance > 0),
        environmental_hazard_alert=(data.severity in ["High", "Critical"])
    )

    # 3. Generate Incident Code
    last_inc = db.query(Incident).order_by(Incident.id.desc()).first()
    next_num = (last_inc.id + 1001) if last_inc else 1001
    code = f"INC-{next_num}"

    # 4. Create Incident Record
    new_inc = Incident(
        incident_code=code,
        title=data.title,
        incident_type=data.incident_type,
        description=data.description,
        severity=data.severity,
        people_affected=data.people_affected,
        people_needing_assistance=data.people_needing_assistance,
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=resolved_loc_name,
        reporter_name=data.reporter_name,
        reporter_contact=data.reporter_contact,
        status="Reported",
        risk_score=risk_assessment["risk_score"],
        risk_level=risk_assessment["risk_level"],
        response_priority=risk_assessment["priority"],
        risk_factors=json.dumps(risk_assessment["factors"]),
        risk_limitations=json.dumps(risk_assessment["limitations"]),
        is_demo=data.is_demo if data.is_demo is not None else False,
        created_at=datetime.utcnow()
    )

    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    # 5. Create In-App Alert
    alert_sev = "Critical" if risk_assessment["risk_level"] == "Critical" else ("High" if risk_assessment["risk_level"] == "High" else "Medium")
    create_alert(
        db=db,
        message=f"NEW INCIDENT [{code}]: '{new_inc.title}' at {new_inc.location_name} (Risk Score: {new_inc.risk_score}/100, {new_inc.risk_level}).",
        severity=alert_sev,
        alert_type="Incident",
        related_incident_id=new_inc.id
    )

    # Add initial auto note
    init_note = IncidentNote(
        incident_id=new_inc.id,
        author="System Engine",
        note=f"Report registered with initial risk score {new_inc.risk_score} ({new_inc.risk_level}). Priority: {new_inc.response_priority}."
    )
    db.add(init_note)
    db.commit()

    return {
        "message": "Incident reported and assessed successfully.",
        "incident": new_inc.to_dict(),
        "risk_assessment": risk_assessment
    }


@app.get("/api/incidents/{incident_id}", tags=["Incidents"])
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Retrieves full details of an incident including notes and assignment history."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found.")

    res_data = inc.to_dict()
    res_data["notes"] = [n.to_dict() for n in inc.notes]
    res_data["assignments"] = [a.to_dict() for a in inc.assignments]
    return res_data


@app.patch("/api/incidents/{incident_id}", tags=["Incidents"])
def update_incident(incident_id: int, data: schemas.IncidentUpdate, db: Session = Depends(get_db)):
    """Updates permitted incident fields and recalculates risk if severity/counts change."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found.")

    update_data = data.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(inc, field, val)

    # Recalculate risk if key fields were altered
    if any(k in update_data for k in ["severity", "incident_type", "people_affected", "people_needing_assistance", "latitude", "longitude"]):
        has_coords = (inc.latitude is not None and inc.longitude is not None)
        recalculated = calculate_risk(
            incident_type=inc.incident_type,
            severity=inc.severity,
            people_affected=inc.people_affected,
            people_needing_assistance=inc.people_needing_assistance,
            has_coordinates=has_coords,
            vulnerable_present=(inc.people_needing_assistance > 0),
            environmental_hazard_alert=(inc.severity in ["High", "Critical"])
        )
        inc.risk_score = recalculated["risk_score"]
        inc.risk_level = recalculated["risk_level"]
        inc.response_priority = recalculated["priority"]
        inc.risk_factors = json.dumps(recalculated["factors"])
        inc.risk_limitations = json.dumps(recalculated["limitations"])

    inc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)
    return {"message": "Incident updated successfully.", "incident": inc.to_dict()}


@app.patch("/api/incidents/{incident_id}/status", tags=["Incidents"])
def update_incident_status(incident_id: int, data: schemas.IncidentStatusUpdate, db: Session = Depends(get_db)):
    """Updates operational incident status with audit logging and alerts."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found.")

    old_status = inc.status
    inc.status = data.status
    inc.updated_at = datetime.utcnow()

    if data.status in ["Resolved", "Closed"] and not inc.resolved_at:
        inc.resolved_at = datetime.utcnow()

        # If an assigned resource is still linked, release it
        if inc.assigned_resource:
            inc.assigned_resource.status = "Available"
            inc.assigned_resource.current_incident_id = None
            for assign in inc.assignments:
                if assign.status == "Active":
                    assign.status = "Completed"
                    assign.released_at = datetime.utcnow()

    # Log note
    log_text = f"Status changed from '{old_status}' to '{data.status}'."
    if data.note:
        log_text += f" Remarks: {data.note}"

    note = IncidentNote(
        incident_id=inc.id,
        author="Control Officer",
        note=log_text
    )
    db.add(note)

    # In-app alert
    create_alert(
        db=db,
        message=f"INCIDENT STATUS [{inc.incident_code}]: Updated to '{data.status}'.",
        severity="Medium",
        alert_type="Incident",
        related_incident_id=inc.id
    )

    db.commit()
    db.refresh(inc)
    return {"message": "Status updated successfully.", "incident": inc.to_dict()}


@app.post("/api/incidents/{incident_id}/notes", tags=["Incidents"])
def add_incident_note(incident_id: int, data: schemas.IncidentNoteCreate, db: Session = Depends(get_db)):
    """Adds an operational log note to the incident timeline."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found.")

    note = IncidentNote(
        incident_id=incident_id,
        author=data.author or "Operations Staff",
        note=data.note,
        created_at=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"message": "Note added successfully.", "note": note.to_dict()}


@app.delete("/api/incidents/{incident_id}", tags=["Incidents"])
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    """Deletes an incident record (permitted for demo and test incident management)."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found.")

    # Free up linked resource if assigned
    if inc.assigned_resource:
        inc.assigned_resource.status = "Available"
        inc.assigned_resource.current_incident_id = None

    db.delete(inc)
    db.commit()
    return {"message": f"Incident {incident_id} removed successfully."}


# ============================================================================
# RISK ASSESSMENT (STANDALONE)
# ============================================================================

@app.post("/api/risk/assess", response_model=schemas.RiskAssessResponse, tags=["Risk Engine"])
def assess_risk_hypothetical(data: schemas.RiskAssessRequest):
    """
    Evaluates risk score and explanation for hypothetical disaster parameters
    without modifying database state.
    """
    result = calculate_risk(
        incident_type=data.incident_type,
        severity=data.severity,
        people_affected=data.people_affected,
        people_needing_assistance=data.people_needing_assistance,
        has_coordinates=data.has_coordinates,
        vulnerable_present=data.vulnerable_present,
        environmental_hazard_alert=data.environmental_hazard_alert
    )
    return result


# ============================================================================
# RESOURCE MANAGEMENT & DISPATCH
# ============================================================================

@app.get("/api/resources", tags=["Resources"])
def list_resources(
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    status: Optional[str] = Query(None, description="Filter by status (Available, Assigned, etc.)"),
    db: Session = Depends(get_db)
):
    """Lists rescue resources with optional status and type filters."""
    query = db.query(Resource)
    if resource_type and resource_type != "All":
        query = query.filter(Resource.resource_type == resource_type)
    if status and status != "All":
        query = query.filter(Resource.status == status)

    resources = query.order_by(Resource.name.asc()).all()
    return [r.to_dict() for r in resources]


@app.post("/api/resources", status_code=status.HTTP_201_CREATED, tags=["Resources"])
def create_resource(data: schemas.ResourceCreate, db: Session = Depends(get_db)):
    """Registers a new emergency rescue team, boat, or vehicle."""
    last_res = db.query(Resource).order_by(Resource.id.desc()).first()
    code = f"RES-{(last_res.id + 1):02d}" if last_res else "RES-01"

    new_res = Resource(
        resource_code=code,
        name=data.name,
        resource_type=data.resource_type,
        capabilities=json.dumps(data.capabilities or []),
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        capacity=data.capacity,
        status=data.status or "Available",
        contact_info=data.contact_info,
        is_demo=data.is_demo if data.is_demo is not None else False
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    return {"message": "Resource registered successfully.", "resource": new_res.to_dict()}


@app.get("/api/resources/{resource_id}", tags=["Resources"])
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """Retrieves specific resource details."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found.")
    return res.to_dict()


@app.patch("/api/resources/{resource_id}", tags=["Resources"])
def update_resource(resource_id: int, data: schemas.ResourceUpdate, db: Session = Depends(get_db)):
    """Updates resource capabilities, status, or staging location."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found.")

    update_data = data.dict(exclude_unset=True)
    if "capabilities" in update_data and update_data["capabilities"] is not None:
        update_data["capabilities"] = json.dumps(update_data["capabilities"])

    for field, val in update_data.items():
        setattr(res, field, val)

    res.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(res)
    return {"message": "Resource updated successfully.", "resource": res.to_dict()}


@app.post("/api/resources/{resource_id}/release", tags=["Resources"])
def release_resource(resource_id: int, db: Session = Depends(get_db)):
    """Releases an assigned resource back to Available status."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {resource_id} not found.")

    old_incident_id = res.current_incident_id

    # Update active assignment record
    active_assignment = db.query(ResourceAssignment).filter(
        ResourceAssignment.resource_id == res.id,
        ResourceAssignment.status == "Active"
    ).first()
    if active_assignment:
        active_assignment.status = "Completed"
        active_assignment.released_at = datetime.utcnow()

    # Update linked incident if still assigned to this resource
    if old_incident_id:
        linked_inc = db.query(Incident).filter(Incident.id == old_incident_id).first()
        if linked_inc and linked_inc.assigned_resource_id == res.id:
            linked_inc.assigned_resource_id = None
            note = IncidentNote(
                incident_id=linked_inc.id,
                author="Control Officer",
                note=f"Resource '{res.name}' ({res.resource_code}) released and returned to staging."
            )
            db.add(note)

    res.status = "Available"
    res.current_incident_id = None
    res.updated_at = datetime.utcnow()

    create_alert(
        db=db,
        message=f"RESOURCE RELEASED: '{res.name}' ({res.resource_code}) is now Available.",
        severity="Low",
        alert_type="Dispatch",
        related_incident_id=old_incident_id
    )

    db.commit()
    db.refresh(res)
    return {"message": f"Resource {res.name} released.", "resource": res.to_dict()}


@app.post("/api/incidents/{incident_id}/recommend-resources", tags=["Dispatch Engine"])
def get_resource_recommendations(incident_id: int, db: Session = Depends(get_db)):
    """
    Ranks rescue assets based on hazard affinity, capacity, spatial proximity, and availability.
    Does NOT automatically dispatch.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    all_resources = [r.to_dict() for r in db.query(Resource).all()]
    ranked = rank_resources_for_incident(inc.to_dict(), all_resources)

    return {
        "incident_id": inc.id,
        "incident_code": inc.incident_code,
        "incident_title": inc.title,
        "incident_type": inc.incident_type,
        "severity": inc.severity,
        "recommendations": ranked,
        "disclaimer": "AI recommendations are for decision support only. Human commander authorization required to dispatch."
    }


@app.post("/api/incidents/{incident_id}/assign-resource", tags=["Dispatch Engine"])
def assign_resource_to_incident(incident_id: int, data: schemas.ResourceAssignRequest, db: Session = Depends(get_db)):
    """
    Assigns an available resource to an incident with validation and audit logging.
    Requires explicit user authorization.
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    res = db.query(Resource).filter(Resource.id == data.resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail=f"Resource {data.resource_id} not found.")

    # Validation: never assign an already assigned/busy resource
    if res.status != "Available" and res.current_incident_id != inc.id:
        raise HTTPException(
            status_code=400,
            detail=f"Resource '{res.name}' is currently '{res.status}'. Only Available resources can be dispatched."
        )

    # Free previous resource if one was assigned
    if inc.assigned_resource_id and inc.assigned_resource_id != res.id:
        prev_res = db.query(Resource).filter(Resource.id == inc.assigned_resource_id).first()
        if prev_res:
            prev_res.status = "Available"
            prev_res.current_incident_id = None

    # Update Resource
    res.status = "Assigned"
    res.current_incident_id = inc.id
    res.updated_at = datetime.utcnow()

    # Update Incident
    inc.assigned_resource_id = res.id
    if inc.status in ["Reported", "Verified"]:
        inc.status = "Assigned"
    inc.updated_at = datetime.utcnow()

    # Create Assignment Record
    assignment = ResourceAssignment(
        incident_id=inc.id,
        resource_id=res.id,
        status="Active",
        notes=data.notes or f"Dispatched for {inc.title}"
    )
    db.add(assignment)

    # Timeline note
    note = IncidentNote(
        incident_id=inc.id,
        author="Control Officer",
        note=f"Assigned resource '{res.name}' ({res.resource_type}). {data.notes or ''}".strip()
    )
    db.add(note)

    # Alert
    create_alert(
        db=db,
        message=f"RESOURCE DISPATCHED: '{res.name}' assigned to {inc.incident_code} ({inc.title}).",
        severity="Medium",
        alert_type="Dispatch",
        related_incident_id=inc.id
    )

    db.commit()
    db.refresh(inc)
    db.refresh(res)

    return {
        "message": f"Resource '{res.name}' assigned to {inc.incident_code}.",
        "incident": inc.to_dict(),
        "resource": res.to_dict()
    }


# ============================================================================
# SHELTERS & VULNERABLE POPULATIONS
# ============================================================================

@app.get("/api/shelters", tags=["Shelters"])
def list_shelters(db: Session = Depends(get_db)):
    """Lists all emergency shelters and occupancy stats."""
    shelters = db.query(Shelter).order_by(Shelter.name.asc()).all()
    return [s.to_dict() for s in shelters]


@app.post("/api/shelters", status_code=status.HTTP_201_CREATED, tags=["Shelters"])
def create_shelter(data: schemas.ShelterCreate, db: Session = Depends(get_db)):
    """Registers a new emergency relief shelter."""
    # Validation
    if data.current_occupancy > data.total_capacity:
        raise HTTPException(status_code=400, detail="Initial occupancy cannot exceed total shelter capacity.")

    last_s = db.query(Shelter).order_by(Shelter.id.desc()).first()
    code = f"SHL-{(last_s.id + 101)}" if last_s else "SHL-101"

    new_s = Shelter(
        shelter_code=code,
        name=data.name,
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        total_capacity=data.total_capacity,
        current_occupancy=data.current_occupancy,
        facilities=json.dumps(data.facilities or []),
        accessibility_support=data.accessibility_support,
        medical_support=data.medical_support,
        contact_details=data.contact_details,
        status=data.status or "Operational",
        vulnerable_elderly=data.vulnerable_elderly or 0,
        vulnerable_mobility=data.vulnerable_mobility or 0,
        vulnerable_children=data.vulnerable_children or 0,
        vulnerable_medical=data.vulnerable_medical or 0,
        is_demo=data.is_demo if data.is_demo is not None else False
    )
    db.add(new_s)
    db.commit()
    db.refresh(new_s)
    return {"message": "Shelter created successfully.", "shelter": new_s.to_dict()}


@app.get("/api/shelters/{shelter_id}", tags=["Shelters"])
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    """Retrieves specific shelter metrics."""
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Shelter {shelter_id} not found.")
    return s.to_dict()


@app.patch("/api/shelters/{shelter_id}", tags=["Shelters"])
def update_shelter(shelter_id: int, data: schemas.ShelterUpdate, db: Session = Depends(get_db)):
    """Updates shelter capacity, occupancy, and vulnerable demographics."""
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Shelter {shelter_id} not found.")

    update_data = data.dict(exclude_unset=True)

    # Validate occupancy bounds
    target_capacity = update_data.get("total_capacity", s.total_capacity)
    target_occupancy = update_data.get("current_occupancy", s.current_occupancy)

    if target_occupancy < 0:
        raise HTTPException(status_code=400, detail="Shelter occupancy cannot be negative.")
    if target_occupancy > target_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Occupancy ({target_occupancy}) cannot exceed maximum capacity ({target_capacity})."
        )

    # Automatic status adjustment based on occupancy percentage
    occ_rate = (target_occupancy / target_capacity) if target_capacity > 0 else 0
    if occ_rate >= 1.0:
        s.status = "Full"
    elif occ_rate >= 0.85:
        s.status = "Near Capacity"
    elif s.status in ["Full", "Near Capacity"]:
        s.status = "Operational"

    if "facilities" in update_data and update_data["facilities"] is not None:
        update_data["facilities"] = json.dumps(update_data["facilities"])

    for field, val in update_data.items():
        setattr(s, field, val)

    s.updated_at = datetime.utcnow()

    # Trigger alert if near capacity
    if occ_rate >= 0.90:
        create_alert(
            db=db,
            message=f"SHELTER ALERT: '{s.name}' has reached {round(occ_rate*100)}% capacity ({s.current_occupancy}/{s.total_capacity}).",
            severity="High",
            alert_type="Shelter"
        )

    db.commit()
    db.refresh(s)
    return {"message": "Shelter updated successfully.", "shelter": s.to_dict()}


# ============================================================================
# MAP FEEDS & SPATIAL GEOMETRY
# ============================================================================

@app.get("/api/map/incidents", tags=["Map"])
def get_map_incidents(db: Session = Depends(get_db)):
    """Fetches incidents containing valid coordinates for Leaflet map display."""
    incidents = db.query(Incident).filter(Incident.latitude.isnot(None), Incident.longitude.isnot(None)).all()
    features = []
    for inc in incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc.longitude, inc.latitude]
            },
            "properties": inc.to_dict()
        })
    return {
        "type": "FeatureCollection",
        "features": features,
        "total_mapped": len(features)
    }


@app.get("/api/map/resources", tags=["Map"])
def get_map_resources(db: Session = Depends(get_db)):
    """Fetches rescue resources with spatial staging locations."""
    resources = db.query(Resource).filter(Resource.latitude.isnot(None), Resource.longitude.isnot(None)).all()
    features = []
    for res in resources:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [res.longitude, res.latitude]
            },
            "properties": res.to_dict()
        })
    return {
        "type": "FeatureCollection",
        "features": features,
        "total_mapped": len(features)
    }


@app.get("/api/map/shelters", tags=["Map"])
def get_map_shelters(db: Session = Depends(get_db)):
    """Fetches emergency shelters with coordinates."""
    shelters = db.query(Shelter).filter(Shelter.latitude.isnot(None), Shelter.longitude.isnot(None)).all()
    features = []
    for s in shelters:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s.longitude, s.latitude]
            },
            "properties": s.to_dict()
        })
    return {
        "type": "FeatureCollection",
        "features": features,
        "total_mapped": len(features)
    }


# ============================================================================
# ROUTING & HAZARD CORRIDORS
# ============================================================================

@app.post("/api/routes/recommend", tags=["Routing Engine"])
def recommend_safe_route(data: schemas.RouteRequest, db: Session = Depends(get_db)):
    """
    Computes a hazard-aware transit corridor between dispatch origin and incident destination,
    evaluating proximity to active disaster zones.
    """
    active_incidents = [
        inc.to_dict() for inc in db.query(Incident).filter(
            Incident.status.notin_(["Resolved", "Closed"]),
            Incident.latitude.isnot(None),
            Incident.longitude.isnot(None)
        ).all()
    ]

    result = plan_hazard_aware_route(
        origin_lat=data.origin_lat,
        origin_lng=data.origin_lng,
        dest_lat=data.dest_lat,
        dest_lng=data.dest_lng,
        active_incidents=active_incidents
    )
    return result


# ============================================================================
# WEATHER & ENVIRONMENTAL FEEDS
# ============================================================================

@app.get("/api/weather", tags=["Weather"])
def get_environmental_weather(
    lat: Optional[float] = Query(None, description="Target Latitude"),
    lon: Optional[float] = Query(None, description="Target Longitude")
):
    """Retrieves live or simulated meteorological intelligence for disaster monitoring."""
    return get_weather_data(lat=lat, lon=lon)


@app.get("/api/facilities", tags=["Facilities"])
def get_critical_facilities_list():
    """Returns directory of designated disaster trauma and fire facilities."""
    return get_emergency_facilities()


# ============================================================================
# ALERTS & NOTIFICATIONS
# ============================================================================

@app.get("/api/alerts", tags=["Alerts"])
def list_alerts(
    unread_only: bool = Query(False, description="Filter only unread alerts"),
    limit: int = Query(50, description="Max alerts to retrieve"),
    db: Session = Depends(get_db)
):
    """Retrieves in-app operational broadcast alerts."""
    alerts = get_alerts(db=db, limit=limit, unread_only=unread_only)
    return [a.to_dict() for a in alerts]


@app.patch("/api/alerts/{alert_id}/read", tags=["Alerts"])
def mark_single_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Marks an alert as read."""
    alert = mark_alert_read(db=db, alert_id=alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"message": "Alert marked as read.", "alert": alert.to_dict()}


@app.post("/api/alerts/mark-all-read", tags=["Alerts"])
def mark_all_alerts_read_endpoint(db: Session = Depends(get_db)):
    """Marks all operational alerts as read."""
    count = mark_all_alerts_read(db=db)
    return {"message": f"{count} alerts marked as read."}


# ============================================================================
# ANALYTICS & SITUATION REPORTS
# ============================================================================

@app.get("/api/analytics/summary", tags=["Analytics"])
def get_analytics_summary(db: Session = Depends(get_db)):
    """Aggregated situation analytics calculated directly from persistent database."""
    # 1. Incidents by Type
    type_counts = db.query(Incident.incident_type, func.count(Incident.id)).group_by(Incident.incident_type).all()
    incidents_by_type = {t: c for t, c in type_counts}

    # 2. Incidents by Severity
    sev_counts = db.query(Incident.severity, func.count(Incident.id)).group_by(Incident.severity).all()
    incidents_by_severity = {s: c for s, c in sev_counts}

    # 3. Incidents by Status
    status_counts = db.query(Incident.status, func.count(Incident.id)).group_by(Incident.status).all()
    incidents_by_status = {st: c for st, c in status_counts}

    # 4. Resource Utilization
    res_status_counts = db.query(Resource.status, func.count(Resource.id)).group_by(Resource.status).all()
    resource_utilization = {rs: c for rs, c in res_status_counts}

    # 5. Shelter Occupancy Aggregates
    total_shelter_cap = db.query(func.sum(Shelter.total_capacity)).scalar() or 0
    total_shelter_occ = db.query(func.sum(Shelter.current_occupancy)).scalar() or 0
    vulnerable_total = {
        "elderly": int(db.query(func.sum(Shelter.vulnerable_elderly)).scalar() or 0),
        "mobility_impaired": int(db.query(func.sum(Shelter.vulnerable_mobility)).scalar() or 0),
        "children": int(db.query(func.sum(Shelter.vulnerable_children)).scalar() or 0),
        "urgent_medical": int(db.query(func.sum(Shelter.vulnerable_medical)).scalar() or 0)
    }

    # 6. People summary
    total_affected = int(db.query(func.sum(Incident.people_affected)).scalar() or 0)
    total_assisted = int(db.query(func.sum(Incident.people_needing_assistance)).scalar() or 0)

    # 7. Average Risk Score
    avg_risk = db.query(func.avg(Incident.risk_score)).scalar() or 0

    return {
        "incidents_by_type": incidents_by_type,
        "incidents_by_severity": incidents_by_severity,
        "incidents_by_status": incidents_by_status,
        "resource_utilization": resource_utilization,
        "shelter_stats": {
            "total_capacity": int(total_shelter_cap),
            "current_occupancy": int(total_shelter_occ),
            "available_capacity": max(0, int(total_shelter_cap) - int(total_shelter_occ)),
            "overall_occupancy_rate": round((total_shelter_occ / total_shelter_cap * 100), 1) if total_shelter_cap > 0 else 0
        },
        "vulnerable_populations": vulnerable_total,
        "total_people_affected": total_affected,
        "total_people_needing_assistance": total_assisted,
        "average_risk_score": round(float(avg_risk), 1),
        "generated_at": datetime.utcnow().isoformat(),
        "is_demo_data": True
    }


# ============================================================================
# PRODUCTION STATIC FRONTEND SERVING (SINGLE-URL DEPLOYMENTS)
# ============================================================================
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    assets_dir = os.path.join(FRONTEND_DIR, "assets")

    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", tags=["Frontend"])
    def serve_homepage():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{page_name}.html", tags=["Frontend"])
    def serve_frontend_page(page_name: str):
        page_path = os.path.join(FRONTEND_DIR, f"{page_name}.html")
        if os.path.exists(page_path):
            return FileResponse(page_path)
        raise HTTPException(status_code=404, detail="Page not found.")

