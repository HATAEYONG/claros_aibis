@echo off
REM NetPlus MIS-AI Dashboard 시작 스크립트
REM 두 개의 터미널 창이 열립니다

echo.
echo ==========================================
echo   NetPlus MIS-AI Dashboard 시작
echo ==========================================
echo.

echo [1/2] Django Backend 서버 시작 중...
echo 터미널이 열리면 기다려주세요...
start cmd /k "cd /d %~dp0netplus-mis-backend && venv\Scripts\activate && python manage.py runserver 8000"

timeout /t 3 /nobreak > nul

echo [2/2] React Frontend 서버 시작 중...
echo 터미널이 열리면 기다려주세요...
start cmd /k "cd /d %~dp0netplus-mis-frontend && npm run dev"

timeout /t 2 /nobreak > nul

echo.
echo ==========================================
echo   서버가 시작되었습니다!
echo ==========================================
echo.
echo   Frontend: http://localhost:5173/
echo   Backend:  http://localhost:8000/api/
echo   Swagger:  http://localhost:8000/swagger/
echo.
echo   두 터미널 창을 닫으면 서버가 중지됩니다.
echo.
pause
