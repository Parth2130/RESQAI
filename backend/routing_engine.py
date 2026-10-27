"""
RESQAI Hazard-Aware Routing Engine
Generates waypoint routes between dispatch origins and incident coordinates,
evaluating spatial proximity to reported hazards and identifying safe transit buffers.
"""
import math
from typing import Dict, Any, List, Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def generate_interpolated_waypoints(
    start: Tuple[float, float],
    end: Tuple[float, float],
    num_points: int = 8
) -> List[List[float]]:
    """
    Simulates a realistic road corridor route between start and destination
    by adding slight road-like offsets along the transit vector.
    """
    lat1, lon1 = start
    lat2, lon2 = end
    waypoints = [[round(lat1, 6), round(lon1, 6)]]

    for i in range(1, num_points):
        fraction = i / num_points
        # Intermediate point on line
        inter_lat = lat1 + fraction * (lat2 - lat1)
        inter_lon = lon1 + fraction * (lon2 - lon1)

        # Subtle road detour curve simulation (based on sine wave offset)
        curve_offset = math.sin(fraction * math.pi) * 0.0045 * (1 if (i % 2 == 0) else -0.8)
        waypoints.append([round(inter_lat + curve_offset, 6), round(inter_lon + (curve_offset * 0.6), 6)])

    waypoints.append([round(lat2, 6), round(lon2, 6)])
    return waypoints


def plan_hazard_aware_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    active_incidents: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes an estimated transit corridor, evaluates hazard proximity along the path,
    and returns waypoint coordinates and safety advisories.
    """
    crow_dist_km = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
    
    # Road tortuosity factor: real driving distance is usually 1.25 - 1.40x straight-line
    est_driving_km = round(crow_dist_km * 1.32, 2)
    
    # Average emergency response transit speed (40 km/h urban/suburban disaster setting)
    est_duration_minutes = max(3, round((est_driving_km / 38.0) * 60))

    # Generate waypoints
    waypoints = generate_interpolated_waypoints((origin_lat, origin_lng), (dest_lat, dest_lng))

    # Identify hazards near the transit corridor (within 1.5 km of any waypoint)
    encountered_hazards = []
    danger_detected = False

    for inc in active_incidents:
        inc_lat = inc.get("latitude")
        inc_lng = inc.get("longitude")
        if inc_lat is None or inc_lng is None:
            continue

        for pt in waypoints:
            dist_to_hazard = haversine_distance(pt[0], pt[1], inc_lat, inc_lng)
            if dist_to_hazard < 1.8:
                danger_detected = True
                hazard_info = {
                    "incident_id": inc.get("id"),
                    "title": inc.get("title", "Hazard"),
                    "type": inc.get("incident_type", "Disaster"),
                    "severity": inc.get("severity", "Medium"),
                    "distance_to_corridor_km": round(dist_to_hazard, 2)
                }
                if not any(h["incident_id"] == hazard_info["incident_id"] for h in encountered_hazards):
                    encountered_hazards.append(hazard_info)
                break

    advisories = []
    if danger_detected:
        advisories.append(f"WARNING: Route corridor passes within 1.8 km of {len(encountered_hazards)} known active hazard zone(s).")
        for h in encountered_hazards:
            advisories.append(f"Zone Alert: {h['type']} ({h['severity']}) - '{h['title']}' near transit path.")
        advisories.append("Precaution: Dispatch teams are instructed to maintain radio contact and carry alternate detour equipment.")
    else:
        advisories.append("Route corridor clear of recorded high-severity hazard nodes based on current database state.")

    # Explicit limitations
    limitations = [
        "Route geometry is calculated via waypoint interpolation with simulated road network tortuosity (factor 1.32x).",
        "Live satellite road obstructions and temporary flash-flood barricades are not guaranteed without municipal feed integration.",
        "Must be verified by vehicle commander prior to departure."
    ]

    return {
        "origin": {"lat": origin_lat, "lng": origin_lng},
        "destination": {"lat": dest_lat, "lng": dest_lng},
        "crow_distance_km": round(crow_dist_km, 2),
        "estimated_driving_distance_km": est_driving_km,
        "estimated_duration_minutes": est_duration_minutes,
        "waypoints": waypoints,
        "hazards_near_corridor": encountered_hazards,
        "is_safe_corridor": not danger_detected,
        "advisories": advisories,
        "limitations": limitations
    }
