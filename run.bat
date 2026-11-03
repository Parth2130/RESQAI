@echo off
TITLE RESQAI - Disaster Management Platform
echo ========================================================
echo   RESQAI: AI-Powered Emergency Management & Response
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python virtual environment...
if not exist "venv\Scripts\python.exe" (
    echo Python virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r backend\requirements.txt
) else (
    echo Virtual environment detected.
)

echo.
echo [2/3] Checking frontend build...
if not exist "frontend\dist\index.html" (
    echo Building frontend distribution...
    cd frontend
    call npm.cmd run build
    cd ..
) else (
    echo Frontend production build is ready.
)

echo.
echo [3/3] Starting RESQAI Server on http://localhost:8000 ...
echo - Web Application:  http://localhost:8000
echo - API Docs:         http://localhost:8000/docs
echo.
echo Press Ctrl+C in this terminal to stop the server.
echo ========================================================
echo.

call venv\Scripts\activate
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
