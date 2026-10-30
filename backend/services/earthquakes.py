import time
import httpx
from datetime import datetime
from typing import Dict, Any, List

_CACHE: Dict[str, Any] = {}
_CACHE_TIME = 0
CACHE_TTL = 300  # 5 minutes

USGS_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

def is_in_south_asia(lat: float, lon: float) -> bool:
    """Checks if coordinates fall in or near the Indian subcontinent and adjacent plates."""
    return 4.0 <= lat <= 38.5 and 58.0 <= lon <= 100.0

async def fetch_earthquakes_data(min_mag: float = 2.0, region_filter: str = "all") -> Dict[str, Any]:
    global _CACHE, _CACHE_TIME
    now = time.time()
    
    if _CACHE and (now - _CACHE_TIME < CACHE_TTL):
        raw_items = _CACHE.get("features", [])
    else:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(USGS_URL)
                res.raise_for_status()
                data = res.json()
                raw_items = data.get("features", [])
                _CACHE = {"features": raw_items}
                _CACHE_TIME = now
        except Exception as e:
            # If network error but we have old cached items, fall back gracefully
            if _CACHE:
                raw_items = _CACHE.get("features", [])
            else:
                raise e

    earthquakes: List[Dict[str, Any]] = []

    for item in raw_items:
        props = item.get("properties", {})
        geom = item.get("geometry", {})
        coords = geom.get("coordinates", [0, 0, 0])
        
        # GeoJSON is [lon, lat, depth]
        lon = coords[0] if len(coords) > 0 else 0.0
        lat = coords[1] if len(coords) > 1 else 0.0
        depth = coords[2] if len(coords) > 2 else 0.0

        mag = props.get("mag")
        if mag is None:
            continue
        mag = float(mag)

        if mag < min_mag:
            continue

        in_south_asia = is_in_south_asia(lat, lon)
        if region_filter == "india" and not in_south_asia:
            continue

        eq_time_ms = props.get("time", 0)
        try:
            time_iso = datetime.utcfromtimestamp(eq_time_ms / 1000.0).isoformat() + "Z"
        except Exception:
            time_iso = datetime.utcnow().isoformat() + "Z"

        severity = "Minor"
        if mag >= 6.0:
            severity = "Severe"
        elif mag >= 4.5:
            severity = "Moderate"
        elif mag >= 3.0:
            severity = "Light"

        earthquakes.append({
            "id": item.get("id", str(len(earthquakes) + 1)),
            "magnitude": round(mag, 1),
            "place": props.get("place", "Unknown Location"),
            "time": eq_time_ms,
            "time_iso": time_iso,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "depth_km": round(depth, 1),
            "severity": severity,
            "status": props.get("status", "reviewed"),
            "tsunami_flag": props.get("tsunami", 0),
            "url": props.get("url", "https://earthquake.usgs.gov"),
            "in_south_asia": in_south_asia
        })

    # Sort newest first
    earthquakes.sort(key=lambda x: x["time"], reverse=True)

    return {
        "source": "USGS Earthquake Hazards Program",
        "count": len(earthquakes),
        "earthquakes": earthquakes,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "attribution": "Data courtesy of the U.S. Geological Survey (USGS). Real-time seismic monitor."
    }
