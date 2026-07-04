@echo off
chcp 65001 >nul
cls

echo ============================================
echo Claros MIS - Complete Auto Fix and Run
echo ============================================
echo.
echo This will:
echo  1. Delete old venv
echo  2. Create new venv
echo  3. Install all packages
echo  4. Run migrations
echo  5. Start server
echo.
echo Press any key to continue...
pause >nul

cd /d %~dp0

echo.
echo [Step 1/7] Deactivating old venv...
call deactivate 2>nul

echo [Step 2/7] Deleting old venv...
if exist "venv" (
    rmdir /s /q venv
    echo [OK] Old venv deleted
) else (
    echo [OK] No old venv found
)

echo.
echo [Step 3/7] Creating new venv...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create venv
    pause
    exit /b 1
)
echo [OK] New venv created

echo.
echo [Step 4/7] Activating venv...
call venv\Scripts\activate
echo [OK] venv activated

echo.
echo [Step 5/7] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo [OK] pip upgraded

echo.
echo [Step 6/7] Installing packages...
echo This may take a few minutes...
python -m pip install django djangorestframework django-cors-headers django-filter drf-yasg python-dotenv whitenoise --quiet
echo [OK] Core packages installed

if exist "requirements.txt" (
    echo Installing from requirements.txt...
    python -m pip install -r requirements.txt --quiet 2>nul
    echo [OK] requirements.txt processed
)

echo.
echo [Step 7/7] Running migrations...
python manage.py migrate --noinput
echo [OK] Migrations complete

if not exist "logs" (
    mkdir logs
    echo [OK] logs directory created
)

echo.
echo ============================================
echo Setup Complete! Starting server...
echo ============================================
echo.
echo Server will start in 3 seconds...
timeout /t 3 >nul
echo.
echo API Endpoints:
echo   http://localhost:8000/api/
echo   http://localhost:8000/swagger/
echo   http://localhost:8000/admin/
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 8000
