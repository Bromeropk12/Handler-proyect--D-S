@echo off
echo ========================================
echo  Handler TrackSamples - Backend Server
echo ========================================
echo.

REM Verificar si Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado o no esta en el PATH
    pause
    exit /b 1
)

REM Verificar si las dependencias estan instaladas
pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install uvicorn fastapi pymysql python-dotenv bcrypt
)

echo Starting backend server...
echo.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
