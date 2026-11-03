"""
RESQAI Location & Geocoding Service
Provides coordinates resolution, reverse geocoding, address lookup, and location validation.
Supports Google Maps Platform Geocoding API, LocationIQ, OpenStreetMap Nominatim, and offline gazetteer.
"""
from typing import Dict, Any, Optional, List
import requests
import os

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

def get_location_api_key() -> str:
    return os.getenv("LOCATION_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("VITE_LOCATION_API_KEY") or ""

def reverse_geocode(lat: float, lng: float) -> str:
    """
    Reverse geocodes (lat, lng) coordinates to human-readable address.
    1. Uses Google Maps Platform Geocoding if LOCATION_API_KEY starts with AIza
    2. Uses LocationIQ / Geoapify if other API key is set
    3. Falls back to OpenStreetMap Nominatim
    4. Falls back to nearest sector/landmark gazetteer
    """
    api_key = get_location_api_key()

    # 1. Google Maps Geocoding API
    if api_key and (api_key.startswith("AIza") or len(api_key) == 39):
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
            resp = requests.get(url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    return data["results"][0].get("formatted_address", f"Location ({lat:.4f}, {lng:.4f})")
        except Exception:
            pass

    # 2. LocationIQ Geocoding API
    if api_key and not api_key.startswith("AIza"):
        try:
            url = f"https://us1.locationiq.com/v1/reverse?key={api_key}&lat={lat}&lon={lng}&format=json"
            resp = requests.get(url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("display_name", f"Location ({lat:.4f}, {lng:.4f})")
        except Exception:
            pass

    # 3. OpenStreetMap Nominatim
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}"
        headers = {"User-Agent": "RESQAI-DisasterResponseSystem/2.0"}
        resp = requests.get(url, headers=headers, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("display_name", f"Location ({lat:.4f}, {lng:.4f})")
    except Exception:
        pass

    # 4. Nearest landmark fallback
    closest_name = f"Grid Sector ({lat:.4f}, {lng:.4f})"
    min_dist = float("inf")
    for name, coords in PUNE_LANDMARKS.items():
        dist = ((coords["lat"] - lat) ** 2 + (coords["lng"] - lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_name = f"Near {name}, Pune Sector"
    return closest_name

def forward_geocode(query: str) -> Optional[Dict[str, Any]]:
    """
    Forward geocodes address query to {lat, lng, address}.
    """
    api_key = get_location_api_key()

    # Google Maps Geocoding API
    if api_key and (api_key.startswith("AIza") or len(api_key) == 39):
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={requests.utils.quote(query)}&key={api_key}"
            resp = requests.get(url, timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    first = data["results"][0]
                    loc = first["geometry"]["location"]
                    return {
                        "latitude": loc["lat"],
                        "longitude": loc["lng"],
                        "address": first.get("formatted_address", query)
                    }
        except Exception:
            pass

    # OpenStreetMap Nominatim fallback
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(query)}&limit=1"
        headers = {"User-Agent": "RESQAI-DisasterResponseSystem/2.0"}
        resp = requests.get(url, headers=headers, timeout=2.5)
        if resp.status_code == 200:
            results = resp.json()
            if results:
                first = results[0]
                return {
                    "latitude": float(first["lat"]),
                    "longitude": float(first["lon"]),
                    "address": first.get("display_name", query)
                }
    except Exception:
        pass

    # Landmark match
    for name, coords in PUNE_LANDMARKS.items():
        if name.lower() in query.lower():
            return {
                "latitude": coords["lat"],
                "longitude": coords["lng"],
                "address": f"{name}, Pune"
            }
    return None
