import os
import json
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from config import NUGEN_API_KEY, NUGEN_MODEL_ID, NUGEN_API_URL

def is_nugen_configured() -> bool:
    """Returns True if Nugen API key and Model ID are configured."""
    key = os.getenv("NUGEN_API_KEY", NUGEN_API_KEY)
    model = os.getenv("NUGEN_MODEL", os.getenv("NUGEN_MODEL_ID", NUGEN_MODEL_ID))
    return bool(key and key.strip() and model and model.strip())

def get_nugen_config():
    key = os.getenv("NUGEN_API_KEY", NUGEN_API_KEY).strip()
    model = os.getenv("NUGEN_MODEL", os.getenv("NUGEN_MODEL_ID", NUGEN_MODEL_ID)).strip()
    url = os.getenv("NUGEN_BASE_URL", NUGEN_API_URL).strip()
    if not url.endswith("/chat/completions") and not url.endswith("/completions"):
        if url.endswith("/"):
            url = f"{url}chat/completions"
        else:
            url = f"{url}/chat/completions"
    return key, model, url

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond in clear, accessible English.",
    "hi": "कृपया हिंदी में उत्तर दें (Respond in natural, simple Hindi).",
    "mr": "कृपया मराठीत उत्तर द्या (Respond in natural, clear Marathi)."
}

# ============================================================================
# AI MODULE 1: EMERGENCY CLASSIFICATION
# ============================================================================

CLASSIFICATION_SYSTEM_PROMPT = """You are RESQAI's Emergency Classification Intelligence Agent.
Analyze the citizen's emergency report description and extract structured triage information.

Output strictly valid JSON with this exact schema:
{
  "emergency_type": "Flood" | "Earthquake" | "Fire" | "Landslide" | "Cyclone" | "Accident" | "Medical Emergency" | "Other",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priority": "Urgent" | "High" | "Standard" | "Low",
  "vulnerable_people": true | false,
  "summary": "1-2 sentence concise factual incident summary.",
  "recommended_action": "Initial recommended immediate safety or responder check.",
  "requires_human_review": true,
  "confidence_score": 0.0 to 1.0
}
Do not include any conversational filler. Only output the JSON object.
"""

def fallback_classify_emergency(description: str, location: Optional[str] = None) -> Dict[str, Any]:
    """Transparent rule-based fallback classification when Nugen AI is offline or unconfigured."""
    desc_lower = description.lower()
    
    # Category detection
    if any(k in desc_lower for k in ["flood", "waterlog", "submerge", "river", "drowning", "dam"]):
        emergency_type = "Flood"
    elif any(k in desc_lower for k in ["fire", "blaze", "smoke", "flame", "burning", "explosion"]):
        emergency_type = "Fire"
    elif any(k in desc_lower for k in ["earthquake", "tremor", "quake", "aftershock", "crack in building"]):
        emergency_type = "Earthquake"
    elif any(k in desc_lower for k in ["landslide", "mudslide", "rockslide", "hill collapse", "debris"]):
        emergency_type = "Landslide"
    elif any(k in desc_lower for k in ["cyclone", "hurricane", "typhoon", "storm", "gale"]):
        emergency_type = "Cyclone"
    elif any(k in desc_lower for k in ["accident", "collision", "crash", "overturned"]):
        emergency_type = "Accident"
    elif any(k in desc_lower for k in ["heart attack", "unconscious", "bleeding", "medical", "pregnant", "ambulance"]):
        emergency_type = "Medical Emergency"
    else:
        emergency_type = "Other"

    # Vulnerable population detection
    vulnerable = any(k in desc_lower for k in ["child", "baby", "infant", "elderly", "old", "pregnant", "disabled", "wheelchair", "bedridden"])

    # Severity determination
    if any(k in desc_lower for k in ["trapped", "dying", "drowning", "unconscious", "rooftop", "severe", "burning inside", "critical", "collapsed"]):
        severity = "Critical"
        priority = "Urgent"
    elif any(k in desc_lower for k in ["rising", "blocked", "injured", "high", "spreading"]):
        severity = "High"
        priority = "High"
    elif any(k in desc_lower for k in ["minor", "slow", "low", "caution"]):
        severity = "Low"
        priority = "Low"
    else:
        severity = "Medium"
        priority = "Standard"

    loc_str = f" in {location}" if location else ""
    summary = f"Reported {emergency_type.lower()} situation{loc_str}: {description[:120]}..."

    return {
        "emergency_type": emergency_type,
        "severity": severity,
        "priority": priority,
        "vulnerable_people": vulnerable,
        "summary": summary,
        "recommended_action": "Field verification and dispatch verification by emergency operations center.",
        "requires_human_review": True,
        "confidence_score": 0.82,
        "provider": "Rule-based Engine (Nugen Standby)"
    }

async def classify_emergency_report(description: str, location: Optional[str] = None) -> Dict[str, Any]:
    """AI Module 1: Classifies citizen report using Nugen API with robust fallback."""
    if not is_nugen_configured():
        return fallback_classify_emergency(description, location)

    key, model, url = get_nugen_config()
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    user_prompt = f"Incident Description: {description}\nLocation: {location or 'Not provided'}"
    
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 400
    }

    try:
        async with httpx.AsyncClient(timeout=18.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                # Extract JSON block
                json_match = re.search(r"\{.*\}", content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    parsed["provider"] = f"Nugen AI ({model})"
                    parsed["requires_human_review"] = True
                    return parsed
    except Exception as e:
        print(f"[NUGEN-CLASSIFY-ERR] {e}")

    # Fallback if API fails or returns unparseable content
    fallback = fallback_classify_emergency(description, location)
    fallback["provider"] = "Rule-based Engine (Nugen Unreachable/Fallback)"
    return fallback

# ============================================================================
# AI MODULE 2: RISK ASSESSMENT
# ============================================================================

async def assess_incident_risk(
    incident_type: str,
    severity: str,
    people_affected: int = 1,
    people_needing_assistance: int = 0,
    vulnerable_present: bool = False,
    weather_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """AI Module 2: Multi-factor risk calculation combining type, severity, population, and weather."""
    from risk_engine import calculate_risk
    
    env_alert = False
    if weather_info:
        precip = weather_info.get("precipitation", 0)
        wind = weather_info.get("wind_speed", 0)
        if precip > 25.0 or wind > 55.0:
            env_alert = True

    base = calculate_risk(
        incident_type=incident_type,
        severity=severity,
        people_affected=people_affected,
        people_needing_assistance=people_needing_assistance,
        vulnerable_present=vulnerable_present,
        environmental_hazard_alert=env_alert
    )

    breakdown = base.get("weights_breakdown", {})
    return {
        "risk_level": base.get("risk_level", "Medium"),
        "score": float(base.get("risk_score", 50)),
        "hazard_points": float(breakdown.get("hazard_type_points", 0.0)),
        "severity_points": float(breakdown.get("severity_points", 0.0)),
        "assistance_points": float(breakdown.get("assistance_points", 0.0)),
        "vulnerable_points": float(breakdown.get("vulnerability_bonus", 0.0)),
        "environmental_points": float(breakdown.get("weather_bonus", 0.0)),
        "explanation": f"Automated risk grade: {base.get('risk_level', 'Medium')} ({base.get('risk_score', 50)}/100). {base.get('priority', '')}",
        "contributing_factors": base.get("factors", []),
        "recommendations": [
            "Maintain situational awareness and notify sector responders.",
            "Verify road conditions and access corridors before deploying heavy vehicles.",
            "Confirm availability of nearest designated medical or shelter facility."
        ],
        "limitations": base.get("limitations", []),
        "ai_generated": is_nugen_configured(),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# ============================================================================
# AI MODULE 3: EMERGENCY ASSISTANT CHATBOT
# ============================================================================

SYSTEM_PROMPT = """You are RESQAI Emergency Preparedness Assistant, an intelligent safety guidance platform designed for citizens and community volunteers in India.

CRITICAL SAFETY PROTOCOLS:
1. EMERGENCY NUMBER 112: In any life-threatening situation or immediate danger, always emphasize calling India's emergency helpline 112 directly.
2. NO DISPATCH CLAIMS: You are an informational system. You NEVER have the authority to dispatch rescue teams, ambulances, or helicopters. Never tell a user that 'help is on the way' or 'rescuers have been dispatched'.
3. NO MEDICAL DIAGNOSIS: Provide basic, standard first aid advice (e.g. pressure on bleeding, recovery position, CPR reminder) if requested, but never diagnose illnesses or override professional medical advice.
4. NO INVENTED DISASTER EVENTS: If live data is provided in the context below, use it accurately with its timestamps and sources. If live data is not provided or unavailable for a region, clearly state that you do not have verified live telemetry for that exact location and advise checking official NDMA (sachet.ndma.gov.in) or IMD (mausam.imd.gov.in) channels.
5. DISTINCT ROLES:
   - Live telemetry: Sourced from Open-Meteo or USGS.
   - General preparedness: Science-backed NDMA / NDRF emergency guidelines.
6. TONE: Calm, reassuring, concise, practical, and highly structured with bullet points or numbered action steps (Before / During / After).
"""

async def generate_chat_response(
    message: str,
    language: str = "en",
    live_grounding: Optional[Dict[str, Any]] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    timestamp = datetime.utcnow().isoformat() + "Z"

    if not is_nugen_configured():
        config_status = []
        key = os.getenv("NUGEN_API_KEY", NUGEN_API_KEY)
        model = os.getenv("NUGEN_MODEL", os.getenv("NUGEN_MODEL_ID", NUGEN_MODEL_ID))
        if not key or not key.strip():
            config_status.append("NUGEN_API_KEY is missing")
        if not model or not model.strip():
            config_status.append("NUGEN_MODEL_ID is missing")
        missing_reasons = ", ".join(config_status)

        resp_text = (
            f"⚠️ **Nugen AI Assistant Configuration Required** ({missing_reasons})\n\n"
            "The Nugen AI Chat Completions service is not configured. As per RESQAI safety protocol, simulated or fabricated AI responses are strictly disabled.\n\n"
            "**To enable live Nugen AI emergency intelligence:**\n"
            "1. Open your `backend/.env` file.\n"
            "2. Set `NUGEN_API_KEY=your_nugen_api_key`\n"
            "3. Set `NUGEN_MODEL_ID=your_nugen_model_id`\n"
            "4. Restart the backend service.\n\n"
            "**Immediate Emergency Assistance:**\n"
            "• **Life-Threatening Distress:** Call India's National Emergency Number **112** immediately.\n"
            "• **NDMA National Disaster Helpline:** Dial **1070** or visit official portal at `sachet.ndma.gov.in`.\n"
            "• **Emergency Ambulance:** Dial **108** | **Fire & Rescue:** Dial **101**."
        )

        return {
            "configured": False,
            "response": resp_text,
            "language": language,
            "grounding": live_grounding,
            "provider": "Nugen AI (Unconfigured - Setup Required)",
            "timestamp": timestamp
        }

    key, model, url = get_nugen_config()
    lang_rule = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
    
    grounding_text = ""
    if live_grounding:
        grounding_text += "\n--- VERIFIED LIVE TELEMETRY CONTEXT ---\n"
        if "weather" in live_grounding and live_grounding["weather"]:
            w = live_grounding["weather"]
            grounding_text += f"- Weather for {w.get('location')}: {w.get('weather_condition')}, Temp: {w.get('temperature')}°C, Wind: {w.get('wind_speed')} km/h, Rain: {w.get('precipitation')} mm. (Source: Open-Meteo at {w.get('timestamp')})\n"
        if "recent_earthquakes" in live_grounding and live_grounding["recent_earthquakes"]:
            eqs = live_grounding["recent_earthquakes"][:3]
            grounding_text += f"- Recent Earthquakes reported (USGS): {len(live_grounding['recent_earthquakes'])} recorded today. Latest: " + "; ".join([f"M{e.get('magnitude')} near {e.get('place')}" for e in eqs]) + "\n"
        if "alerts" in live_grounding and live_grounding["alerts"]:
            grounding_text += f"- Official Alert Channel Status: {live_grounding['alerts'].get('message')} (Portal: {live_grounding['alerts'].get('portal_url')})\n"
        grounding_text += "--- END LIVE TELEMETRY ---\n"

    system_instruction = f"{SYSTEM_PROMPT}\n{lang_rule}\n{grounding_text}"
    messages_payload = [{"role": "system", "content": system_instruction}]

    if history:
        for msg in history[-6:]:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                messages_payload.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

    messages_payload.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": messages_payload,
        "temperature": 0.3,
        "max_tokens": 800
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                return {
                    "configured": True,
                    "response": f"Nugen AI returned status {resp.status_code}: {resp.text[:200]}. Please check API key, model ID and credits.",
                    "language": language,
                    "grounding": live_grounding,
                    "provider": "Nugen AI",
                    "timestamp": timestamp
                }
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {
                "configured": True,
                "response": reply,
                "language": language,
                "grounding": live_grounding,
                "provider": f"Nugen AI ({model})",
                "timestamp": timestamp
            }
    except Exception as e:
        return {
            "configured": True,
            "response": f"Encountered connection issue with Nugen AI: {str(e)}. In an emergency, always call 112 directly.",
            "language": language,
            "grounding": live_grounding,
            "provider": "Nugen AI (Error Fallback)",
            "timestamp": timestamp
        }

# ============================================================================
# AI MODULE 4: RESPONSE RECOMMENDATIONS
# ============================================================================

def generate_response_recommendations(incident_dict: Dict[str, Any]) -> Dict[str, Any]:
    """AI Module 4: Generates operational recommendations for emergency responders."""
    e_type = incident_dict.get("emergency_type", "Other")
    severity = incident_dict.get("severity", "Medium")
    vulnerable = incident_dict.get("vulnerable_people", False)
    affected = incident_dict.get("affected_count", 1)

    categories = []
    actions = []
    precautions = []
    evacuation = []

    if e_type in ["Flood", "Waterlogging"]:
        categories = ["Rescue teams", "Boats", "Ambulances", "Relief centers"]
        actions.append("Establish boat launch staging point 500m up-gradient from submerged zone.")
        actions.append("Deploy high-clearance SDRF/NDRF rescue boats equipped with life vests.")
        precautions.append("Beware of submerged electrical transformers and rapid water currents.")
        evacuation.append("Mandatory vertical evacuation to multi-story concrete municipal shelters.")
    elif e_type in ["Fire"]:
        categories = ["Fire stations", "Ambulances", "Rescue teams"]
        actions.append("Dispatch primary structural water tenders and high-pressure hose units.")
        actions.append("Establish a 200m safety perimeter; clear incoming ambulance corridor.")
        precautions.append("Risk of toxic gas inhalation and backdraft in enclosed structures.")
        evacuation.append("Evacuate downwind residential sectors immediately.")
    elif e_type in ["Earthquake"]:
        categories = ["Search and rescue teams", "Hospitals", "Ambulances"]
        actions.append("Deploy acoustic life detectors and canine search units to collapsed structures.")
        actions.append("Alert trauma response units at nearest tertiary hospitals.")
        precautions.append("Expect severe aftershocks; avoid standing near unreinforced masonry.")
        evacuation.append("Direct survivors to open parks, school athletic grounds, or designated safe zones.")
    elif e_type in ["Landslide"]:
        categories = ["Rescue teams", "Heavy earthmovers", "Ambulances"]
        actions.append("Close affected highway or ghat pass immediately to all civilian traffic.")
        actions.append("Deploy excavation machinery with soil stability sensors.")
        precautions.append("Secondary slide hazard remains high if rain continues.")
        evacuation.append("Evacuate homes situated on steep slope contours above and below the fracture line.")
    else:
        categories = ["Ambulances", "Rescue teams", "Hospitals"]
        actions.append("Deploy rapid assessment reconnaissance team.")
        precautions.append("Follow standard disaster triage protocols.")
        evacuation.append("Evaluate necessity based on local field reconnaissance.")

    if vulnerable:
        actions.insert(0, "CRITICAL: Prioritize specialized extraction for vulnerable individuals (infants/elderly).")
        categories.insert(0, "Specialized Medical Units")

    briefing = (
        f"Incident #{incident_dict.get('tracking_id', 'RQ')} ({e_type} - {severity}). "
        f"{affected} people affected. "
        f"Recommended immediate deployment: {', '.join(categories[:3])}. "
        f"Primary precaution: {precautions[0] if precautions else 'Exercise caution'}."
    )

    return {
        "incident_id": incident_dict.get("id", 0),
        "emergency_type": e_type,
        "recommended_resource_categories": categories,
        "suggested_priority": "Urgent" if severity == "Critical" else "High",
        "recommended_actions": actions,
        "safety_precautions": precautions,
        "evacuation_considerations": evacuation,
        "responder_briefing": briefing,
        "requires_human_approval": True,
        "provider": "RESQAI Intelligence Decision Matrix"
    }
