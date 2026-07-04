@echo off
REM Claros MIS Backend 시작 스크립트
REM 가상환경 생성, 패키지 설치, 마이그레이션, 서버 시작을 자동으로 수행

echo ============================================
echo Claros MIS Backend - 자동 시작
echo ============================================
echo.

REM Python 버전 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python이 설치되어 있지 않거나 PATH에 등록되지 않았습니다.
    echo Python 3.11 이상을 설치해주세요.
    pause
    exit /b 1
)

echo [1/6] Python 버전 확인...
python --version

REM 가상환경 확인 및 생성
if not exist "venv" (
    echo.
    echo [2/6] 가상환경이 없습니다. 새로 생성합니다...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] 가상환경 생성 실패
        pause
        exit /b 1
    )
    echo [SUCCESS] 가상환경 생성 완료
) else (
    echo [2/6] 가상환경이 이미 존재합니다.
)

REM 가상환경 활성화
echo.
echo [3/6] 가상환경 활성화...
call venv\Scripts\activate
if errorlevel 1 (
    echo [ERROR] 가상환경 활성화 실패
    pause
    exit /b 1
)

REM pip 업그레이드
echo.
echo [4/6] pip 업그레이드...
python -m pip install --upgrade pip --quiet

REM requirements.txt 설치
echo.
echo [5/6] 패키지 설치...
if exist "requirements.txt" (
    pip install -r requirements.txt --quiet
    if errorlevel 1 (
        echo [WARNING] 일부 패키지 설치 실패. 계속 진행합니다...
    ) else (
        echo [SUCCESS] 패키지 설치 완료
    )
) else (
    echo [WARNING] requirements.txt 파일이 없습니다.
)

REM 마이그레이션
echo.
echo [6/6] 데이터베이스 마이그레이션...
python manage.py migrate --noinput
if errorlevel 1 (
    echo [WARNING] 마이그레이션 실패. 서버 시작을 계속합니다...
)

REM logs 디렉토리 생성
if not exist "logs" (
    mkdir logs
)

REM 서버 시작
echo.
echo ============================================
echo Django 개발 서버 시작 중...
echo ============================================
echo.
echo API 엔드포인트:
echo   - API Root:    http://localhost:8000/api/
echo   - Swagger:     http://localhost:8000/swagger/
echo   - ReDoc:       http://localhost:8000/redoc/
echo   - Admin:       http://localhost:8000/admin/
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.

python manage.py runserver 8000
