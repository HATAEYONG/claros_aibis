@echo off
echo ========================================
echo   완전 자동 수정
echo ========================================
echo.

echo [1/8] Python 확인...
python --version
echo.

echo [2/8] 가상환경 활성화...
call venv\Scripts\activate.bat
echo.

echo [3/8] pip 업그레이드...
python -m pip install --upgrade pip --quiet
echo.

echo [4/8] 패키지 설치...
pip install python-json-logger==2.0.7 --quiet
pip install django-prometheus==2.3.1 --quiet
pip install structlog==24.1.0 --quiet
pip install psutil==5.9.7 --quiet
echo.

echo [5/8] utils 디렉토리 생성...
if not exist "utils" mkdir utils
echo """Utility modules""" > utils\__init__.py
echo.

echo [6/8] logging_config.py 생성...
(
echo """Structured logging"""
echo import logging
echo from pythonjsonlogger.jsonlogger import JsonFormatter
echo.
echo class StructuredFormatter(JsonFormatter^):
echo     def add_fields(self, log_record, record, message_dict^):
echo         super(^).add_fields(log_record, record, message_dict^)
echo         log_record['app'] = 'erp-mis-ai'
) > utils\logging_config.py
echo.

echo [7/8] logs 디렉토리 생성...
if not exist "logs" mkdir logs
echo.

echo [8/8] 완료!
echo.
echo ========================================
echo   Django 서버 시작
echo ========================================
echo.

python manage.py runserver

pause
