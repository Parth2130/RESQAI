@echo off
TITLE RESQAI - Dev Server (Full Stack)
echo ========================================================
echo   RESQAI: Development Mode (Vite + FastAPI)
echo ========================================================
echo.

cd /d "%~dp0"

echo Starting Backend Server on http://localhost:8000 ...
start "RESQAI Backend (FastAPI)" cmd /k "cd /d %~dp0\backend && ..\venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

echo Starting Frontend Server on http://localhost:5173 ...
start "RESQAI Frontend (Vite)" cmd /k "cd /d %~dp0\frontend && npm.cmd run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000
echo - Swagger:  http://localhost:8000/docs
echo ========================================================
