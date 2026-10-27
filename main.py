"""
RESQAI Root Entrypoint for Production Web Hosting (Render, Railway, Fly.io)
Allows running both 'uvicorn main:app' and 'uvicorn backend.main:app'
"""
import sys
import os

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.main import app
