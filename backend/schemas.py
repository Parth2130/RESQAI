from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- USER AUTH & PROFILE SCHEMAS -----------------

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=180)
    password: str = Field(..., min_length=6)
    role: str = Field("citizen", description="citizen, responder, admin")
    phone: Optional[str] = None
    agency: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    agency: Optional[str] = None
    verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

# Admin aliases for backward compatibility
AdminLoginRequest = UserLoginRequest
AdminUserResponse = UserProfileResponse
AdminTokenResponse = TokenResponse

class AdminSetupRequest(BaseModel):
    name: str
    email: str
    password: str

# ----------------- INCIDENT & EMERGENCY REPORT SCHEMAS -----------------

class IncidentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Full name of reporting citizen")
    contact: str = Field(..., min_length=7, max_length=50, description="Phone number or contact info")
    emergency_type: str = Field(..., description="Flood, Earthquake, Cyclone, Fire, Landslide, Medical Emergency, Accident, Other")
    description: str = Field(..., min_length=5, description="Details of emergency and required assistance")
    location: str = Field(..., min_length=2, max_length=255, description="Location name, landmark or city")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    severity: str = Field("High", description="Critical, High, Medium, Low")
    affected_count: int = Field(1, ge=1, description="Number of people affected or stranded")
    injured_count: int = Field(0, ge=0, description="Number of injured individuals")
    vulnerable_people: bool = Field(False, description="Whether children, elderly or disabled persons are present")
    image_url: Optional[str] = Field(None, description="Optional photo URL or base64")

# Backward compatibility alias
ReportCreate = IncidentCreate

class IncidentUpdateItem(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    notes: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Backward compatibility alias
ReportHistoryItem = IncidentUpdateItem

class IncidentPublic(BaseModel):
    id: int
    tracking_id: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    priority: str = "Standard"
    status: str
    affected_count: int
    injured_count: int = 0
    vulnerable_people: bool = False
    image_url: Optional[str] = None
    source: str = "Citizen Report"
    ai_classified: bool = False
    ai_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

ReportPublic = IncidentPublic

class IncidentTrackingResponse(BaseModel):
    id: int
    tracking_id: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    status: str
    affected_count: int
    injured_count: int = 0
    vulnerable_people: bool = False
    created_at: datetime
    updated_at: datetime
    history: List[IncidentUpdateItem] = []
    disclaimer: str = "RESQAI is an informational and reporting platform. In immediate danger, call national emergency services (112) directly."

    class Config:
        from_attributes = True

ReportTrackingResponse = IncidentTrackingResponse

class IncidentDetail(BaseModel):
    id: int
    tracking_id: str
    name: str
    contact: str
    emergency_type: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    priority: str = "Standard"
    status: str
    affected_count: int
    injured_count: int = 0
    vulnerable_people: bool = False
    image_url: Optional[str] = None
    source: str = "Citizen Report"
    ai_classified: bool = False
    ai_summary: Optional[str] = None
    ai_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    history: List[IncidentUpdateItem] = []

    class Config:
        from_attributes = True

ReportAdmin = IncidentDetail

class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., description="New, Under Verification, Verified, Assigned, Rescue in Progress, Resolved, Closed")
    notes: Optional[str] = Field(None, description="Operational notes or verification remarks")

ReportStatusUpdate = IncidentStatusUpdate

# ----------------- SOS DISTRESS REQUEST SCHEMAS -----------------

class SOSCreate(BaseModel):
    name: str = Field("Citizen SOS Distress", max_length=120)
    contact: str = Field(..., min_length=7, max_length=50)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    location_text: Optional[str] = "Live GPS Coordinates"
    emergency_type: str = Field("Immediate SOS Distress", max_length=80)
    details: Optional[str] = "Emergency SOS button triggered with GPS coordinates."

class SOSResponse(BaseModel):
    success: bool
    incident_id: int
    tracking_id: str
    status: str
    latitude: float
    longitude: float
    created_at: str
    message: str
    disclaimer: str = "RESQAI SOS transmits telemetry to response teams. It does not replace national emergency 112 services."

# ----------------- EMERGENCY RESOURCE SCHEMAS -----------------

class ResourceCreate(BaseModel):
    name: str
    category: str = Field(..., description="Hospital, Ambulance, Fire Station, Shelter, Rescue Team, Relief Center")
    location: str
    latitude: float
    longitude: float
    contact: Optional[str] = None
    availability: str = Field("Available", description="Available, Deployed, Maintenance")
    capacity: int = 50
    current_occupancy: int = 0
    verified: bool = True
    notes: Optional[str] = None

class ResourceResponse(BaseModel):
    id: int
    name: str
    category: str
    location: str
    latitude: float
    longitude: float
    contact: Optional[str] = None
    availability: str
    capacity: int
    current_occupancy: int
    verified: bool
    notes: Optional[str] = None
    last_updated: datetime

    class Config:
        from_attributes = True

# ----------------- RESPONDER & ASSIGNMENT SCHEMAS -----------------

class ResponderCreate(BaseModel):
    name: str
    badge_id: str
    specialization: str = "Search and Rescue"
    phone: str
    agency: str = "National Disaster Response Force (NDRF)"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ResponderResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    badge_id: str
    specialization: str
    phone: str
    agency: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_incident_id: Optional[int] = None

    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    incident_id: int
    responder_id: Optional[int] = None
    resource_id: Optional[int] = None
    notes: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: int
    incident_id: int
    responder_id: Optional[int] = None
    resource_id: Optional[int] = None
    notes: Optional[str] = None
    status: str
    assigned_at: datetime

    class Config:
        from_attributes = True

# ----------------- NOTIFICATION SCHEMAS -----------------

class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    type: str
    priority: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- NUGEN AI STRUCTURED SCHEMAS -----------------

class AIClassificationRequest(BaseModel):
    description: str = Field(..., min_length=3)
    location: Optional[str] = None

class AIClassificationResponse(BaseModel):
    emergency_type: str
    severity: str
    priority: str
    vulnerable_people: bool
    summary: str
    recommended_action: str
    requires_human_review: bool = True
    confidence_score: Optional[float] = None
    provider: str = "Nugen AI"

class AIRiskAssessmentRequest(BaseModel):
    incident_type: str
    severity: str
    people_affected: int = 1
    people_needing_assistance: int = 0
    vulnerable_present: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AIRiskAssessmentResponse(BaseModel):
    risk_level: str  # Critical, High, Medium, Low
    score: float  # 0 to 100
    hazard_points: float
    severity_points: float
    assistance_points: float
    vulnerable_points: float
    environmental_points: float
    explanation: str
    contributing_factors: List[str]
    recommendations: List[str]
    limitations: List[str]
    ai_generated: bool
    timestamp: str

class AIRecommendationRequest(BaseModel):
    incident_id: int

class AIRecommendationResponse(BaseModel):
    incident_id: int
    emergency_type: str
    recommended_resource_categories: List[str]
    suggested_priority: str
    recommended_actions: List[str]
    safety_precautions: List[str]
    evacuation_considerations: List[str]
    responder_briefing: str
    requires_human_approval: bool = True
    provider: str

# ----------------- ROUTING SCHEMAS -----------------

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float

class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: int
    waypoints: List[List[float]]
    hazards_nearby: List[Dict[str, Any]]
    hazard_warning: Optional[str] = None
    verified_safe: bool = False
    disclaimer: str = "Rescue transit route recommendation. Road conditions must be verified by field responders."

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

# ----------------- LIVE TELEMETRY SCHEMAS -----------------

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
    status: str
    message: str
    portal_url: str = "https://sachet.ndma.gov.in/"
    alerts: List[dict] = []
    timestamp: str

class FiresResponse(BaseModel):
    source: str = "NASA FIRMS"
    status: str
    message: str
    hotspots: List[dict] = []
    key_configured: bool
    notice: str = "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires."
    timestamp: str

# ----------------- ANALYTICS SCHEMAS -----------------

class AnalyticsOverview(BaseModel):
    total_incidents: int
    active_incidents: int
    critical_emergencies: int
    resolved_incidents: int
    sos_distress_count: int
    total_resources: int
    available_resources: int
    total_registered_users: int
    category_distribution: List[Dict[str, Any]]
    severity_distribution: List[Dict[str, Any]]
    status_distribution: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]
    timestamp: str
