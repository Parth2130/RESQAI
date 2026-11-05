"""
RESQAI Automated System Verification Suite
Delegates to comprehensive unit and integration tests covering:
- Health & Database connectivity
- Live Weather (Open-Meteo) & Earthquakes (USGS) integration
- NDMA Sachet & NASA FIRMS handlers
- AI Classification, Risk Assessment, and Safety Chat completions
- Citizen SOS reporting & tracking code generation
- Public privacy safeguards (no contact leak)
- Admin/Responder authentication & report lifecycle state transitions
- Smart routing & evacuation planning
- Operational analytics
"""
import sys
import unittest
from test_api import TestResqAIBackend

if __name__ == "__main__":
    unittest.main()
