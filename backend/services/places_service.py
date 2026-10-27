"""
RESQAI Critical Facilities & Emergency Places Service
Provides queries for essential infrastructure (hospitals, fire stations, helipads).
"""
from typing import List, Dict, Any

CRITICAL_FACILITIES = [
    {
        "id": "FAC-01",
        "name": "Sassoon General Hospital & Trauma Centre",
        "type": "Hospital / Trauma",
        "location": "Near Pune Railway Station",
        "lat": 18.5284,
        "lng": 73.8742,
        "emergency_beds": 140,
        "helipad_access": True
    },
    {
        "id": "FAC-02",
        "name": "Pune Central Fire Brigade Headquarters",
        "type": "Fire & Rescue Station",
        "location": "Bhavani Peth, Pune",
        "lat": 18.5088,
        "lng": 73.8643,
        "emergency_beds": 0,
        "helipad_access": False
    },
    {
        "id": "FAC-03",
        "name": "Deenanath Mangeshkar Hospital",
        "type": "Multi-Speciality Hospital",
        "location": "Erandwane, Pune",
        "lat": 18.5020,
        "lng": 73.8290,
        "emergency_beds": 95,
        "helipad_access": True
    },
    {
        "id": "FAC-04",
        "name": "Aundh Chest Hospital & Emergency Wing",
        "type": "Hospital / Critical Care",
        "location": "Aundh, Pune",
        "lat": 18.5682,
        "lng": 73.8055,
        "emergency_beds": 60,
        "helipad_access": False
    }
]


def get_emergency_facilities() -> List[Dict[str, Any]]:
    """Returns directory of designated disaster trauma and fire facilities."""
    return CRITICAL_FACILITIES
