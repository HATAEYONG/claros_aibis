from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "change-me"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "apps.common",
    "apps.core",
    "apps.simulation",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = []
WSGI_APPLICATION = "config.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}
LANGUAGE_CODE = "ko-kr"
TIME_ZONE = "Asia/Seoul"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]

EVENT_HUB_URL = os.getenv("EVENT_HUB_URL", "http://localhost:8082")
AI_RISK_URL = os.getenv("AI_RISK_URL", "http://localhost:8200")
FORECAST_URL = os.getenv("FORECAST_URL", "http://localhost:8250")
ALERT_SERVICE_URL = os.getenv("ALERT_SERVICE_URL", "http://localhost:8300")
WORKFLOW_SERVICE_URL = os.getenv("WORKFLOW_SERVICE_URL", "http://localhost:8400")
OCPM_SERVICE_URL = os.getenv("OCPM_SERVICE_URL", "http://localhost:8500")
