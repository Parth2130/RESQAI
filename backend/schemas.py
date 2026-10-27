"""
RESQAI Pydantic Schemas for Request & Response Validation
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# --- INCIDENT SCHEMAS ---
class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    incident_type: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)
    severity: str = Field(default="Medium")
    people_affected: int = Field(default=0, ge=0)
    people_needing_assistance: int = Field(default=0, ge=0)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    location_name: str = Field(..., min_length=2, max_length=255)
    reporter_name: Optional[str] = Field(default=None, max_length=150)
    reporter_contact: Optional[str] = Field(default=None, max_length=100)
    is_demo: Optional[bool] = Field(default=False)

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v):
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Latitude must be between -90 and 90 degrees.")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v):
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Longitude must be between -180 and 180 degrees.")
        return v


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    incident_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    people_affected: Optional[int] = Field(default=None, ge=0)
    people_needing_assistance: Optional[int] = Field(default=None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    status: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., min_length=3)
    note: Optional[str] = None


class IncidentNoteCreate(BaseModel):
    note: str = Field(..., min_length=2)
    author: Optional[str] = Field(default="Operations Officer")


# --- RISK SCHEMAS ---
class RiskAssessRequest(BaseModel):
    incident_type: str
    severity: str
    people_affected: int = 0
    people_needing_assistance: int = 0
    has_coordinates: bool = True
    vulnerable_present: bool = False
    environmental_hazard_alert: bool = False


class RiskAssessResponse(BaseModel):
    risk_score: int
    risk_level: str
    priority: str
    factors: List[str]
    limitations: List[str]
    weights_breakdown: Dict[str, Any]


# --- RESOURCE SCHEMAS ---
class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    resource_type: str = Field(..., min_length=2, max_length=100)
    capabilities: Optional[List[str]] = Field(default_factory=list)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: int = Field(default=1, ge=1)
    status: Optional[str] = Field(default="Available")
    contact_info: Optional[str] = None
    is_demo: Optional[bool] = Field(default=False)


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    resource_type: Optional[str] = None
    capabilities: Optional[List[str]] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = None
    contact_info: Optional[str] = None


class ResourceAssignRequest(BaseModel):
    resource_id: int
    notes: Optional[str] = None


# --- SHELTER SCHEMAS ---
class ShelterCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    location_name: str = Field(..., min_length=2, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_capacity: int = Field(..., ge=1)
    current_occupancy: int = Field(default=0, ge=0)
    facilities: Optional[List[str]] = Field(default_factory=list)
    accessibility_support: bool = Field(default=True)
    medical_support: bool = Field(default=False)
    contact_details: Optional[str] = None
    status: Optional[str] = Field(default="Operational")
    vulnerable_elderly: Optional[int] = Field(default=0, ge=0)
    vulnerable_mobility: Optional[int] = Field(default=0, ge=0)
    vulnerable_children: Optional[int] = Field(default=0, ge=0)
    vulnerable_medical: Optional[int] = Field(default=0, ge=0)
    is_demo: Optional[bool] = Field(default=False)


class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_capacity: Optional[int] = Field(default=None, ge=1)
    current_occupancy: Optional[int] = Field(default=None, ge=0)
    facilities: Optional[List[str]] = None
    accessibility_support: Optional[bool] = None
    medical_support: Optional[bool] = None
    contact_details: Optional[str] = None
    status: Optional[str] = None
    vulnerable_elderly: Optional[int] = None
    vulnerable_mobility: Optional[int] = None
    vulnerable_children: Optional[int] = None
    vulnerable_medical: Optional[int] = None


# --- ROUTE RECOMMENDATION SCHEMAS ---
class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    resource_type: Optional[str] = "Standard Rescue"
    avoid_critical_hazards: Optional[bool] = True


# --- ALERT SCHEMAS ---
class AlertCreate(BaseModel):
    alert_type: str = "Incident"
    message: str
    severity: str = "Medium"
    related_incident_id: Optional[int] = None
