import sys
import os
import unittest
from fastapi.testclient import TestClient

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from main import app, startup_event

client = TestClient(app)

class TestResqAIBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        startup_event()

    def test_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "operational")
        self.assertTrue(data["database_connected"])

    def test_weather_endpoint(self):
        res = client.get("/api/weather?city=delhi")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["source"], "Open-Meteo")
        self.assertIn("temperature", data)
        self.assertIn("weather_condition", data)

    def test_earthquakes_endpoint(self):
        res = client.get("/api/earthquakes?min_magnitude=3.0")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["source"], "USGS Earthquake Hazards Program")
        self.assertIsInstance(data["earthquakes"], list)

    def test_alerts_endpoint(self):
        res = client.get("/api/alerts")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("source", data)
        self.assertIn("status", data)

    def test_fires_endpoint(self):
        res = client.get("/api/fires")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("key_configured", data)

    def test_ai_modules(self):
        # AI Module 1: Classification
        classify_res = client.post("/api/ai/classify", json={
            "description": "Flash flooding on river road. Water level rising fast, 4 people trapped.",
            "location": "Pune"
        })
        self.assertEqual(classify_res.status_code, 200)
        c_data = classify_res.json()
        self.assertEqual(c_data["emergency_type"], "Flood")
        self.assertIn("severity", c_data)
        self.assertTrue(c_data["requires_human_review"])

        # AI Module 2: Risk Assessment
        risk_res = client.post("/api/ai/assess-risk", json={
            "incident_type": "Flood",
            "severity": "Critical",
            "people_affected": 5,
            "people_needing_assistance": 2,
            "vulnerable_present": True
        })
        self.assertEqual(risk_res.status_code, 200)
        r_data = risk_res.json()
        self.assertIn(r_data["risk_level"], ["Critical", "High"])
        self.assertGreater(r_data["score"], 50)

        # AI Module 3: Assistant Chat
        chat_res = client.post("/api/ai/chat", json={
            "message": "What should I do during an earthquake?",
            "language": "en"
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.json()
        self.assertIn("112", chat_data["response"])

    def test_full_emergency_workflow(self):
        # 1. Citizen submits report
        payload = {
            "name": "Pooja Verma",
            "contact": "+91 9988776655",
            "emergency_type": "Flood",
            "description": "Rising floodwaters trapped 2 people near bridge on rooftop.",
            "location": "Kothrud, Pune, Maharashtra",
            "latitude": 18.5074,
            "longitude": 73.8077,
            "severity": "Critical",
            "affected_count": 2,
            "injured_count": 0,
            "vulnerable_people": True
        }
        create_res = client.post("/api/incidents", json=payload)
        self.assertEqual(create_res.status_code, 200)
        create_data = create_res.json()
        self.assertTrue(create_data["success"])
        tracking_id = create_data["tracking_id"]
        self.assertTrue(tracking_id.startswith("RQ-2026-"))
        inc_id = create_data["incident_id"]

        # 2. Citizen tracks report
        track_res = client.get(f"/api/incidents/{tracking_id}")
        self.assertEqual(track_res.status_code, 200)
        track_data = track_res.json()
        self.assertEqual(track_data["status"], "New")
        self.assertEqual(track_data["emergency_type"], "Flood")

        # 3. Public list does not expose citizen contact
        pub_res = client.get("/api/incidents")
        self.assertEqual(pub_res.status_code, 200)
        pub_list = pub_res.json()
        found = next((r for r in pub_list if r["tracking_id"] == tracking_id), None)
        self.assertIsNotNone(found)
        self.assertNotIn("contact", found)
        self.assertNotIn("name", found)

        # 4. Responder logs in
        login_res = client.post("/api/auth/login", json={
            "email": "responder@resqai.in",
            "password": "Responder@2026"
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 5. Responder views full details (with contact)
        admin_list_res = client.get("/api/admin/reports", headers=headers)
        self.assertEqual(admin_list_res.status_code, 200)
        admin_list = admin_list_res.json()
        admin_item = next((r for r in admin_list if r["tracking_id"] == tracking_id), None)
        self.assertIsNotNone(admin_item)
        self.assertEqual(admin_item["contact"], "+91 9988776655")

        # 6. Responder updates status
        update_res = client.patch(
            f"/api/incidents/{inc_id}/status",
            json={"status": "Verified", "notes": "Onsite verification complete. NDRF watercraft deployed."},
            headers=headers
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["status"], "Verified")

        # 7. Smart routing planning
        route_res = client.post("/api/routing/plan", json={
            "origin_lat": 18.5204,
            "origin_lon": 73.8567,
            "dest_lat": 18.5074,
            "dest_lon": 73.8077
        })
        self.assertEqual(route_res.status_code, 200)
        route_data = route_res.json()
        self.assertIn("distance_km", route_data)
        self.assertIn("waypoints", route_data)

        # 8. Analytics summary check
        analytics_res = client.get("/api/analytics")
        self.assertEqual(analytics_res.status_code, 200)
        a_data = analytics_res.json()
        self.assertGreater(a_data["total_incidents"], 0)
        self.assertGreater(len(a_data["category_distribution"]), 0)

if __name__ == "__main__":
    unittest.main()
