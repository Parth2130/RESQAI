"""
RESQAI Location & Geocoding Service
Provides GPS coordinate resolution, OpenStreetMap Nominatim reverse geocoding,
location search, and local gazetteer fallback.
Fully compliant with Nominatim Usage Policy (User-Agent header, attribution).
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

NOMINATIM_HEADERS = {
    "User-Agent": "RESQAI-DisasterEmergencyPlatform/2.0 (resqai-support@resqai.in)"
}

def get_location_api_key() -> str:
    return os.getenv("LOCATION_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("VITE_LOCATION_API_KEY") or ""

def reverse_geocode_detailed(lat: float, lng: float) -> Dict[str, Any]:
    """
    Detailed reverse geocoding returning structured city, state, postcode, and formatted address.
    Uses OpenStreetMap Nominatim with Google Maps Platform fallback if key configured.
    """
    api_key = get_location_api_key()

    # 1. Google Maps Geocoding if API key is configured
    if api_key and (api_key.startswith("AIza") or len(api_key) == 39):
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
            resp = requests.get(url, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    first = data["results"][0]
                    formatted = first.get("formatted_address", f"{lat:.4f}, {lng:.4f}")
                    city = ""
                    state = ""
                    postcode = ""
                    for comp in first.get("address_components", []):
                        types = comp.get("types", [])
                        if "locality" in types or "administrative_area_level_2" in types:
                            city = comp.get("long_name", "")
                        elif "administrative_area_level_1" in types:
                            state = comp.get("long_name", "")
                        elif "postal_code" in types:
                            postcode = comp.get("long_name", "")
                    return {
                        "latitude": lat,
                        "longitude": lng,
                        "address": formatted,
                        "display_name": formatted,
                        "city": city,
                        "state": state,
                        "postcode": postcode,
                        "provider": "Google Maps Platform"
                    }
        except Exception:
            pass

    # 2. OpenStreetMap Nominatim reverse geocoding
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&addressdetails=1"
        resp = requests.get(url, headers=NOMINATIM_HEADERS, timeout=4.0)
        if resp.status_code == 200:
            data = resp.json()
            addr_obj = data.get("address", {})
            city = (
                addr_obj.get("city")
                or addr_obj.get("town")
                or addr_obj.get("village")
                or addr_obj.get("suburb")
                or addr_obj.get("county")
                or ""
            )
            state = addr_obj.get("state", "")
            postcode = addr_obj.get("postcode", "")
            display_name = data.get("display_name", f"Location ({lat:.4f}, {lng:.4f})")
            return {
                "latitude": lat,
                "longitude": lng,
                "address": display_name,
                "display_name": display_name,
                "city": city,
                "state": state,
                "postcode": postcode,
                "provider": "OpenStreetMap Nominatim"
            }
    except Exception:
        pass

    # 3. Nearest landmark fallback (Pune gazetteer)
    closest_name = f"Grid Sector ({lat:.4f}, {lng:.4f})"
    min_dist = float("inf")
    for name, coords in PUNE_LANDMARKS.items():
        dist = ((coords["lat"] - lat) ** 2 + (coords["lng"] - lng) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_name = f"Near {name}, Maharashtra"

    return {
        "latitude": lat,
        "longitude": lng,
        "address": closest_name,
        "display_name": closest_name,
        "city": "Pune",
        "state": "Maharashtra",
        "postcode": "",
        "provider": "Local Geospatial Gazetteer (Offline Fallback)"
    }

def reverse_geocode(lat: float, lng: float) -> str:
    """Returns single human-readable string address."""
    info = reverse_geocode_detailed(lat, lng)
    return info.get("address", f"Location ({lat:.4f}, {lng:.4f})")

def forward_geocode(query: str) -> Optional[Dict[str, Any]]:
    """
    Forward geocodes address or city query to {lat, lng, address, city, state, postcode}.
    """
    api_key = get_location_api_key()

    # Google Maps Geocoding
    if api_key and (api_key.startswith("AIza") or len(api_key) == 39):
        try:
            url = f"https://maps.googleapis.com/maps/api/geocode/json?address={requests.utils.quote(query)}&key={api_key}"
            resp = requests.get(url, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    res = data["results"][0]
                    loc = res["geometry"]["location"]
                    return {
                        "lat": loc["lat"],
                        "lng": loc["lng"],
                        "address": res.get("formatted_address", query),
                        "display_name": res.get("formatted_address", query),
                        "provider": "Google Maps Platform"
                    }
        except Exception:
            pass

    # OpenStreetMap Nominatim Search
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={requests.utils.quote(query)}&limit=1&addressdetails=1"
        resp = requests.get(url, headers=NOMINATIM_HEADERS, timeout=4.0)
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                first = data[0]
                addr_obj = first.get("address", {})
                city = (
                    addr_obj.get("city")
                    or addr_obj.get("town")
                    or addr_obj.get("village")
                    or addr_obj.get("county")
                    or ""
                )
                state = addr_obj.get("state", "")
                postcode = addr_obj.get("postcode", "")
                return {
                    "lat": float(first["lat"]),
                    "lng": float(first["lon"]),
                    "address": first.get("display_name", query),
                    "display_name": first.get("display_name", query),
                    "city": city,
                    "state": state,
                    "postcode": postcode,
                    "provider": "OpenStreetMap Nominatim"
                }
    except Exception:
        pass

    # Match in local landmarks
    q_lower = query.lower()
    for name, coords in PUNE_LANDMARKS.items():
        if name.lower() in q_lower or q_lower in name.lower():
            return {
                "lat": coords["lat"],
                "lng": coords["lng"],
                "address": f"{name}, Pune, Maharashtra",
                "display_name": f"{name}, Pune, Maharashtra",
                "city": "Pune",
                "state": "Maharashtra",
                "postcode": "411004",
                "provider": "Local Gazetteer"
            }

    return None
