# 유한산업 MIS 백엔드

Django REST Framework 기반 제조업 통합 관리 시스템 API

## 기술 스택

- Python 3.11+
- Django 5.0
- Django REST Framework 3.14
- SQLite (개발) / PostgreSQL (프로덕션)

## 설치 방법
```bash
# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# 패키지 설치
pip install -r requirements.txt

# 환경변수 설정
copy .env.example .env

# 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver
```

## API 문서

- Swagger: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/
- Admin: http://localhost:8000/admin/

## 모듈 구조

- **financial**: 재무 관리
- **production**: 생산 관리
- **quality**: 품질 관리
- **sales**: 영업 관리
- **purchase**: 구매 관리
- **manufacturing**: 제조 관리
- **cost**: 원가 관리
- **accounting**: 관리 회계
- **esg**: ESG 관리
- **reports**: 분석 리포트

## 개발 가이드

### 새 앱 생성
```bash
python manage.py startapp app_name
```

### API 테스트
```bash
python manage.py test
```

## 라이선스

Proprietary - 유한산업
```

---

## ✅ **최종 폴더 구조**

위 스크립트 실행 후 다음과 같은 구조가 생성됩니다:
```
yuhan-mis-backend/
├── venv/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── financial/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py ✨ 새로 생성
│   ├── views.py
│   ├── urls.py ✨ 새로 생성
│   └── admin.py
├── production/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py ✨ 새로 생성
│   ├── views.py
│   ├── urls.py ✨ 새로 생성
│   └── admin.py
├── quality/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py
│   ├── serializers.py ✨ 새로 생성
│   ├── views.py
│   ├── urls.py ✨ 새로 생성
│   └── admin.py
├── utils/ ✨ 새로 생성
│   ├── __init__.py
│   ├── mixins.py
│   └── permissions.py
├── manage.py
├── requirements.txt
├── .env.example ✨ 새로 생성
├── .gitignore ✨ 새로 생성
└── README.md ✨ 새로 생성