"""
RESQAI Automated System Verification Suite
Tests all 17 acceptance workflows across backend APIs, database persistence,
risk scoring, dispatch recommendations, routing, and shelter capacity rules.
"""
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import Incident, Resource, Shelter, Alert

client = TestClient(app)

def run_all_tests():
    print("=" * 60)
    print("STARTING RESQAI AUTOMATED TEST VERIFICATION SUITE")
    print("=" * 60)

    # TEST 1: Health endpoint
    r1 = client.get("/api/health")
    assert r1.status_code == 200, f"Health check failed: {r1.text}"
    data1 = r1.json()
    assert data1["status"] == "healthy"
    print("[PASS] TEST 1: Health endpoint operational.")

    # TEST 2: Stats endpoint
    r2 = client.get("/api/stats")
    assert r2.status_code == 200, f"Stats endpoint failed: {r2.text}"
    stats2 = r2.json()
    assert "total_incidents" in stats2
    initial_incident_count = stats2["total_incidents"]
    print(f"[PASS] TEST 2: Stats endpoint retrieved ({initial_incident_count} incidents).")

    # TEST 3: Submit valid incident report
    new_inc_payload = {
        "title": "Submerged Underpass Trapping City Bus",
        "incident_type": "Flash flood",
        "description": "Rapid waterlogging under railway bridge trapped transit bus with 22 passengers.",
        "severity": "Critical",
        "people_affected": 25,
        "people_needing_assistance": 8,
        "latitude": 18.5123,
        "longitude": 73.8456,
        "location_name": "Shivaji Nagar Railway Underpass, Pune",
        "reporter_name": "Traffic Warden Deshpande",
        "reporter_contact": "+91 98220 77112",
        "is_demo": True
    }
    r3 = client.post("/api/incidents", json=new_inc_payload)
    assert r3.status_code == 201, f"Create incident failed: {r3.text}"
    res3 = r3.json()
    created_id = res3["incident"]["id"]
    created_code = res3["incident"]["incident_code"]
    created_risk = res3["risk_assessment"]["risk_score"]
    assert created_risk >= 70, f"Expected critical score for 8 trapped victims, got {created_risk}"
    print(f"[PASS] TEST 3: Incident reported successfully as {created_code} with risk score {created_risk}.")

    # TEST 4: Verify persistence in SQLite
    db = SessionLocal()
    db_inc = db.query(Incident).filter(Incident.id == created_id).first()
    assert db_inc is not None, "Incident not found in SQLite database!"
    assert db_inc.title == new_inc_payload["title"]
    db.close()
    print("[PASS] TEST 4: Incident verified in persistent SQLite database.")

    # TEST 5: Verify incident persists across fresh API request
    r5 = client.get(f"/api/incidents/{created_id}")
    assert r5.status_code == 200
    assert r5.json()["incident_code"] == created_code
    print("[PASS] TEST 5: Incident retrieved via GET endpoint with full details.")

    # TEST 6: Dashboard stats update
    r6 = client.get("/api/stats")
    stats6 = r6.json()
    assert stats6["total_incidents"] == initial_incident_count + 1
    print(f"[PASS] TEST 6: Dashboard count increased to {stats6['total_incidents']}.")

    # TEST 7: Search and filter on incidents endpoint
    r7 = client.get(f"/api/incidents?search={created_code}")
    assert r7.status_code == 200
    search_results = r7.json()
    assert len(search_results) >= 1
    assert search_results[0]["incident_code"] == created_code
    print("[PASS] TEST 7: Search query located created incident.")

    # TEST 8: GeoJSON Map feed contains coordinates
    r8 = client.get("/api/map/incidents")
    assert r8.status_code == 200
    map_features = r8.json()["features"]
    found_map_feature = any(f["properties"]["id"] == created_id for f in map_features)
    assert found_map_feature, "New incident coordinates not found in map feed!"
    print("[PASS] TEST 8: GeoJSON map feed verified for new incident.")

    # TEST 9: Standalone risk engine calculation with factor explanations
    risk_req = {
        "incident_type": "Building collapse",
        "severity": "Critical",
        "people_affected": 30,
        "people_needing_assistance": 12,
        "has_coordinates": True,
        "vulnerable_present": True,
        "environmental_hazard_alert": True
    }
    r9 = client.post("/api/risk/assess", json=risk_req)
    assert r9.status_code == 200
    risk_eval = r9.json()
    assert risk_eval["risk_score"] >= 80
    assert risk_eval["risk_level"] == "Critical"
    assert len(risk_eval["factors"]) > 0
    assert len(risk_eval["limitations"]) > 0
    print(f"[PASS] TEST 9: Risk engine returned transparent score {risk_eval['risk_score']} with {len(risk_eval['factors'])} factors.")

    # TEST 10: Dispatch recommendations ranking
    r10 = client.post(f"/api/incidents/{created_id}/recommend-resources")
    assert r10.status_code == 200
    recs = r10.json()["recommendations"]
    assert len(recs) > 0
    top_rec = recs[0]
    print(f"[PASS] TEST 10: Dispatch recommendations returned (Top match: {top_rec['name']} - {top_rec['suitability_score']}%).")

    # TEST 11: Assign available resource
    available_res = [r for r in recs if r["is_available"]]
    assert len(available_res) > 0, "No available resources for dispatch test!"
    chosen_res = available_res[0]

    assign_payload = {
        "resource_id": chosen_res["resource_id"],
        "notes": "Urgent extraction dispatch."
    }
    r11 = client.post(f"/api/incidents/{created_id}/assign-resource", json=assign_payload)
    assert r11.status_code == 200, f"Assignment failed: {r11.text}"
    print(f"[PASS] TEST 11: Asset {chosen_res['name']} assigned to {created_code}.")

    # TEST 12: Verify assigned resource is now busy/assigned and cannot be re-assigned
    r12_conflict = client.post(f"/api/incidents/1/assign-resource", json=assign_payload)
    assert r12_conflict.status_code == 400, "Should reject assigning an already assigned resource!"
    print("[PASS] TEST 12: Double-booking prevention verified (blocked concurrent assignment).")

    # TEST 13: Shelter creation & occupancy bounds validation
    shelter_payload = {
        "name": "Deccan Gymkhana Relief Center",
        "location_name": "Deccan, Pune",
        "latitude": 18.5160,
        "longitude": 73.8410,
        "total_capacity": 150,
        "current_occupancy": 50,
        "facilities": ["Hot Food", "First Aid", "Cots"],
        "accessibility_support": True,
        "medical_support": True,
        "is_demo": True
    }
    r13_create = client.post("/api/shelters", json=shelter_payload)
    assert r13_create.status_code == 201
    shl_id = r13_create.json()["shelter"]["id"]

    # Verify negative occupancy rejection
    r13_neg = client.patch(f"/api/shelters/{shl_id}", json={"current_occupancy": -5})
    assert r13_neg.status_code in [400, 422], "Should reject negative occupancy!"

    # Verify over-capacity rejection
    r13_over = client.patch(f"/api/shelters/{shl_id}", json={"current_occupancy": 300})
    assert r13_over.status_code in [400, 422], "Should reject occupancy exceeding total capacity!"

    # Valid occupancy update
    r13_valid = client.patch(f"/api/shelters/{shl_id}", json={"current_occupancy": 140})
    assert r13_valid.status_code == 200
    assert r13_valid.json()["shelter"]["status"] == "Near Capacity"
    print("[PASS] TEST 13: Shelter occupancy bounds & auto-status transition validated.")

    # TEST 14: In-app alerts stored and marked as read
    r14 = client.get("/api/alerts?unread_only=true")
    assert r14.status_code == 200
    alerts = r14.json()
    assert len(alerts) > 0
    alert_to_read = alerts[0]["id"]
    r14_read = client.patch(f"/api/alerts/{alert_to_read}/read")
    assert r14_read.status_code == 200
    assert r14_read.json()["alert"]["is_read"] == True
    print("[PASS] TEST 14: In-app operational alerts verified & marked as read.")

    # TEST 15: Analytics summary reflects database state
    r15 = client.get("/api/analytics/summary")
    assert r15.status_code == 200
    summary = r15.json()
    assert "incidents_by_type" in summary
    assert "incidents_by_severity" in summary
    assert "shelter_stats" in summary
    assert summary["total_people_affected"] > 0
    print(f"[PASS] TEST 15: Analytics SITREP summary computed directly from database ({summary['total_people_affected']} affected total).")

    # TEST 16: Hazard-aware route calculation with waypoint tortuosity & hazard proximity
    route_req = {
        "origin_lat": 18.5018,
        "origin_lng": 73.8586,
        "dest_lat": 18.4722,
        "dest_lng": 73.8211,
        "resource_type": "Boat",
        "avoid_critical_hazards": True
    }
    r16 = client.post("/api/routes/recommend", json=route_req)
    assert r16.status_code == 200
    route_res = r16.json()
    assert "waypoints" in route_res
    assert len(route_res["waypoints"]) >= 5
    assert route_res["estimated_driving_distance_km"] > route_res["crow_distance_km"]
    assert "advisories" in route_res
    print(f"[PASS] TEST 16: Safe route corridor generated ({route_res['estimated_driving_distance_km']} km, {len(route_res['waypoints'])} waypoints).")

    # TEST 17: Weather fallback resilience
    r17 = client.get("/api/weather?lat=18.5204&lon=73.8567")
    assert r17.status_code == 200
    weather = r17.json()
    assert "temperature_c" in weather
    assert "condition" in weather
    print(f"[PASS] TEST 17: Weather resilience feed operational ({weather['condition']}, {weather['temperature_c']} deg C).")

    print("=" * 60)
    print("ALL 17 VERIFICATION TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
