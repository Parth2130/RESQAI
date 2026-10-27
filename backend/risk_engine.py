"""
RESQAI Explainable Risk Assessment Engine
Calculates risk scores (0-100), severity levels, prioritized recommendations,
contributing factors, and uncertainty limitations based on situational inputs.
"""
from typing import Dict, Any, List


# Base risk weights per disaster type reflecting immediate life-safety peril
INCIDENT_TYPE_WEIGHTS = {
    "Building collapse": 38,
    "Flash flood": 35,
    "Flood": 30,
    "Cyclone": 32,
    "Earthquake": 34,
    "Fire": 32,
    "Landslide": 30,
    "Medical emergency": 26,
    "Severe weather": 20,
    "Road blockage": 15,
    "Other": 12
}

# Reported severity base points
SEVERITY_WEIGHTS = {
    "Critical": 35,
    "High": 25,
    "Medium": 15,
    "Low": 5
}


def calculate_risk(
    incident_type: str,
    severity: str,
    people_affected: int = 0,
    people_needing_assistance: int = 0,
    has_coordinates: bool = True,
    vulnerable_present: bool = False,
    environmental_hazard_alert: bool = False
) -> Dict[str, Any]:
    """
    Computes an explainable, bounded risk score (0-100) with factor breakdowns
    and operational limitation warnings.
    """
    score = 0.0
    factors: List[str] = []
    limitations: List[str] = []
    breakdown: Dict[str, Any] = {}

    # 1. Disaster Hazard Type Factor (Max 35 pts)
    type_key = incident_type.strip() if incident_type else "Other"
    type_score = INCIDENT_TYPE_WEIGHTS.get(type_key, 15)
    score += type_score
    factors.append(f"Hazard Category: '{type_key}' contributes {type_score} base hazard points.")
    breakdown["hazard_type_points"] = type_score

    # 2. Reported Severity Factor (Max 35 pts)
    sev_key = severity.capitalize() if severity else "Medium"
    sev_score = SEVERITY_WEIGHTS.get(sev_key, 15)
    score += sev_score
    factors.append(f"Initial Severity Grade: '{sev_key}' adds {sev_score} points to urgency.")
    breakdown["severity_points"] = sev_score

    # 3. People Needing Immediate Assistance Factor (Max 20 pts)
    # 0 -> 0, 1-3 -> 8, 4-10 -> 14, 11+ -> 20
    p_assist = max(0, people_needing_assistance)
    if p_assist == 0:
        assist_score = 0
    elif p_assist <= 3:
        assist_score = 8
        factors.append(f"Immediate Rescue Need: {p_assist} individual(s) trapped or needing rescue (+8 pts).")
    elif p_assist <= 10:
        assist_score = 14
        factors.append(f"Substantial Rescue Need: {p_assist} individuals in immediate danger (+14 pts).")
    else:
        assist_score = 20
        factors.append(f"Mass Casualty Threat: {p_assist} individuals requiring urgent extraction (+20 pts).")
    score += assist_score
    breakdown["assistance_points"] = assist_score

    # 4. Total People Affected Factor (Max 10 pts)
    p_affected = max(0, people_affected)
    if p_affected > 50:
        affected_score = 10
        factors.append(f"Large-scale impact zone: Over 50 people affected (+10 pts).")
    elif p_affected > 15:
        affected_score = 7
        factors.append(f"Moderate impact zone: {p_affected} people affected (+7 pts).")
    elif p_affected > 0:
        affected_score = 3
        factors.append(f"Localized impact: {p_affected} people affected (+3 pts).")
    else:
        affected_score = 0
    score += affected_score
    breakdown["affected_points"] = affected_score

    # 5. Modifiers: Vulnerable groups & Environmental triggers (Up to 10 pts bonus, capped total)
    if vulnerable_present:
        score += 5
        factors.append("Vulnerable Demographic Present: Elderly, children, or mobility-impaired residents noted (+5 pts).")
        breakdown["vulnerability_bonus"] = 5

    if environmental_hazard_alert:
        score += 5
        factors.append("Active Meteorological Advisory: Compounding weather alerts in the sector (+5 pts).")
        breakdown["weather_bonus"] = 5

    # 6. Bounding and Clamping (Strict 0 to 100)
    final_score = int(min(100, max(5, round(score))))

    # 7. Categorization
    if final_score >= 75:
        risk_level = "Critical"
        priority = "Immediate review & Tier-1 Dispatch"
    elif final_score >= 50:
        risk_level = "High"
        priority = "High priority dispatch within 15 mins"
    elif final_score >= 25:
        risk_level = "Medium"
        priority = "Standard priority response & monitoring"
    else:
        risk_level = "Low"
        priority = "Routine assessment / Community assistance"

    # 8. Transparent Limitations & Missing Data Audits
    if not has_coordinates:
        limitations.append("Precise geolocation missing; dispatch radius and spatial hazard mapping cannot be verified.")
    limitations.append("Initial assessment is based on unverified field reports; on-scene triage confirmation required.")
    limitations.append("No real-time drone or satellite telemetry linked to this record.")

    return {
        "risk_score": final_score,
        "risk_level": risk_level,
        "priority": priority,
        "factors": factors,
        "limitations": limitations,
        "weights_breakdown": breakdown
    }
