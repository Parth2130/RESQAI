"""
RESQAI Intelligent Dispatch Recommendation Engine
Evaluates capability-hazard match, spatial proximity (Haversine), capacity, and operational status.
Recommends and ranks suitable resources without automatic execution.
"""
import math
from typing import List, Dict, Any, Optional

# Resource-to-Disaster capability affinity matrix
TYPE_AFFINITY = {
    "Flood": ["Boat", "Rescue team", "Search-and-rescue unit", "Ambulance"],
    "Flash flood": ["Boat", "Search-and-rescue unit", "Rescue team", "Ambulance"],
    "Building collapse": ["Search-and-rescue unit", "Rescue team", "Ambulance", "Medical team"],
    "Fire": ["Fire-response team", "Rescue vehicle", "Ambulance", "Medical team"],
    "Landslide": ["Rescue team", "Rescue vehicle", "Search-and-rescue unit", "Ambulance"],
    "Earthquake": ["Search-and-rescue unit", "Medical team", "Rescue team", "Ambulance"],
    "Medical emergency": ["Ambulance", "Medical team"],
    "Severe weather": ["Rescue vehicle", "Relief supply vehicle", "Rescue team"],
    "Road blockage": ["Rescue vehicle", "Rescue team"],
    "Other": ["Rescue team", "Relief supply vehicle"]
}


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers between two GPS coordinates."""
    r = 6371.0  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)


def rank_resources_for_incident(
    incident: Dict[str, Any],
    candidate_resources: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Ranks candidates based on capability alignment, availability, and geographical proximity.
    Never recommends an unavailable or already-assigned resource as available.
    """
    recommendations = []
    inc_type = incident.get("incident_type", "Other")
    inc_lat = incident.get("latitude")
    inc_lon = incident.get("longitude")
    severity = incident.get("severity", "Medium")
    people_assist = incident.get("people_needing_assistance", 0)

    preferred_types = TYPE_AFFINITY.get(inc_type, ["Rescue team", "Ambulance"])

    for res in candidate_resources:
        # Check strict availability
        status = res.get("status", "Unavailable")
        is_available = (status == "Available")
        
        # Calculate suitability score
        base_score = 0.0
        reasons = []

        res_type = res.get("resource_type", "")
        if res_type in preferred_types:
            # Rank higher if top preference
            rank_idx = preferred_types.index(res_type)
            type_bonus = max(10, 40 - (rank_idx * 8))
            base_score += type_bonus
            reasons.append(f"Direct operational match for {inc_type} events (+{type_bonus} pts).")
        else:
            base_score += 10
            reasons.append(f"Secondary support capability for emergency incidents.")

        # Distance factor
        distance_km: Optional[float] = None
        res_lat = res.get("latitude")
        res_lon = res.get("longitude")

        if inc_lat is not None and inc_lon is not None and res_lat is not None and res_lon is not None:
            distance_km = haversine_distance(inc_lat, inc_lon, res_lat, res_lon)
            if distance_km <= 5.0:
                base_score += 35
                reasons.append(f"Immediate proximity ({distance_km} km away, estimated ETA 8-15m).")
            elif distance_km <= 15.0:
                base_score += 25
                reasons.append(f"Within primary response perimeter ({distance_km} km away).")
            elif distance_km <= 35.0:
                base_score += 15
                reasons.append(f"Regional response distance ({distance_km} km away).")
            else:
                base_score += 5
                reasons.append(f"Extended staging distance ({distance_km} km away).")
        else:
            reasons.append("Exact distance unavailable due to missing GPS coordinates.")
            base_score += 10

        # Capacity and severity match
        res_capacity = res.get("capacity", 1)
        if people_assist > 0:
            if res_capacity >= people_assist:
                base_score += 15
                reasons.append(f"Adequate team capacity ({res_capacity} seats/crew for {people_assist} victims).")
            else:
                base_score += 8
                reasons.append(f"Partial capacity ({res_capacity} crew); supplementary resources advised.")

        # Availability penalty or exclusion
        if not is_available:
            base_score = min(base_score * 0.2, 20)  # Heavily de-prioritize unavailable
            reasons.append(f"CURRENTLY UNAVAILABLE: status is '{status}'. Cannot be dispatched right now.")

        suitability_score = int(min(98, max(5, round(base_score))))

        recommendations.append({
            "resource_id": res["id"],
            "resource_code": res.get("resource_code", f"RES-{res['id']}"),
            "name": res["name"],
            "resource_type": res_type,
            "current_status": status,
            "is_available": is_available,
            "capacity": res_capacity,
            "distance_km": distance_km,
            "suitability_score": suitability_score,
            "recommendation_reasons": reasons
        })

    # Sort available resources first by suitability score descending, then unavailable
    recommendations.sort(
        key=lambda r: (1 if r["is_available"] else 0, r["suitability_score"]),
        reverse=True
    )
    return recommendations
