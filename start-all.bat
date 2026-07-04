@echo off
REM Claros MIS-AI Dashboard 전체 서비스 시작
REM 백엔드(Django) + 프론트엔드(React) 자동 시작 및 브라우저 오픈

echo ============================================
echo Claros MIS-AI Dashboard 시작
echo ============================================
echo.

REM 브라우저 열기 함수
:OPEN_BROWSER
timeout /t 3 /nobreak >nul
echo 브라우저를 시작합니다...
start http://localhost:3000
start http://localhost:8000/api/docs/
goto :EOF

REM 백엔드 시작
cd claros-mis-backend

echo [1/2] Django 백엔드 서버 시작 (포트 8000)...
start "Django Backend" cmd /k "python manage.py runserver 8000"

REM 백엔드가 시작될 때까지 잠시 대기
timeout /t 5 /nobreak >nul

REM 프론트엔드 시작
echo [2/2] React 프론트엔드 서버 시작 (포트 3000)...
cd ..\claros-mis-frontend
start "React Frontend" cmd /k "npm run dev"

REM 브라우저 열기
call :OPEN_BROWSER

echo.
echo ============================================
echo 모든 서비스가 시작되었습니다.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/api/docs/
echo ============================================
echo.
pause
