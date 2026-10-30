import httpx
from datetime import datetime
from typing import Dict, Any, List

SACHET_PORTAL_URL = "https://sachet.ndma.gov.in/"
# Official NDMA Public CAP alert feeds often require specialized CAP authentication or IP whitelisting
SACHET_PUBLIC_FEED_URL = "https://sachet.ndma.gov.in/cap_feed/api/v1/alerts"

async def fetch_ndma_alerts() -> Dict[str, Any]:
    """
    Queries NDMA SACHET for national disaster warnings.
    If the direct public endpoint is restricted or requires agency credentials,
    accurately communicates status without inventing fake alerts.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json, text/html, */*"
            }
            res = await client.get(SACHET_PUBLIC_FEED_URL, headers=headers)
            if res.status_code == 200:
                try:
                    data = res.json()
                    alerts_list = data if isinstance(data, list) else data.get("alerts", [])
                    return {
                        "source": "NDMA SACHET (National Disaster Alert Portal)",
                        "status": "connected",
                        "message": f"Successfully fetched {len(alerts_list)} active public alerts from NDMA SACHET.",
                        "portal_url": SACHET_PORTAL_URL,
                        "alerts": alerts_list,
                        "timestamp": timestamp
                    }
                except Exception:
                    pass
    except Exception:
        # Expected when government firewall restricts direct unauthenticated API access
        pass

    # Strictly follow guidelines: Do not forge fake alerts.
    return {
        "source": "NDMA SACHET (National Disaster Alert Portal)",
        "status": "unavailable",
        "message": "Automated direct machine feed from NDMA SACHET is currently restricted or requires government portal authorization. Please refer directly to the official SACHET portal for active national alerts.",
        "portal_url": SACHET_PORTAL_URL,
        "alerts": [],
        "timestamp": timestamp
    }
