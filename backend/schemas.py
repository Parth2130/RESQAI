from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- CITIZEN EMERGENCY REPORT SCHEMAS -----------------

class ReportCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Full name of reporting citizen")
    contact: str = Field(..., min_length=7, max_length=50, description="Phone number or contact info")
    emergency_type: str = Field(..., description="Flood, Earthquake, Cyclone, Fire, Landslide, Medical, Other")
    description: str = Field(..., min_length=5, description="Details of emergency and required assistance")
    location: str = Field(..., min_length=2, max_length=255, description="Location name, landmark or city")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    severity: str = Field("High", description="Critical, High, Medium, Low")
    affected_count: int = Field(1, ge=1, description="Number of people affected or stranded")
    image_url: Optional[str] = Field(None, description="Optional photo URL or base64")

class ReportHistoryItem(BaseModel):
    id: int
    previous_status: Optional[str]
    new_status: str
    notes: Optional[str]
    updated_by: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True

# Public schema (NEVER exposes name or contact to public endpoints)
class ReportPublic(BaseModel):
    id: int
    tracking_id: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    severity: str
    status: str
    affected_count: int
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Tracking schema for citizen looking up their own report by tracking_id
class ReportTrackingResponse(BaseModel):
    tracking_id: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    severity: str
    status: str
    affected_count: int
    created_at: datetime
    updated_at: datetime
    history: List[ReportHistoryItem] = []
    disclaimer: str = "RESQAI is an informational and reporting platform. It is not an official emergency dispatch service. In immediate danger, call India's emergency number 112 directly."

    class Config:
        from_attributes = True

# Admin schema (includes contact details for rescue verification)
class ReportAdmin(BaseModel):
    id: int
    tracking_id: str
    name: str
    contact: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    severity: str
    status: str
    affected_count: int
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    history: List[ReportHistoryItem] = []

    class Config:
        from_attributes = True

class ReportStatusUpdate(BaseModel):
    status: str = Field(..., description="Submitted, Under Review, Acknowledged, Resolved, Closed")
    notes: Optional[str] = Field(None, description="Internal responder notes or public status update")

# ----------------- ADMIN AUTH SCHEMAS -----------------

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUserResponse

class AdminSetupRequest(BaseModel):
    name: str
    email: str
    password: str

# ----------------- AI ASSISTANT SCHEMAS -----------------

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500)
    language: str = Field("en", description="en (English), hi (Hindi), mr (Marathi)")
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    conversation_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    response: str
    language: str
    grounding: Optional[dict] = None
    provider: str
    disclaimer: str = "RESQAI is an informational safety platform. Never substitute AI guidance for official government emergency orders. In immediate danger, call 112."
    timestamp: str

# ----------------- LIVE DATA SCHEMAS -----------------

class WeatherResponse(BaseModel):
    source: str = "Open-Meteo"
    location: str
    latitude: float
    longitude: float
    temperature: float
    apparent_temperature: Optional[float] = None
    relative_humidity: Optional[int] = None
    wind_speed: float
    wind_direction: Optional[float] = None
    precipitation: float
    weather_condition: str
    is_day: Optional[int] = 1
    forecast_daily: List[dict] = []
    timestamp: str
    attribution: str = "Weather data provided by Open-Meteo under CC BY 4.0"

class EarthquakeItem(BaseModel):
    id: str
    magnitude: float
    place: str
    time: int
    time_iso: str
    latitude: float
    longitude: float
    depth_km: float
    severity: str
    status: Optional[str] = "reviewed"
    tsunami_flag: int
    url: str
    in_south_asia: bool = False

class EarthquakesResponse(BaseModel):
    source: str = "USGS Earthquake Hazards Program"
    count: int
    earthquakes: List[EarthquakeItem]
    timestamp: str
    attribution: str = "Data courtesy of the U.S. Geological Survey (USGS)"

class AlertsResponse(BaseModel):
    source: str = "NDMA SACHET / Disaster Warning Division"
    status: str # "active", "unavailable", "simulated"
    message: str
    portal_url: str = "https://sachet.ndma.gov.in/"
    alerts: List[dict] = []
    timestamp: str

class FiresResponse(BaseModel):
    source: str = "NASA FIRMS (Fire Information for Resource Management System)"
    status: str
    message: str
    hotspots: List[dict] = []
    key_configured: bool
    notice: str = "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires."
    timestamp: str
