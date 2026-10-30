import csv
import io
import httpx
from datetime import datetime
from typing import Dict, Any, List
from config import NASA_FIRMS_MAP_KEY

FIRMS_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api/country/csv"

async def fetch_nasa_fires() -> Dict[str, Any]:
    """
    Fetches satellite-detected thermal anomalies from NASA FIRMS.
    Requires NASA_FIRMS_MAP_KEY.
    All data is clearly categorized as unverified satellite thermal hotspots.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"

    if not NASA_FIRMS_MAP_KEY or NASA_FIRMS_MAP_KEY.strip() == "":
        return {
            "source": "NASA FIRMS (Fire Information for Resource Management System)",
            "status": "unconfigured",
            "message": "NASA FIRMS MAP API key is not configured in .env. Satellite hotspot tracking is in standby mode. Register for a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/.",
            "hotspots": [],
            "key_configured": False,
            "notice": "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires.",
            "timestamp": timestamp
        }

    url = f"{FIRMS_API_BASE}/{NASA_FIRMS_MAP_KEY.strip()}/VIIRS_SNPP_NRT/IND/1"
    
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(url)
            if res.status_code != 200:
                return {
                    "source": "NASA FIRMS",
                    "status": "error",
                    "message": f"NASA FIRMS returned status code {res.status_code}. Key may be invalid or rate-limited.",
                    "hotspots": [],
                    "key_configured": True,
                    "notice": "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires.",
                    "timestamp": timestamp
                }

            reader = csv.DictReader(io.StringIO(res.text))
            hotspots: List[Dict[str, Any]] = []
            for row in reader:
                try:
                    lat = float(row.get("latitude", 0))
                    lon = float(row.get("longitude", 0))
                    brightness = float(row.get("bright_ti4", 0))
                    confidence = row.get("confidence", "nominal")
                    acq_date = row.get("acq_date", "")
                    acq_time = row.get("acq_time", "")
                    hotspots.append({
                        "latitude": lat,
                        "longitude": lon,
                        "brightness_kelvin": brightness,
                        "confidence": confidence,
                        "acquisition_time": f"{acq_date} {acq_time}",
                        "satellite": "VIIRS SNPP",
                        "type": "Satellite Thermal Anomaly / Hotspot"
                    })
                except Exception:
                    continue

            return {
                "source": "NASA FIRMS",
                "status": "connected",
                "message": f"Retrieved {len(hotspots)} thermal anomalies detected over India in the past 24 hours.",
                "hotspots": hotspots[:100],  # Limit to top 100 recent
                "key_configured": True,
                "notice": "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires.",
                "timestamp": timestamp
            }
    except Exception as e:
        return {
            "source": "NASA FIRMS",
            "status": "error",
            "message": f"Error contacting NASA FIRMS API: {str(e)}",
            "hotspots": [],
            "key_configured": True,
            "notice": "Satellite thermal detections represent potential hotspots and thermal anomalies, not independently verified ground structural fires.",
            "timestamp": timestamp
        }
