from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen")  # citizen, responder, admin
    phone = Column(String(50), nullable=True)
    agency = Column(String(150), nullable=True)
    verified = Column(Boolean, default=False)  # Responders/Admins must be verified
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incidents = relationship("Incident", back_populates="reporter_user", foreign_keys="Incident.user_id")
    responder_profile = relationship("Responder", back_populates="user", uselist=False)

# Profile alias for Supabase schema compatibility
Profile = User

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(30), unique=True, index=True, nullable=False)  # RQ-2026-XXXX
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Contact & Details
    name = Column(String(120), nullable=False)  # Reporter name
    contact = Column(String(50), nullable=False)  # Phone / Email
    emergency_type = Column(String(80), nullable=False)  # Flood, Fire, Earthquake, Landslide, Cyclone, Accident, Medical Emergency, Other
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Impact metrics
    severity = Column(String(30), default="High")  # Critical, High, Medium, Low
    priority = Column(String(30), default="Standard")  # Urgent, High, Standard, Low
    affected_count = Column(Integer, default=1)
    injured_count = Column(Integer, default=0)
    vulnerable_people = Column(Boolean, default=False)
    image_url = Column(Text, nullable=True)
    
    # Status Pipeline: New -> Under Verification -> Verified -> Assigned -> Rescue in Progress -> Resolved -> Closed
    status = Column(String(50), default="New")
    source = Column(String(50), default="Citizen Report")  # Citizen Report, SOS Distress, Sensor, External
    
    # AI Analysis & Extraction Cache
    ai_classified = Column(Boolean, default=False)
    ai_summary = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_raw_json = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reporter_user = relationship("User", back_populates="incidents", foreign_keys=[user_id])
    history = relationship("IncidentUpdate", back_populates="incident", cascade="all, delete-orphan", order_by="desc(IncidentUpdate.created_at)")
    risk_assessments = relationship("RiskAssessment", back_populates="incident", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="incident", cascade="all, delete-orphan")

# Backward compatibility alias
EmergencyReport = Incident

class IncidentUpdate(Base):
    __tablename__ = "incident_updates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    updated_by = Column(String(120), default="System")
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="history")

# Backward compatibility alias
ReportHistory = IncidentUpdate

class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    tracking_id = Column(String(30), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(120), nullable=False)
    contact = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_text = Column(String(255), nullable=True)
    emergency_type = Column(String(80), default="Immediate SOS Distress")
    details = Column(Text, nullable=True)
    status = Column(String(40), default="Active")  # Active, Dispatched, Resolved, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True, nullable=True)
    title = Column(String(255), nullable=False)
    event_type = Column(String(50), nullable=False)  # earthquake, fire, flood, cyclone, severe_weather
    severity = Column(String(30), default="Medium")  # Critical, High, Medium, Low
    source = Column(String(50), nullable=False)  # USGS, NASA_FIRMS, OPEN_METEO, OFFICIAL_ALERT
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    magnitude = Column(Float, nullable=True)
    depth_km = Column(Float, nullable=True)
    confidence = Column(String(50), nullable=True)
    location_name = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    event_time = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(80), nullable=False)  # Hospital, Ambulance, Fire Station, Shelter, Rescue Team, Relief Center
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact = Column(String(100), nullable=True)
    availability = Column(String(50), default="Available")  # Available, Deployed, Maintenance
    capacity = Column(Integer, default=50)
    current_occupancy = Column(Integer, default=0)
    verified = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="resource")

class Responder(Base):
    __tablename__ = "responders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(120), nullable=False)
    badge_id = Column(String(50), unique=True, index=True, nullable=False)
    specialization = Column(String(100), default="Search and Rescue")
    phone = Column(String(50), nullable=False)
    agency = Column(String(150), default="National Disaster Response Force (NDRF)")
    status = Column(String(50), default="Available")  # Available, On Mission, Off Duty
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    current_incident_id = Column(Integer, nullable=True)

    user = relationship("User", back_populates="responder_profile")
    assignments = relationship("Assignment", back_populates="responder")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("responders.id"), nullable=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Assigned")  # Assigned, En Route, On Scene, Completed
    assigned_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    incident = relationship("Incident", back_populates="assignments")
    responder = relationship("Responder", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null = Broadcast to all
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="alert")  # alert, status_update, assignment, warning, sos
    priority = Column(String(30), default="normal")  # critical, high, normal
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    risk_level = Column(String(30), nullable=False)  # Critical, High, Medium, Low
    score = Column(Float, nullable=False)  # 0 to 100
    hazard_points = Column(Float, default=0.0)
    severity_points = Column(Float, default=0.0)
    assistance_points = Column(Float, default=0.0)
    vulnerable_points = Column(Float, default=0.0)
    environmental_points = Column(Float, default=0.0)
    explanation = Column(Text, nullable=False)
    contributing_factors = Column(Text, nullable=True)  # JSON formatted string
    recommendations = Column(Text, nullable=True)  # JSON formatted string
    limitations = Column(Text, nullable=True)  # JSON formatted string
    ai_generated = Column(Boolean, default=False)
    assessed_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="risk_assessments")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(120), nullable=True)
    action = Column(String(100), nullable=False)  # e.g., STATUS_CHANGE, DISPATCH_RESOURCE, INCIDENT_VERIFIED
    target_type = Column(String(50), nullable=False)  # INCIDENT, RESOURCE, USER, SOS
    target_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
