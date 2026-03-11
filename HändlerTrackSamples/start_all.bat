@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo  Handler TrackSamples - Iniciar Todo
echo ========================================
echo.

set "PROJECT_DIR=C:\Users\Briann\Downloads\Handler-proyect--D-S\HändlerTrackSamples"
set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

echo [*] Iniciando Backend (FastAPI) en puerto 8000...
start "Backend Server" cmd /k "cd /d "%BACKEND_DIR%" && ..\..\.venv\Scripts\activate && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 4 /nobreak >nul

echo [*] Iniciando Frontend (React + Electron)...
start "Frontend Dev" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ========================================
echo  Ambos servicios iniciados:
echo  - Backend: http://localhost:8000
echo  - Frontend: http://localhost:3000
echo ========================================
echo.
echo Los servicios se estan ejecutando en ventanas separadas.
pause
