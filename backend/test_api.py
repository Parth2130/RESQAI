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
        self.assertEqual(data["status"], "healthy")
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

    def test_assistant_status(self):
        res = client.get("/api/assistant/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("configured", data)

    def test_report_lifecycle(self):
        # 1. Submit Report
        payload = {
            "name": "Pooja Verma",
            "contact": "+91 9988776655",
            "emergency_type": "Flood",
            "description": "Rising floodwaters trapped 2 people near bridge.",
            "location": "Kothrud, Pune, Maharashtra",
            "latitude": 18.5074,
            "longitude": 73.8077,
            "severity": "Critical",
            "affected_count": 2
        }
        create_res = client.post("/api/reports", json=payload)
        self.assertEqual(create_res.status_code, 200)
        create_data = create_res.json()
        self.assertTrue(create_data["success"])
        tracking_id = create_data["tracking_id"]
        self.assertTrue(tracking_id.startswith("RESQ-"))

        # 2. Track Report
        track_res = client.get(f"/api/reports/{tracking_id}")
        self.assertEqual(track_res.status_code, 200)
        track_data = track_res.json()
        self.assertEqual(track_data["status"], "Submitted")
        self.assertEqual(track_data["emergency_type"], "Flood")

        # 3. Public list does not expose citizen contact
        pub_res = client.get("/api/reports")
        self.assertEqual(pub_res.status_code, 200)
        pub_list = pub_res.json()
        found = next((r for r in pub_list if r["tracking_id"] == tracking_id), None)
        self.assertIsNotNone(found)
        self.assertNotIn("contact", found)
        self.assertNotIn("name", found)

        # 4. Admin Login
        login_res = client.post("/api/admin/login", json={
            "email": "admin@resqai.in",
            "password": "ResqAdmin@2026"
        })
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 5. Admin List includes contact
        admin_list_res = client.get("/api/admin/reports", headers=headers)
        self.assertEqual(admin_list_res.status_code, 200)
        admin_list = admin_list_res.json()
        admin_item = next((r for r in admin_list if r["tracking_id"] == tracking_id), None)
        self.assertIsNotNone(admin_item)
        self.assertEqual(admin_item["contact"], "+91 9988776655")

        # 6. Admin Update Status
        update_res = client.patch(
            f"/api/admin/reports/{admin_item['id']}/status",
            json={"status": "Under Review", "notes": "Disaster Response Unit notified."},
            headers=headers
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["status"], "Under Review")

    def test_frontend_served(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("RESQAI", res.text)

if __name__ == "__main__":
    unittest.main()
