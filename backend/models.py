from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")  # admin, supervisor, responder
    created_at = Column(DateTime, default=datetime.utcnow)

class EmergencyReport(Base):
    __tablename__ = "emergency_reports"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(20), unique=True, index=True, nullable=False)
    # Confidential Citizen Data (Admin access only)
    name = Column(String(120), nullable=False)
    contact = Column(String(50), nullable=False)
    
    # Incident Details (Publicly accessible for situational awareness without PII)
    emergency_type = Column(String(80), nullable=False)  # Flood, Earthquake, Cyclone, Fire, Landslide, Medical, Other
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(String(30), default="High")  # Critical, High, Medium, Low
    affected_count = Column(Integer, default=1)
    image_url = Column(Text, nullable=True)
    status = Column(String(40), default="Submitted")  # Submitted, Under Review, Acknowledged, Resolved, Closed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    history = relationship("ReportHistory", back_populates="report", cascade="all, delete-orphan", order_by="desc(ReportHistory.updated_at)")

class ReportHistory(Base):
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("emergency_reports.id"), nullable=False)
    previous_status = Column(String(40), nullable=True)
    new_status = Column(String(40), nullable=False)
    notes = Column(Text, nullable=True)
    updated_by = Column(String(120), default="Citizen Submission")
    updated_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("EmergencyReport", back_populates="history")
