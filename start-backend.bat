@echo off
REM Django Backend만 시작

cd /d %~dp0netplus-mis-backend
call venv\Scripts\activate
python manage.py runserver 8000
