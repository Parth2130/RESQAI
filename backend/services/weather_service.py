"""
RESQAI Weather and Environmental Intelligence Service
Connects to external meteorological APIs or provides clearly labelled simulation
feeds for local weather conditions around disaster zones.
"""
import os
from datetime import datetime
from typing import Dict, Any, Optional
import requests


def get_weather_data(lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
    """
    Retrieves weather telemetry for disaster command monitoring.
    Defaults to Pune, India region (lat: 18.5204, lon: 73.8567) if not specified.
    """
    target_lat = lat if lat is not None else 18.5204
    target_lon = lon if lon is not None else 73.8567

    api_key = os.getenv("OPENWEATHER_API_KEY")

    if api_key and api_key.strip():
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={target_lat}&lon={target_lon}&appid={api_key}&units=metric"
            resp = requests.get(url, timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                weather_desc = data["weather"][0]["description"].capitalize() if data.get("weather") else "Clear"
                rain_1h = data.get("rain", {}).get("1h", 0.0)
                temp = data["main"].get("temp", 28.0)
                wind_speed = data.get("wind", {}).get("speed", 3.5)
                humidity = data["main"].get("humidity", 65)

                return {
                    "is_simulated": False,
                    "source": "OpenWeatherMap API",
                    "latitude": target_lat,
                    "longitude": target_lon,
                    "location_name": data.get("name", "Field Coordinates"),
                    "condition": weather_desc,
                    "temperature_c": round(temp, 1),
                    "humidity_percent": humidity,
                    "wind_speed_kmh": round(wind_speed * 3.6, 1),
                    "precipitation_mm": rain_1h,
                    "severe_weather_alert": (rain_1h > 15.0 or wind_speed > 18.0),
                    "timestamp": datetime.utcnow().isoformat(),
                    "advisory": "Live API feed operational. Monitor precipitation runoff."
                }
        except Exception:
            # Fall back safely on error or timeout
            pass

    # High-fidelity realistic simulation fallback (Pune/Western Ghats monsoon/cyclonic baseline)
    return {
        "is_simulated": True,
        "source": "RESQAI Simulated Environmental Feed (Demo Mode)",
        "latitude": target_lat,
        "longitude": target_lon,
        "location_name": "Pune & Western Maharashtra Region",
        "condition": "Scattered Monsoon Showers & Gusty Winds",
        "temperature_c": 27.4,
        "humidity_percent": 82,
        "wind_speed_kmh": 24.5,
        "precipitation_mm": 18.2,
        "severe_weather_alert": True,
        "timestamp": datetime.utcnow().isoformat(),
        "advisory": "SIMULATION DEMO: Heavy rainfall reported in catchment sectors; flash-flood runoff risk active.",
        "note": "Configure OPENWEATHER_API_KEY in .env for live external satellite and radar integration."
    }
