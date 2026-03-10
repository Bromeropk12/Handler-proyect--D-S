@echo off
echo ========================================
echo Händler TrackSamples - Installation Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH.
    echo Please install Python 3.9 or higher and add it to PATH.
    pause
    exit /b 1
)

echo Python detected: %PYTHON_VERSION%
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Warning: Node.js is not installed or not in PATH.
    echo Frontend installation will be skipped.
    echo.
)

REM Create virtual environment
if not exist "backend\venv" (
    echo Creating virtual environment...
    python -m venv backend\venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

echo.

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
call backend\venv\Scripts\activate
if errorlevel 1 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)

pip install -r backend\requirements.txt
if errorlevel 1 (
    echo Error: Failed to install Python dependencies.
    pause
    exit /b 1
)

echo Python dependencies installed successfully.
echo.

REM Initialize database
echo Initializing database...
python scripts\database_init.py
if errorlevel 1 (
    echo Error: Failed to initialize database.
    pause
    exit /b 1
)

echo Database initialized successfully.
echo.

REM Install frontend dependencies (if Node.js is available)
if not errorlevel 1 (
    echo Installing frontend dependencies...
    cd frontend
    npm install
    if errorlevel 1 (
        echo Error: Failed to install frontend dependencies.
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Frontend dependencies installed successfully.
    echo.
)

echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure environment variables in .env file
echo 2. Start the backend server: python backend\main.py
echo 3. Start the frontend: npm start (in frontend directory)
echo 4. Access the application at http://localhost:3000
echo.
echo For more information, see README.md
echo.
pause