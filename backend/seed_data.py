"""
RESQAI Enhanced Seed Data Generator
Populates realistic demonstration disaster management records into PostgreSQL / SQLite.
Idempotent: prevents duplicate records if executed repeatedly.
"""
import json
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
from models import User, Incident, IncidentUpdate, SOSRequest, Resource, Responder, Assignment, Notification, RiskAssessment, AuditLog
from auth import hash_password
from config import INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_ADMIN_NAME

def seed_database():
    """Initializes tables and seeds initial demo records."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Users (Admin, Responder, Citizen)
        admin = db.query(User).filter(User.email == INITIAL_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                name=INITIAL_ADMIN_NAME,
                email=INITIAL_ADMIN_EMAIL,
                password_hash=hash_password(INITIAL_ADMIN_PASSWORD),
                role="admin",
                phone="+91 11 2343 8000",
                agency="National Disaster Management Authority (NDMA)",
                verified=True
            )
            db.add(admin)

        responder_user = db.query(User).filter(User.email == "responder@resqai.in").first()
        if not responder_user:
            responder_user = User(
                name="Inspector Rajesh Mane",
                email="responder@resqai.in",
                password_hash=hash_password("Responder@2026"),
                role="responder",
                phone="+91 98220 12345",
                agency="National Disaster Response Force (NDRF)",
                verified=True
            )
            db.add(responder_user)

        citizen_user = db.query(User).filter(User.email == "citizen@resqai.in").first()
        if not citizen_user:
            citizen_user = User(
                name="Pooja Sharma",
                email="citizen@resqai.in",
                password_hash=hash_password("Citizen@2026"),
                role="citizen",
                phone="+91 98765 43210",
                agency=None,
                verified=True
            )
            db.add(citizen_user)

        db.commit()

        # 2. Responders
        if db.query(Responder).count() == 0:
            responders_data = [
                {
                    "name": "Inspector Rajesh Mane",
                    "badge_id": "NDRF-8821",
                    "specialization": "Search and Rescue",
                    "phone": "+91 98220 12345",
                    "agency": "NDRF 5th Battalion",
                    "status": "Available",
                    "latitude": 18.5204,
                    "longitude": 73.8567
                },
                {
                    "name": "Dr. Ananya Sen",
                    "badge_id": "MED-7740",
                    "specialization": "Emergency Medical & Trauma",
                    "phone": "+91 98301 65432",
                    "agency": "Disaster Medical Assistance Team",
                    "status": "Available",
                    "latitude": 18.5310,
                    "longitude": 73.8440
                },
                {
                    "name": "Sub-Officer Sunil Pawar",
                    "badge_id": "FIRE-4412",
                    "specialization": "Structural Fire & HazMat",
                    "phone": "+91 94220 99887",
                    "agency": "Municipal Fire Brigade",
                    "status": "Available",
                    "latitude": 18.5080,
                    "longitude": 73.8070
                },
                {
                    "name": "Capt. Preeti Deshmukh",
                    "badge_id": "SDRF-3301",
                    "specialization": "Flood Evacuation & Watercraft",
                    "phone": "+91 98900 11223",
                    "agency": "State Disaster Response Force",
                    "status": "On Mission",
                    "latitude": 18.5350,
                    "longitude": 73.8490
                }
            ]
            for r in responders_data:
                db.add(Responder(**r))
            db.commit()

        # 3. Emergency Resources
        if db.query(Resource).count() == 0:
            resources_data = [
                {
                    "name": "Sassoon General Hospital & Trauma Centre",
                    "category": "Hospital",
                    "location": "Near Pune Railway Station, Pune",
                    "latitude": 18.5250,
                    "longitude": 73.8740,
                    "contact": "+91 20 2612 8000",
                    "availability": "Available",
                    "capacity": 350,
                    "current_occupancy": 210,
                    "verified": True,
                    "notes": "Level 1 Trauma Unit, 40 ICU beds, 24/7 Blood Bank."
                },
                {
                    "name": "Shivaji Nagar Municipal Community Shelter",
                    "category": "Shelter",
                    "location": "Shivaji Nagar, Pune",
                    "latitude": 18.5314,
                    "longitude": 73.8446,
                    "contact": "+91 20 2550 1100",
                    "availability": "Available",
                    "capacity": 250,
                    "current_occupancy": 110,
                    "verified": True,
                    "notes": "Emergency rations, backup power generator, baby care area, filtered water."
                },
                {
                    "name": "Kothrud Sports Complex Relief Shelter",
                    "category": "Shelter",
                    "location": "Near Kothrud Stand, Pune",
                    "latitude": 18.5074,
                    "longitude": 73.8077,
                    "contact": "+91 20 2544 3290",
                    "availability": "Available",
                    "capacity": 400,
                    "current_occupancy": 260,
                    "verified": True,
                    "notes": "Hot meal dispensary, accessibility ramps, cot bedding, psychological counseling."
                },
                {
                    "name": "Central Fire Brigade Headquarters",
                    "category": "Fire Station",
                    "location": "Bhawani Peth, Pune",
                    "latitude": 18.5135,
                    "longitude": 73.8685,
                    "contact": "+91 20 2645 1707",
                    "availability": "Available",
                    "capacity": 15,
                    "current_occupancy": 4,
                    "verified": True,
                    "notes": "6 heavy foam tenders, 2 hydraulic ladders (54m), 4 high-pressure pumpers."
                },
                {
                    "name": "108 Advanced Cardiac Life Support Ambulance Unit 12",
                    "category": "Ambulance",
                    "location": "Deccan Gymkhana, Pune",
                    "latitude": 18.5167,
                    "longitude": 73.8417,
                    "contact": "108 / +91 20 2553 4400",
                    "availability": "Available",
                    "capacity": 2,
                    "current_occupancy": 0,
                    "verified": True,
                    "notes": "Equipped with transport ventilator, monitor/defibrillator, paramedic onboard."
                },
                {
                    "name": "NDRF Flood Evacuation Unit Delta (3 Inflatable Boats)",
                    "category": "Rescue Team",
                    "location": "Mula-Mutha Confluence, Pune",
                    "latitude": 18.5360,
                    "longitude": 73.8680,
                    "contact": "+91 11 2436 3260",
                    "availability": "Available",
                    "capacity": 30,
                    "current_occupancy": 12,
                    "verified": True,
                    "notes": "3 motorized rubber dinghies, OBM motors, 60 life jackets, throw-ropes."
                },
                {
                    "name": "Red Cross Emergency Relief Supply Depot",
                    "category": "Relief Center",
                    "location": "Camp Area, Pune",
                    "latitude": 18.5100,
                    "longitude": 73.8800,
                    "contact": "+91 20 2634 5000",
                    "availability": "Available",
                    "capacity": 500,
                    "current_occupancy": 140,
                    "verified": True,
                    "notes": "Dry ration kits, hygiene packs, tarpaulins, chlorine purification tablets."
                }
            ]
            for res in resources_data:
                db.add(Resource(**res))
            db.commit()

        # 4. Realistic Incidents with Status Lifecycle
        if db.query(Incident).count() == 0:
            incidents_data = [
                {
                    "tracking_id": "RQ-2026-0001",
                    "name": "Ramesh Patil",
                    "contact": "+91 98230 45671",
                    "emergency_type": "Flood",
                    "description": "Flash flooding in residential low-lying area near Mutha riverbank. Water level at 4 feet and rising. 4 elderly citizens stranded on second floor balcony.",
                    "location": "Shivaji Nagar, Pune, Maharashtra",
                    "latitude": 18.5308,
                    "longitude": 73.8475,
                    "severity": "Critical",
                    "priority": "Urgent",
                    "affected_count": 4,
                    "injured_count": 0,
                    "vulnerable_people": True,
                    "status": "Verified",
                    "source": "Citizen Report",
                    "ai_classified": True,
                    "ai_summary": "Flash flood threat to stranded elderly citizens. Rising floodwaters require motorized boat extraction.",
                    "ai_confidence": 0.94
                },
                {
                    "tracking_id": "RQ-2026-0002",
                    "name": "Aarav Sharma",
                    "contact": "+91 98112 34567",
                    "emergency_type": "Waterlogging",
                    "description": "Severe storm waterlogging blocking main road artery under metro underpass. 3 vehicles stalled, water approaching ambulance corridor.",
                    "location": "Connaught Place, New Delhi",
                    "latitude": 28.6315,
                    "longitude": 77.2167,
                    "severity": "High",
                    "priority": "High",
                    "affected_count": 12,
                    "injured_count": 0,
                    "vulnerable_people": False,
                    "status": "Under Verification",
                    "source": "Citizen Report",
                    "ai_classified": True,
                    "ai_summary": "Urban waterlogging obstructing emergency vehicular movement.",
                    "ai_confidence": 0.89
                },
                {
                    "tracking_id": "RQ-2026-0003",
                    "name": "Sunita Deshmukh",
                    "contact": "+91 94220 89123",
                    "emergency_type": "Landslide",
                    "description": "Debris and rockfall blocking two lanes on highway section after torrential rain. Traffic halted. No known casualties yet but slope looks unstable.",
                    "location": "Lonavala Ghats, Maharashtra",
                    "latitude": 18.7557,
                    "longitude": 73.4091,
                    "severity": "Medium",
                    "priority": "Standard",
                    "affected_count": 6,
                    "injured_count": 0,
                    "vulnerable_people": False,
                    "status": "New",
                    "source": "Citizen Report",
                    "ai_classified": True,
                    "ai_summary": "Highway road blockage caused by rockfall. Heavy earthmoving equipment recommended.",
                    "ai_confidence": 0.91
                },
                {
                    "tracking_id": "RQ-2026-0004",
                    "name": "Pooja Verma",
                    "contact": "+91 98765 43210",
                    "emergency_type": "Immediate SOS Distress",
                    "description": "Emergency SOS triggered: Building tremor shaking noticed, power cut in apartment building.",
                    "location": "Sector 62, Noida, Uttar Pradesh",
                    "latitude": 28.6280,
                    "longitude": 77.3649,
                    "severity": "High",
                    "priority": "High",
                    "affected_count": 8,
                    "injured_count": 0,
                    "vulnerable_people": True,
                    "status": "Assigned",
                    "source": "SOS Distress",
                    "ai_classified": True,
                    "ai_summary": "Structural tremor distress report. Structural stability team assigned.",
                    "ai_confidence": 0.87
                },
                {
                    "tracking_id": "RQ-2026-0005",
                    "name": "Vikram Sen",
                    "contact": "+91 98301 77654",
                    "emergency_type": "Cyclone",
                    "description": "Fallen high-tension tree damaged electrical poles and blocked community center entrance. Power severed in ward.",
                    "location": "Digha Coastal Belt, West Bengal",
                    "latitude": 21.6266,
                    "longitude": 87.5074,
                    "severity": "High",
                    "priority": "High",
                    "affected_count": 25,
                    "injured_count": 1,
                    "vulnerable_people": False,
                    "status": "Resolved",
                    "source": "Citizen Report",
                    "ai_classified": True,
                    "ai_summary": "Gale-force cyclone damage cleared by municipal emergency clearance crews.",
                    "ai_confidence": 0.92
                }
            ]

            for inc_data in incidents_data:
                inc = Incident(**inc_data)
                db.add(inc)
                db.flush()

                # Add update history
                update1 = IncidentUpdate(
                    incident_id=inc.id,
                    previous_status=None,
                    new_status="New",
                    notes="Emergency report logged into RESQAI disaster coordination system.",
                    updated_by="Citizen Submission"
                )
                db.add(update1)

                if inc.status != "New":
                    update2 = IncidentUpdate(
                        incident_id=inc.id,
                        previous_status="New",
                        new_status=inc.status,
                        notes=f"Triage status progressed to {inc.status} by Emergency Operations Center.",
                        updated_by="Officer Rajesh Mane (NDRF)"
                    )
                    db.add(update2)

                # Add risk assessment
                risk = RiskAssessment(
                    incident_id=inc.id,
                    risk_level=inc.severity,
                    score=85.0 if inc.severity == "Critical" else (65.0 if inc.severity == "High" else 42.0),
                    hazard_points=35.0,
                    severity_points=25.0,
                    assistance_points=15.0,
                    vulnerable_points=10.0 if inc.vulnerable_people else 0.0,
                    environmental_points=5.0,
                    explanation=f"Assessment for {inc.emergency_type} incident at {inc.location}. Prioritized by immediate life-safety peril.",
                    contributing_factors=json.dumps([f"Hazard type: {inc.emergency_type}", f"Reported severity: {inc.severity}", f"{inc.affected_count} affected persons"]),
                    recommendations=json.dumps(["Maintain safe perimeter", "Check nearby emergency medical center availability", "Direct evacuees to verified municipal shelter"]),
                    limitations=json.dumps(["Initial estimate subject to onsite visual inspection"]),
                    ai_generated=True
                )
                db.add(risk)

            db.commit()

        # 5. Seed Initial Notifications
        if db.query(Notification).count() == 0:
            notifs = [
                {
                    "title": "Severe Rain & Waterlogging Advisory",
                    "message": "Heavy monsoon precipitation forecast in low-lying riverine basins. Citizens are advised to monitor official NDMA channels.",
                    "type": "alert",
                    "priority": "high"
                },
                {
                    "title": "Seismic Activity Monitor Active",
                    "message": "USGS GeoJSON live telemetry feed connected. South Asia plate boundaries monitored in real-time.",
                    "type": "alert",
                    "priority": "normal"
                },
                {
                    "title": "SOS Distress Unit Online",
                    "message": "Emergency SOS direct-beacon transmitter active. Unified 112 guidance accessible on all terminals.",
                    "type": "sos",
                    "priority": "critical"
                }
            ]
            for n in notifs:
                db.add(Notification(**n))
            db.commit()

        print("[RESQAI-SEED] Seed data successfully verified and populated.")
    except Exception as e:
        db.rollback()
        print(f"[RESQAI-SEED-ERR] {e}")
    finally:
        db.close()
