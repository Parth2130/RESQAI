"""
RESQAI In-App Alert Service
Manages operational broadcasts, critical notifications, and event triggers.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from models import Alert


def create_alert(
    db: Session,
    message: str,
    severity: str = "Medium",
    alert_type: str = "Incident",
    related_incident_id: Optional[int] = None
) -> Alert:
    """Creates a new in-app notification alert."""
    alert = Alert(
        message=message,
        severity=severity,
        alert_type=alert_type,
        related_incident_id=related_incident_id,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts(db: Session, limit: int = 50, unread_only: bool = False) -> List[Alert]:
    """Fetches in-app alerts ordered by timestamp descending."""
    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


def mark_alert_read(db: Session, alert_id: int) -> Optional[Alert]:
    """Marks an alert as read."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
        db.refresh(alert)
    return alert


def mark_all_alerts_read(db: Session) -> int:
    """Marks all alerts as read."""
    updated = db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return updated
