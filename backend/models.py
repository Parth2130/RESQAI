"""
RESQAI SQLAlchemy Data Models
"""
from datetime import datetime
import json
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_code = Column(String(50), unique=True, index=True)
    title = Column(String(200), nullable=False)
    incident_type = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="Medium")
    people_affected = Column(Integer, default=0)
    people_needing_assistance = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String(255), nullable=False)
    reporter_name = Column(String(150), nullable=True)
    reporter_contact = Column(String(100), nullable=True)
    status = Column(String(50), default="Reported", index=True)
    
    # Risk Assessment Fields
    risk_score = Column(Integer, default=50)
    risk_level = Column(String(50), default="Medium")
    response_priority = Column(String(100), default="Standard")
    risk_factors = Column(Text, default="[]")  # JSON string
    risk_limitations = Column(Text, default="[]")  # JSON string

    # Assigned Resource
    assigned_resource_id = Column(Integer, ForeignKey("resources.id", ondelete="SET NULL"), nullable=True)

    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    assigned_resource = relationship("Resource", foreign_keys=[assigned_resource_id], back_populates="assigned_incidents")
    notes = relationship("IncidentNote", back_populates="incident", cascade="all, delete-orphan", order_by="desc(IncidentNote.created_at)")
    assignments = relationship("ResourceAssignment", back_populates="incident", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "incident_code": self.incident_code or f"INC-{self.id:04d}",
            "title": self.title,
            "incident_type": self.incident_type,
            "description": self.description,
            "severity": self.severity,
            "people_affected": self.people_affected,
            "people_needing_assistance": self.people_needing_assistance,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location_name": self.location_name,
            "reporter_name": self.reporter_name,
            "reporter_contact": self.reporter_contact,
            "status": self.status,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "response_priority": self.response_priority,
            "risk_factors": json.loads(self.risk_factors) if self.risk_factors else [],
            "risk_limitations": json.loads(self.risk_limitations) if self.risk_limitations else [],
            "assigned_resource_id": self.assigned_resource_id,
            "assigned_resource_name": self.assigned_resource.name if self.assigned_resource else None,
            "assigned_resource_type": self.assigned_resource.resource_type if self.assigned_resource else None,
            "is_demo": self.is_demo,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "notes_count": len(self.notes) if self.notes else 0
        }


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)
    resource_type = Column(String(100), nullable=False, index=True)
    capabilities = Column(Text, default="[]")  # JSON string
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="Available", index=True)  # Available, Assigned, En route, Busy, Unavailable
    capacity = Column(Integer, default=1)
    current_incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    contact_info = Column(String(150), nullable=True)
    is_demo = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assigned_incidents = relationship("Incident", foreign_keys="Incident.assigned_resource_id", back_populates="assigned_resource")
    assignments = relationship("ResourceAssignment", back_populates="resource")

    def to_dict(self):
        return {
            "id": self.id,
            "resource_code": self.resource_code or f"RES-{self.id:04d}",
            "name": self.name,
            "resource_type": self.resource_type,
            "capabilities": json.loads(self.capabilities) if self.capabilities else [],
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "capacity": self.capacity,
            "current_incident_id": self.current_incident_id,
            "contact_info": self.contact_info,
            "is_demo": self.is_demo,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    shelter_code = Column(String(50), unique=True, index=True)
    name = Column(String(200), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    total_capacity = Column(Integer, nullable=False, default=100)
    current_occupancy = Column(Integer, nullable=False, default=0)
    facilities = Column(Text, default="[]")  # JSON string list
    accessibility_support = Column(Boolean, default=True)
    medical_support = Column(Boolean, default=False)
    contact_details = Column(String(150), nullable=True)
    status = Column(String(50), default="Operational")  # Operational, Near Capacity, Full, Inactive
    
    # Aggregated Vulnerable Population counts
    vulnerable_elderly = Column(Integer, default=0)
    vulnerable_mobility = Column(Integer, default=0)
    vulnerable_children = Column(Integer, default=0)
    vulnerable_medical = Column(Integer, default=0)

    is_demo = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        available_cap = max(0, self.total_capacity - self.current_occupancy)
        occupancy_rate = round((self.current_occupancy / self.total_capacity) * 100, 1) if self.total_capacity > 0 else 0
        return {
            "id": self.id,
            "shelter_code": self.shelter_code or f"SHL-{self.id:04d}",
            "name": self.name,
            "location_name": self.location_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "total_capacity": self.total_capacity,
            "current_occupancy": self.current_occupancy,
            "available_capacity": available_cap,
            "occupancy_rate": occupancy_rate,
            "facilities": json.loads(self.facilities) if self.facilities else [],
            "accessibility_support": self.accessibility_support,
            "medical_support": self.medical_support,
            "contact_details": self.contact_details,
            "status": self.status,
            "vulnerable_elderly": self.vulnerable_elderly,
            "vulnerable_mobility": self.vulnerable_mobility,
            "vulnerable_children": self.vulnerable_children,
            "vulnerable_medical": self.vulnerable_medical,
            "is_demo": self.is_demo,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), default="Incident")  # Incident, Dispatch, Shelter, Weather, System
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    is_read = Column(Boolean, default=False)
    related_incident_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "alert_type": self.alert_type,
            "message": self.message,
            "severity": self.severity,
            "is_read": self.is_read,
            "related_incident_id": self.related_incident_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    author = Column(String(100), default="Operations Staff")
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="notes")

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "author": self.author,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ResourceAssignment(Base):
    __tablename__ = "resource_assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="Active")  # Active, Completed, Cancelled
    notes = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "resource_id": self.resource_id,
            "resource_name": self.resource.name if self.resource else None,
            "resource_type": self.resource.resource_type if self.resource else None,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "released_at": self.released_at.isoformat() if self.released_at else None,
            "status": self.status,
            "notes": self.notes
        }
