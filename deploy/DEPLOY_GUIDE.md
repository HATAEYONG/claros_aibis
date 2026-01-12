# AWS Lightsail 배포 가이드

## 1. 사전 준비

### 1.1 AWS Lightsail 인스턴스 생성

1. AWS Lightsail 접속: https://lightsail.aws.amazon.com/
2. **Create instance** 클릭
3. 설정:
   - **Region**: Seoul (ap-northeast-2)
   - **Platform**: Linux/Unix
   - **Blueprint**: Ubuntu 22.04 LTS
   - **Plan**: $5/month (1GB RAM, 1 vCPU, 40GB SSD)
4. 인스턴스 이름: `netplus-mis-dashboard`
5. **Create instance** 클릭

### 1.2 로컬에서 준비할 파일

배포에 필요한 파일들을 S3나 SCP로 업로드:

```
netplus-mis-ai-dashboard/
├── netplus-mis-backend/     # Django 백엔드 전체
├── netplus-mis-frontend/    # React 프론트엔드 전체
└── deploy/                  # 배포 설정 파일
    ├── deploy.sh            # 전체 배포 스크립트
    ├── deploy-backend.sh    # 백엔드만 재배포
    ├── deploy-frontend.sh   # 프론트엔드만 재배포
    ├── gunicorn.service     # systemd 서비스
    └── nginx.conf           # Nginx 설정
```

---

## 2. 배포 방법 1: 자동 배포 스크립트

### 2.1 파일 업로드 (SCP 사용)

```bash
# 로컬 Windows PowerShell에서
scp -r -i "your-key.pem" netplus-mis-backend ubuntu@your-lightsail-ip:/home/ubuntu/
scp -r -i "your-key.pem" netplus-mis-frontend ubuntu@your-lightsail-ip:/home/ubuntu/
scp -r -i "your-key.pem" deploy ubuntu@your-lightsail-ip:/home/ubuntu/
```

### 2.2 SSH 접속

```bash
ssh -i "your-key.pem" ubuntu@your-lightsail-ip
```

### 2.3 배포 스크립트 실행

```bash
cd /home/ubuntu/deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

---

## 3. 배포 방법 2: 수동 배포

### 3.1 필수 패키지 설치

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib libpq-dev nodejs npm
```

### 3.2 PostgreSQL 설정

```bash
sudo -u postgres psql
```

```sql
CREATE USER netplus_user WITH PASSWORD 'your_password';
CREATE DATABASE netplus_mis OWNER netplus_user;
GRANT ALL PRIVILEGES ON DATABASE netplus_mis TO netplus_user;
\q
```

### 3.3 Backend 배포

```bash
# 디렉토리 생성
sudo mkdir -p /var/www/netplus-mis/backend
sudo mkdir -p /var/www/netplus-mis/venv

# 파일 복사
sudo cp -r /home/ubuntu/netplus-mis-backend/* /var/www/netplus-mis/backend/

# 가상환경 생성
python3 -m venv /var/www/netplus-mis/venv
source /var/www/netplus-mis/venv/bin/activate

# 패키지 설치
pip install -r /var/www/netplus-mis/backend/requirements.txt

# 환경변수 설정
cd /var/www/netplus-mis/backend
cp .env.production .env
nano .env  # 비밀키 등 수정

# Django 설정
python manage.py collectstatic --noinput
python manage.py migrate

# 권한 설정
sudo chown -R www-data:www-data /var/www/netplus-mis
```

### 3.4 Frontend 배포

```bash
sudo mkdir -p /var/www/netplus-mis/frontend
sudo cp -r /home/ubuntu/netplus-mis-frontend/* /var/www/netplus-mis/frontend/
cd /var/www/netplus-mis/frontend
npm install
npm run build
sudo chown -R www-data:www-data /var/www/netplus-mis/frontend
```

### 3.5 Gunicorn 서비스 설정

```bash
# 서비스 파일 복사
sudo cp /home/ubuntu/deploy/gunicorn.service /etc/systemd/system/netplus-mis.service

# 서비스 시작
sudo systemctl daemon-reload
sudo systemctl enable netplus-mis
sudo systemctl start netplus-mis
sudo systemctl status netplus-mis
```

### 3.6 Nginx 설정

```bash
# 설정 파일 복사
sudo cp /home/ubuntu/deploy/nginx.conf /etc/nginx/sites-available/netplus-mis

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/netplus-mis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

### 3.7 방화벽 설정

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 4. 환경변수 설정

### Backend (.env)

```bash
sudo nano /var/www/netplus-mis/backend/.env
```

```env
SECRET_KEY=your-random-secret-key-min-50-chars
DEBUG=False
ALLOWED_HOSTS=your-ip-address,.amazonaws.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=netplus_mis
DB_USER=netplus_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# CORS (프론트엔드 도메인)
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://your-ip-address,https://your-domain.com
```

### Frontend (.env.production)

```bash
sudo nano /var/www/netplus-mis/frontend/.env.production
```

```env
VITE_API_URL=http://your-ip-address
# 또는 도메인 사용: VITE_API_URL=https://your-domain.com
```

빌드 시:
```bash
npm run build
```

---

## 5. 코드 수정 후 재배포

### Backend만 수정한 경우

```bash
ssh ubuntu@your-lightsail-ip
cd /home/ubuntu/deploy
sudo ./deploy-backend.sh
```

### Frontend만 수정한 경우

```bash
ssh ubuntu@your-lightsail-ip
cd /home/ubuntu/deploy
sudo ./deploy-frontend.sh
```

---

## 6. 서비스 관리 명령어

```bash
# Gunicorn 상태
sudo systemctl status netplus-mis
sudo systemctl restart netplus-mis
sudo systemctl stop netplus-mis
sudo systemctl start netplus-mis

# Nginx 상태
sudo systemctl status nginx
sudo systemctl restart nginx

# 로그 확인
sudo journalctl -u netplus-mis -f
sudo tail -f /var/log/nginx/netplus-mis-error.log
```

---

## 7. 도메인 설정 (선택)

### Route 53에서 도메인 연결

1. Route 53 접속
2. Hosted Zone 생성
3. A Record 생성: `your-domain.com` → Lightsail IP
4. Nginx 설정 수정:

```nginx
server_name your-domain.com www.your-domain.com;
```

### SSL 인증서 (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 8. 접속 확인

| 서비스 | URL |
|--------|-----|
| Frontend | http://your-ip/ |
| Backend API | http://your-ip/api/ |
| Swagger | http://your-ip/swagger/ |
| Django Admin | http://your-ip/admin/ |

---

## 9. 문제 해결

### Gunicorn이 시작하지 않음

```bash
sudo journalctl -u netplus-mis -n 50
```

### Nginx 502 Bad Gateway

```bash
# Gunicorn이 실행 중인지 확인
sudo systemctl status netplus-mis

# 포트 확인
sudo netstat -tlnp | grep 8000
```

### 정적 파일 로드 실패

```bash
cd /var/www/netplus-mis/backend
source /var/www/netplus-mis/venv/bin/activate
python manage.py collectstatic --noinput
sudo chown -R www-data:www-data staticfiles/
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL 실행 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U netplus_user -d netplus_mis -h localhost
```

---

## 10. 비용 절감 팁

1. **개발 완료 후 인스턴스 중지**: 사용하지 않을 때 Stop
2. **스냅샷 활용**: 배포 완료 후 스냅샷 생성
3. **스케일링**: 트래픽에 따라 플랜 변경

---

**문서 작성**: NetPlus MIS-AI Dashboard 개발팀
**최종 수정일**: 2024-12-26
