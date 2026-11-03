import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env file from backend or root directory
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'resqai.db'}")

# Security & JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "resqai-super-secure-production-key-2026-disaster-response")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

# AI Assistant - Nugen AI
NUGEN_API_KEY = os.getenv("NUGEN_API_KEY", "")
NUGEN_MODEL_ID = os.getenv("NUGEN_MODEL", os.getenv("NUGEN_MODEL_ID", ""))
NUGEN_API_URL = os.getenv("NUGEN_BASE_URL", os.getenv("NUGEN_API_URL", "https://api.nugen.in/api/v3/inference/chat/completions"))

# NASA FIRMS (Satellite fire hotspots)
NASA_FIRMS_MAP_KEY = os.getenv("NASA_FIRMS_MAP_KEY", "")

# Default Admin Seed Credentials (if no admin exists in fresh DB)
INITIAL_ADMIN_EMAIL = os.getenv("INITIAL_ADMIN_EMAIL", "admin@resqai.in")
INITIAL_ADMIN_PASSWORD = os.getenv("INITIAL_ADMIN_PASSWORD", "ResqAdmin@2026")
INITIAL_ADMIN_NAME = os.getenv("INITIAL_ADMIN_NAME", "Emergency Control Officer")
