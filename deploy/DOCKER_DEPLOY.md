# Docker 배포 가이드 (AWS Lightsail)

## 1. AWS Lightsail 인스턴스 생성

1. **AWS Lightsail** 접속: https://lightsail.aws.amazon.com/
2. **Create instance** 클릭
3. 설정:
   - **Region**: Seoul (ap-northeast-2)
   - **Platform**: Linux/Unix
   - **Blueprint**: Ubuntu 22.04 LTS
   - **Instance plan**: $10/month (2GB RAM, 1 vCPU, 60GB SSD) - Docker 권장
4. **Change SSH key pair** → 기존 키 선택 또는 새로 생성
5. **Create instance**

## 2. 고정 IP 할당

1. Lightsail → **Networking** → **Create static IP**
2. Instance 선택 후 **Attach**
3. 이 IP로 접속: `http://your-static-ip`

## 3. SSH 접속

```bash
# Windows PowerShell
ssh -i "your-key.pem" ubuntu@your-static-ip

# 또는 Lightsail 콘솔에서 "Connect using SSH" 클릭
```

## 4. 원클릭 배포

```bash
# 방법 1: 배포 스크립트 다운로드 후 실행
curl -fsSL https://raw.githubusercontent.com/your-repo/main/deploy-docker.sh -o deploy-docker.sh
chmod +x deploy-docker.sh
sudo ./deploy-docker.sh

# 방법 2: 직접 실행 (스크립트 내용 붙여넣기)
# Lightsail SSH 콘솔에 스크립트 내용 복사 후 실행
```

## 5. 코드 업데이트 후 재배포

```bash
cd /home/ubuntu/netplus-mis

# Git 사용 시
git pull

# 또는 SCP로 파일 업로드 후
# docker compose build && docker compose up -d

docker compose build
docker compose up -d
```

## 6. 유용한 명령어

```bash
# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs -f

# 전체 재시작
docker compose restart

# 전체 중지
docker compose down

# 전체 삭제 (데이터 보존)
docker compose down --volumes

# DB 백업
docker exec netplus-postgres pg_dump -U netplus_user netplus_mis > backup.sql

# DB 복원
docker exec -i netplus-postgres psql -U netplus_user netplus_mis < backup.sql
```

## 7. 접속 URL

| 서비스 | URL |
|--------|-----|
| Frontend | http://your-static-ip/ |
| Backend API | http://your-static-ip/api/ |
| Swagger | http://your-static-ip/swagger/ |
| Django Admin | http://your-static-ip/admin/ |

## 8. 파일 구조

```
netplus-mis-ai-dashboard/
├── docker-compose.yml      # Docker Compose 설정
├── deploy-docker.sh        # 배포 스크립트
├── netplus-mis-backend/
│   ├── Dockerfile          # Backend Docker 이미지
│   └── config/
│       └── gunicorn.py    # Gunicorn 설정
└── netplus-mis-frontend/
    ├── Dockerfile          # Frontend Docker 이미지
    └── nginx.conf         # Nginx 설정
```

## 9. Docker Compose 서비스

| 서비스 | 설명 | 포트 |
|--------|------|------|
| db | PostgreSQL 15 | 5432 (내부) |
| backend | Django + Gunicorn | 8000 |
| frontend | React + Nginx | 80, 443 |

## 10. SSL 인증서 (Let's Encrypt)

```bash
# Certbot 컨테이너 추가
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

`docker-compose.ssl.yml`:
```yaml
services:
  frontend:
    environment:
      - CERTBOT_EMAIL=your@email.com
    ports:
      - "80:80"
      - "443:443"
```
