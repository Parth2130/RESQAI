import httpx
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import NUGEN_API_KEY, NUGEN_MODEL_ID, NUGEN_API_URL

def is_nugen_configured() -> bool:
    return bool(NUGEN_API_KEY and NUGEN_API_KEY.strip() and NUGEN_MODEL_ID and NUGEN_MODEL_ID.strip())

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond in clear, accessible English.",
    "hi": "कृपया हिंदी में उत्तर दें (Respond in natural, simple Hindi).",
    "mr": "कृपया मराठीत उत्तर द्या (Respond in natural, clear Marathi)."
}

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
        return {
            "configured": False,
            "response": "AI Assistant is not configured. Please configure Nugen credentials (NUGEN_API_KEY and NUGEN_MODEL_ID in .env).",
            "language": language,
            "grounding": None,
            "provider": "Nugen AI (Unconfigured)",
            "timestamp": timestamp
        }

    lang_rule = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
    
    # Grounding context text
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

    # Append recent conversation history (up to last 6 messages)
    if history:
        for msg in history[-6:]:
            if msg.get("role") in ["user", "assistant"] and msg.get("content"):
                messages_payload.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

    messages_payload.append({"role": "user", "content": message})

    headers = {
        "Authorization": f"Bearer {NUGEN_API_KEY.strip()}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": NUGEN_MODEL_ID.strip(),
        "messages": messages_payload,
        "temperature": 0.3,
        "max_tokens": 800
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(NUGEN_API_URL, json=payload, headers=headers)
            if resp.status_code != 200:
                return {
                    "configured": True,
                    "response": f"Nugen AI returned status {resp.status_code}: {resp.text[:200]}. Please check your API key and model quota.",
                    "language": language,
                    "grounding": live_grounding,
                    "provider": "Nugen AI",
                    "timestamp": timestamp
                }

            data = resp.json()
            choices = data.get("choices", [])
            reply_content = ""
            if choices and "message" in choices[0]:
                reply_content = choices[0]["message"].get("content", "")
            elif "output" in data:
                reply_content = data["output"]
            else:
                reply_content = str(data)

            return {
                "configured": True,
                "response": reply_content,
                "language": language,
                "grounding": live_grounding,
                "provider": "Nugen AI",
                "timestamp": timestamp
            }
    except Exception as e:
        return {
            "configured": True,
            "response": f"Failed to connect to Nugen AI endpoint: {str(e)}. Please check your internet connection and API URL.",
            "language": language,
            "grounding": live_grounding,
            "provider": "Nugen AI",
            "timestamp": timestamp
        }
