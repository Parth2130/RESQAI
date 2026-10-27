"""
RESQAI Location & Geocoding Service
Provides coordinates resolution, address lookup, and location validation.
"""
from typing import Dict, Any, Optional
import requests

# Offline fallback gazetteer for Pune & surrounding disaster mitigation zones
PUNE_LANDMARKS = {
    "Shivajinagar": {"lat": 18.5314, "lng": 73.8446},
    "Kothrud": {"lat": 18.5074, "lng": 73.8077},
    "Hinjawadi": {"lat": 18.5913, "lng": 73.7389},
    "Hadapsar": {"lat": 18.5089, "lng": 73.9259},
    "Sinhagad Road": {"lat": 18.4722, "lng": 73.8211},
    "Aundh": {"lat": 18.5580, "lng": 73.8075},
    "Viman Nagar": {"lat": 18.5679, "lng": 73.9143},
    "Swargate": {"lat": 18.5018, "lng": 73.8586},
    "Khadakwasla Dam": {"lat": 18.4319, "lng": 73.7629},
    "Pimpri Chinchwad": {"lat": 18.6279, "lng": 73.8009}
}


def reverse_geocode(lat: float, lng: float) -> str:
    """Attempts OSM Nominatim reverse geocode with fallback to local gazetteer."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}"
        headers = {"User-Agent": "RESQAI-DisasterResponseSystem/1.0"}
        resp = requests.get(url, headers=headers, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("display_name", f"Location ({lat:.4f}, {lng:.4f})")
    except Exception:
        pass

    # Find nearest landmark from local gazetteer
    closest_name = f"Grid Sector ({lat:.4f}, {lng:.4f})"
    min_dist = float("inf")
    for name, coords in PUNE_LANDMARKS.items():
        dist = ((coords["lat"] - lat) ** 2 + (coords["lng"] - lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_name = f"Near {name}, Pune Sector"
    return closest_name
