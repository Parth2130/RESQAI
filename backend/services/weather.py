import time
import httpx
from datetime import datetime
from typing import Dict, Any, Optional

# In-memory cache: (lat_round, lon_round) -> (timestamp, data)
_CACHE: Dict[str, tuple] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

WMO_WEATHER_CODES = {
    0: ("Clear sky", "Safe"),
    1: ("Mainly clear", "Safe"),
    2: ("Partly cloudy", "Safe"),
    3: ("Overcast", "Moderate"),
    45: ("Fog", "Caution"),
    48: ("Depositing rime fog", "Caution"),
    51: ("Light drizzle", "Safe"),
    53: ("Moderate drizzle", "Moderate"),
    55: ("Dense drizzle", "Caution"),
    61: ("Slight rain", "Moderate"),
    63: ("Moderate rain", "Caution"),
    65: ("Heavy rain", "Warning"),
    66: ("Light freezing rain", "Warning"),
    67: ("Heavy freezing rain", "Critical"),
    71: ("Slight snow fall", "Caution"),
    73: ("Moderate snow fall", "Warning"),
    75: ("Heavy snow fall", "Critical"),
    77: ("Snow grains", "Caution"),
    80: ("Slight rain showers", "Moderate"),
    81: ("Moderate rain showers", "Caution"),
    82: ("Violent rain showers", "Critical"),
    85: ("Slight snow showers", "Caution"),
    86: ("Heavy snow showers", "Critical"),
    95: ("Thunderstorm", "Warning"),
    96: ("Thunderstorm with slight hail", "Critical"),
    99: ("Thunderstorm with heavy hail", "Critical"),
}

INDIAN_CITIES = {
    "delhi": (28.6139, 77.2090, "New Delhi, Delhi"),
    "mumbai": (19.0760, 72.8777, "Mumbai, Maharashtra"),
    "pune": (18.5204, 73.8567, "Pune, Maharashtra"),
    "kolkata": (22.5726, 88.3639, "Kolkata, West Bengal"),
    "chennai": (13.0827, 80.2707, "Chennai, Tamil Nadu"),
    "bengaluru": (12.9716, 77.5946, "Bengaluru, Karnataka"),
    "hyderabad": (17.3850, 78.4867, "Hyderabad, Telangana"),
    "ahmedabad": (23.0225, 72.5714, "Ahmedabad, Gujarat"),
    "patna": (25.5941, 85.1376, "Patna, Bihar"),
    "bhubaneswar": (20.2961, 85.8245, "Bhubaneswar, Odisha"),
    "guwahati": (26.1445, 91.7362, "Guwahati, Assam"),
    "shimla": (31.1048, 77.1734, "Shimla, Himachal Pradesh"),
    "dehradun": (30.3165, 78.0322, "Dehradun, Uttarakhand"),
    "kochi": (9.9312, 76.2673, "Kochi, Kerala"),
}

async def fetch_weather_data(lat: Optional[float] = None, lon: Optional[float] = None, city: Optional[str] = None) -> Dict[str, Any]:
    resolved_location_name = "India (Regional)"
    
    # Resolve city if provided
    if city and city.strip().lower() in INDIAN_CITIES:
        c_lat, c_lon, name = INDIAN_CITIES[city.strip().lower()]
        lat, lon = c_lat, c_lon
        resolved_location_name = name
    elif lat is None or lon is None:
        # Default to New Delhi if coordinates omitted
        lat, lon = 28.6139, 77.2090
        resolved_location_name = "New Delhi, India"
    else:
        resolved_location_name = f"Coordinates ({lat:.2f}°N, {lon:.2f}°E)"

    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now = time.time()
    if cache_key in _CACHE:
        cached_time, cached_data = _CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_data

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    current = data.get("current", {})
    daily = data.get("daily", {})

    w_code = current.get("weather_code", 0)
    cond_name, risk_level = WMO_WEATHER_CODES.get(w_code, ("Normal", "Safe"))

    # Format daily forecast
    daily_list = []
    dates = daily.get("time", [])
    max_temps = daily.get("temperature_2m_max", [])
    min_temps = daily.get("temperature_2m_min", [])
    precips = daily.get("precipitation_sum", [])
    codes = daily.get("weather_code", [])

    for i in range(min(5, len(dates))):
        d_code = codes[i] if i < len(codes) else 0
        d_name, _ = WMO_WEATHER_CODES.get(d_code, ("Clear", "Safe"))
        daily_list.append({
            "date": dates[i],
            "max_temp": max_temps[i] if i < len(max_temps) else None,
            "min_temp": min_temps[i] if i < len(min_temps) else None,
            "precipitation": precips[i] if i < len(precips) else 0,
            "condition": d_name
        })

    result = {
        "source": "Open-Meteo",
        "location": resolved_location_name,
        "latitude": lat,
        "longitude": lon,
        "temperature": current.get("temperature_2m", 0.0),
        "apparent_temperature": current.get("apparent_temperature"),
        "relative_humidity": current.get("relative_humidity_2m"),
        "wind_speed": current.get("wind_speed_10m", 0.0),
        "wind_direction": current.get("wind_direction_10m"),
        "precipitation": current.get("precipitation", 0.0),
        "weather_code": w_code,
        "weather_condition": cond_name,
        "risk_level": risk_level,
        "is_day": current.get("is_day", 1),
        "forecast_daily": daily_list,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "attribution": "Weather data provided by Open-Meteo under CC BY 4.0 (https://open-meteo.com/)"
    }

    _CACHE[cache_key] = (now, result)
    return result
