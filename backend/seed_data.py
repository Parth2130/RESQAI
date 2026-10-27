"""
RESQAI Seed Data Generator
Populates the SQLite database with realistic demonstration disaster management records.
Idempotent: prevents duplicate records if executed repeatedly.
"""
import json
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
from models import Incident, Resource, Shelter, Alert, IncidentNote, ResourceAssignment
from risk_engine import calculate_risk


def seed_database():
    """Initializes tables and seeds initial demo records."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Shelters
        if db.query(Shelter).count() == 0:
            shelters_data = [
                {
                    "shelter_code": "SHL-101",
                    "name": "Shivaji Nagar Municipal Community Center",
                    "location_name": "Shivaji Nagar, Pune",
                    "latitude": 18.5314,
                    "longitude": 73.8446,
                    "total_capacity": 250,
                    "current_occupancy": 110,
                    "facilities": json.dumps(["Clean Water", "Emergency Rations", "Backup Generator", "First Aid Station"]),
                    "accessibility_support": True,
                    "medical_support": True,
                    "contact_details": "+91 20 2550 1100",
                    "status": "Operational",
                    "vulnerable_elderly": 22,
                    "vulnerable_mobility": 8,
                    "vulnerable_children": 35,
                    "vulnerable_medical": 14,
                    "is_demo": True
                },
                {
                    "shelter_code": "SHL-102",
                    "name": "Kothrud Sports Complex Relief Haven",
                    "location_name": "Near Kothrud Stand, Pune",
                    "latitude": 18.5074,
                    "longitude": 73.8077,
                    "total_capacity": 400,
                    "current_occupancy": 280,
                    "facilities": json.dumps(["Water Filtration", "Cots", "Hot Meals", "Counseling Wing"]),
                    "accessibility_support": True,
                    "medical_support": False,
                    "contact_details": "+91 20 2544 3290",
                    "status": "Operational",
                    "vulnerable_elderly": 45,
                    "vulnerable_mobility": 12,
                    "vulnerable_children": 60,
                    "vulnerable_medical": 8,
                    "is_demo": True
                },
                {
                    "shelter_code": "SHL-103",
                    "name": "Aundh Multipurpose Auditorium",
                    "location_name": "Aundh High Street, Pune",
                    "latitude": 18.5580,
                    "longitude": 73.8075,
                    "total_capacity": 180,
                    "current_occupancy": 165,
                    "facilities": json.dumps(["Blankets", "Baby Care Station", "Solar Power"]),
                    "accessibility_support": True,
                    "medical_support": True,
                    "contact_details": "+91 20 2588 4120",
                    "status": "Near Capacity",
                    "vulnerable_elderly": 30,
                    "vulnerable_mobility": 14,
                    "vulnerable_children": 42,
                    "vulnerable_medical": 19,
                    "is_demo": True
                },
                {
                    "shelter_code": "SHL-104",
                    "name": "Hadapsar Industrial Relief Depot",
                    "location_name": "Hadapsar Bypass, Pune",
                    "latitude": 18.5089,
                    "longitude": 73.9259,
                    "total_capacity": 300,
                    "current_occupancy": 45,
                    "facilities": json.dumps(["Dry Rations Storage", "Sanitation Blocks", "Security Guard"]),
                    "accessibility_support": False,
                    "medical_support": False,
                    "contact_details": "+91 20 2687 0045",
                    "status": "Operational",
                    "vulnerable_elderly": 5,
                    "vulnerable_mobility": 2,
                    "vulnerable_children": 10,
                    "vulnerable_medical": 1,
                    "is_demo": True
                }
            ]
            for s in shelters_data:
                db.add(Shelter(**s))
            db.commit()
            print("[INFO] Seeded Shelters successfully.")

        # 2. Seed Resources
        if db.query(Resource).count() == 0:
            resources_data = [
                {
                    "resource_code": "RES-01",
                    "name": "Pune Rapid Medical Unit 1",
                    "resource_type": "Ambulance",
                    "capabilities": json.dumps(["Advanced Life Support (ALS)", "Defibrillator", "Oxygen Ventilator"]),
                    "location_name": "Swargate Base Camp",
                    "latitude": 18.5018,
                    "longitude": 73.8586,
                    "status": "Available",
                    "capacity": 2,
                    "contact_info": "+91 98220 11001",
                    "is_demo": True
                },
                {
                    "resource_code": "RES-02",
                    "name": "Sahyadri Flood Rescue Boat Alpha",
                    "resource_type": "Boat",
                    "capabilities": json.dumps(["Motorized Inflatable", "Depth Sonar", "Life Rafts", "8-Person Extraction"]),
                    "location_name": "Khadakwasla Water Rescue Station",
                    "latitude": 18.4319,
                    "longitude": 73.7629,
                    "status": "Available",
                    "capacity": 8,
                    "contact_info": "+91 98220 11002",
                    "is_demo": True
                },
                {
                    "resource_code": "RES-03",
                    "name": "NDRF Urban Search & Rescue Battalion 5",
                    "resource_type": "Search-and-rescue unit",
                    "capabilities": json.dumps(["Acoustic Void Detection", "Concrete Hydraulic Cutters", "Search Canines"]),
                    "location_name": "Talegaon NDRF Depot",
                    "latitude": 18.7300,
                    "longitude": 73.6800,
                    "status": "Available",
                    "capacity": 15,
                    "contact_info": "+91 98220 11003",
                    "is_demo": True
                },
                {
                    "resource_code": "RES-04",
                    "name": "Pune Fire Brigade Squad Charlie",
                    "resource_type": "Fire-response team",
                    "capabilities": json.dumps(["High-Pressure Foam", "Breathing Apparatus", "Aerial Ladder"]),
                    "location_name": "Bhavani Peth Station",
                    "latitude": 18.5088,
                    "longitude": 73.8643,
                    "status": "Available",
                    "capacity": 6,
                    "contact_info": "+91 98220 11004",
                    "is_demo": True
                },
                {
                    "resource_code": "RES-05",
                    "name": "Civil Defense Heavy Rescue Vehicle",
                    "resource_type": "Rescue vehicle",
                    "capabilities": json.dumps(["Winch 12-Ton", "Earthmover Blade", "Debris Clearance"]),
                    "location_name": "Kothrud Fire Station",
                    "latitude": 18.5074,
                    "longitude": 73.8077,
                    "status": "Available",
                    "capacity": 5,
                    "contact_info": "+91 98220 11005",
                    "is_demo": True
                },
                {
                    "resource_code": "RES-06",
                    "name": "Disaster Relief Food & Water Convoy",
                    "resource_type": "Relief supply vehicle",
                    "capabilities": json.dumps(["2000 Rations", "5000L Potable Water Tanker", "Water Purification Tablets"]),
                    "location_name": "Hadapsar Goods Depot",
                    "latitude": 18.5089,
                    "longitude": 73.9259,
                    "status": "Available",
                    "capacity": 4,
                    "contact_info": "+91 98220 11006",
                    "is_demo": True
                }
            ]
            for r in resources_data:
                db.add(Resource(**r))
            db.commit()
            print("[INFO] Seeded Resources successfully.")

        # 3. Seed Incidents
        if db.query(Incident).count() == 0:
            now = datetime.utcnow()
            incidents_data = [
                {
                    "incident_code": "INC-1001",
                    "title": "Flash Flooding and River Overflow in Mutha Basin",
                    "incident_type": "Flood",
                    "description": "Rising water levels from Khadakwasla discharge caused severe inundation across riverside low-lying residential areas. Several residents stranded on rooftops.",
                    "severity": "Critical",
                    "people_affected": 75,
                    "people_needing_assistance": 18,
                    "latitude": 18.4722,
                    "longitude": 73.8211,
                    "location_name": "Sinhagad Road, Vitthalwadi, Pune",
                    "reporter_name": "Amit Deshmukh (Ward Coordinator)",
                    "reporter_contact": "+91 94220 89100",
                    "status": "Response in Progress",
                    "is_demo": True,
                    "created_at": now - timedelta(hours=3, minutes=20)
                },
                {
                    "incident_code": "INC-1002",
                    "title": "Old Commercial Building Structural Wall Partial Collapse",
                    "incident_type": "Building collapse",
                    "description": "Continuous heavy precipitation triggered masonry failure on the eastern wing of a 3-storey heritage building. 4 workers trapped in ground floor warehouse.",
                    "severity": "High",
                    "people_affected": 20,
                    "people_needing_assistance": 4,
                    "latitude": 18.5167,
                    "longitude": 73.8562,
                    "location_name": "Budhwar Peth Market Lane, Pune",
                    "reporter_name": "Rajesh Shinde (Local Trader)",
                    "reporter_contact": "+91 98230 45678",
                    "status": "Verified",
                    "is_demo": True,
                    "created_at": now - timedelta(hours=2, minutes=10)
                },
                {
                    "incident_code": "INC-1003",
                    "title": "Ghat Landslide and Boulders Blocking Arterial Highway",
                    "incident_type": "Landslide",
                    "description": "Mudslide and loose boulders brought down by rain blocking both lanes. 15 passenger vehicles stranded with elderly travelers.",
                    "severity": "High",
                    "people_affected": 42,
                    "people_needing_assistance": 6,
                    "latitude": 18.3664,
                    "longitude": 73.7558,
                    "location_name": "Sinhagad Ghat Section, Km 4",
                    "reporter_name": "Traffic Patrol Officer Patil",
                    "reporter_contact": "+91 99210 54321",
                    "status": "Reported",
                    "is_demo": True,
                    "created_at": now - timedelta(hours=1, minutes=15)
                },
                {
                    "incident_code": "INC-1004",
                    "title": "Electrical Short Circuit & Chemical Fire at Industrial Unit",
                    "incident_type": "Fire",
                    "description": "Flooding caused short-circuit in transformer room spreading to solvent barrels. Dense toxic smoke billowing towards residential quarters.",
                    "severity": "Critical",
                    "people_affected": 30,
                    "people_needing_assistance": 7,
                    "latitude": 18.5913,
                    "longitude": 73.7389,
                    "location_name": "Hinjawadi Phase 1 MIDC, Pune",
                    "reporter_name": "Factory Security Incharge More",
                    "reporter_contact": "+91 97650 99881",
                    "status": "Reported",
                    "is_demo": True,
                    "created_at": now - timedelta(minutes=45)
                },
                {
                    "incident_code": "INC-1005",
                    "title": "Tree Fall & Severe Road Blockage Near Hospital Access",
                    "incident_type": "Road blockage",
                    "description": "Large banyan tree uprooted by gale winds blocking main approach road to Aundh Hospital. Ambulances forced to detour.",
                    "severity": "Medium",
                    "people_affected": 15,
                    "people_needing_assistance": 0,
                    "latitude": 18.5580,
                    "longitude": 73.8075,
                    "location_name": "Aundh Main DP Road, Pune",
                    "reporter_name": "Dr. Sneha Joshi",
                    "reporter_contact": "+91 98500 12345",
                    "status": "Resolved",
                    "is_demo": True,
                    "created_at": now - timedelta(hours=6),
                    "resolved_at": now - timedelta(hours=1)
                }
            ]

            for inc in incidents_data:
                # Calculate risk assessment using engine
                risk_res = calculate_risk(
                    incident_type=inc["incident_type"],
                    severity=inc["severity"],
                    people_affected=inc["people_affected"],
                    people_needing_assistance=inc["people_needing_assistance"],
                    has_coordinates=(inc["latitude"] is not None),
                    vulnerable_present=True,
                    environmental_hazard_alert=True
                )
                inc_record = Incident(
                    incident_code=inc["incident_code"],
                    title=inc["title"],
                    incident_type=inc["incident_type"],
                    description=inc["description"],
                    severity=inc["severity"],
                    people_affected=inc["people_affected"],
                    people_needing_assistance=inc["people_needing_assistance"],
                    latitude=inc["latitude"],
                    longitude=inc["longitude"],
                    location_name=inc["location_name"],
                    reporter_name=inc["reporter_name"],
                    reporter_contact=inc["reporter_contact"],
                    status=inc["status"],
                    risk_score=risk_res["risk_score"],
                    risk_level=risk_res["risk_level"],
                    response_priority=risk_res["priority"],
                    risk_factors=json.dumps(risk_res["factors"]),
                    risk_limitations=json.dumps(risk_res["limitations"]),
                    is_demo=True,
                    created_at=inc["created_at"],
                    resolved_at=inc.get("resolved_at")
                )
                db.add(inc_record)
            db.commit()
            print("[INFO] Seeded Incidents with Risk Assessments successfully.")

            # Assign Boat to Incident INC-1001 as realistic demo state
            inc_1 = db.query(Incident).filter(Incident.incident_code == "INC-1001").first()
            res_boat = db.query(Resource).filter(Resource.resource_code == "RES-02").first()
            if inc_1 and res_boat:
                inc_1.assigned_resource_id = res_boat.id
                res_boat.status = "Assigned"
                res_boat.current_incident_id = inc_1.id
                assignment = ResourceAssignment(
                    incident_id=inc_1.id,
                    resource_id=res_boat.id,
                    status="Active",
                    notes="Dispatched for Mutha basin stranded resident evacuation."
                )
                db.add(assignment)
                note = IncidentNote(
                    incident_id=inc_1.id,
                    author="Control Officer Kulkarni",
                    note="Assigned Boat Alpha from Khadakwasla station. ETA 12 minutes."
                )
                db.add(note)
                db.commit()

        # 4. Seed Alerts
        if db.query(Alert).count() == 0:
            alerts_data = [
                {
                    "alert_type": "Incident",
                    "message": "CRITICAL HAZARD: Flash flooding reported in Sinhagad Road, Vitthalwadi (Risk Score: 88).",
                    "severity": "Critical",
                    "related_incident_id": 1,
                    "is_read": False,
                    "created_at": datetime.utcnow() - timedelta(minutes=40)
                },
                {
                    "alert_type": "Shelter",
                    "message": "CAPACITY WARNING: Aundh Multipurpose Auditorium is at 91% occupancy (165/180).",
                    "severity": "High",
                    "related_incident_id": None,
                    "is_read": False,
                    "created_at": datetime.utcnow() - timedelta(minutes=25)
                },
                {
                    "alert_type": "Weather",
                    "message": "METEOROLOGICAL ADVISORY: Catchment rainfall intensity exceeds 18mm/h. Dam outflow increased.",
                    "severity": "High",
                    "related_incident_id": None,
                    "is_read": False,
                    "created_at": datetime.utcnow() - timedelta(minutes=15)
                },
                {
                    "alert_type": "Dispatch",
                    "message": "DISPATCH CONFIRMED: Rescue Boat Alpha successfully assigned to Mutha Basin Flash Flood.",
                    "severity": "Medium",
                    "related_incident_id": 1,
                    "is_read": True,
                    "created_at": datetime.utcnow() - timedelta(minutes=10)
                }
            ]
            for a in alerts_data:
                db.add(Alert(**a))
            db.commit()
            print("[INFO] Seeded Alerts successfully.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
