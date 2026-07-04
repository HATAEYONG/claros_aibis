# HTTPS 및 반응형 최적화 배포 가이드

## 개요
- **도메인**: bis.claros.co.kr (대체: bi.claros.co.kr)
- **서버**: 3.36.114.58 (AWS Lightsail ap-northeast-2)
- **목표**: HTTPS 설정 및 반응형 디자인 최적화

## 사전 준비

### 1. 로컬 파일 변경 완료
✅ `claros-mis-frontend/nginx-ssl.conf` - HTTPS 설정 추가
✅ `claros-mis-frontend/Dockerfile` - SSL 포트 추가
✅ `claros-mis-frontend/src/index.css` - 반응형 최적화

### 2. 배포 스크립트 생성
✅ `setup-https.sh` - SSL 설정 스크립트
✅ `deploy-https-responsive.sh` - 전체 배포 스크립트

## 배포 방법

### 방법 1: 자동 배포 스크립트 사용 (권장)

```bash
# Git Bash 또는 WSL에서 실행
cd C:/work/claude_AIBIS/claros-mis-ai-dashboard
bash deploy-https-responsive.sh
```

### 방법 2: 수동 배포

#### 1단계: 서버 접속
```bash
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58
```

#### 2단계: SSL 인증서 발급
```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install -y certbot

# Frontend 컨테이너 중지 (포트 80 확보)
docker stop claros-frontend

# SSL 인증서 발급
sudo certbot certonly --standalone \
  -d bis.claros.co.kr \
  -d bi.claros.co.kr \
  --email admin@claros.co.kr \
  --agree-tos \
  --non-interactive
```

#### 3단계: SSL 인증서 복사
```bash
# SSL 디렉토리 생성
mkdir -p ~/claros-mis/ssl

# 인증서 복사
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
sudo chmod 644 ~/claros-mis/ssl/*.pem
```

#### 4단계: 업데이트된 파일 업로드 (로컬에서)
```bash
# nginx-ssl.conf 업로드
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" \
  C:/work/claude_AIBIS/claros-mis-ai-dashboard/claros-mis-frontend/nginx-ssl.conf \
  ubuntu@3.36.114.58:~/claros-mis/claros-mis-frontend/

# Dockerfile 업로드
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" \
  C:/work/claude_AIBIS/claros-mis-ai-dashboard/claros-mis-frontend/Dockerfile \
  ubuntu@3.36.114.58:~/claros-mis/claros-mis-frontend/

# index.css 업로드
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" \
  C:/work/claude_AIBIS/claros-mis-ai-dashboard/claros-mis-frontend/src/index.css \
  ubuntu@3.36.114.58:~/claros-mis/claros-mis-frontend/src/
```

#### 5단계: Docker Compose SSL 설정 (서버에서)
```bash
cd ~/claros-mis

# SSL 오버라이드 설정 생성
cat > docker-compose.ssl.yml << 'EOF'
services:
  frontend:
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
EOF

# 설정 병합
docker compose -f docker-compose.yml -f docker-compose.ssl.yml config > docker-compose.yml.tmp
mv docker-compose.yml.tmp docker-compose.yml
```

#### 6단계: 환경 변수 업데이트
```bash
cd ~/claros-mis

cat > .env << 'EOF'
SECRET_KEY=$(openssl rand -base64 50)
DEBUG=False
ALLOWED_HOSTS=bis.claros.co.kr,bi.claros.co.kr,3.36.114.58,.amazonaws.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password_2024
DB_HOST=db
DB_PORT=5432
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://bis.claros.co.kr,https://bi.claros.co.kr
VITE_API_URL=/api
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
EOF
```

#### 7단계: Frontend 재빌드 및 시작
```bash
cd ~/claros-mis

# Frontend 중지
docker compose stop frontend

# 기존 이미지 삭제
docker rmi claros-mis-frontend:latest 2>/dev/null || true

# 재빌드
docker compose build --no-cache frontend

# 시작
docker compose up -d frontend
```

#### 8단계: SSL 자동 갱신 설정
```bash
# 갱신 스크립트 생성
sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'EOF'
#!/bin/bash
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
chmod 644 ~/claros-mis/ssl/*.pem
cd ~/claros-mis && docker compose restart frontend
EOF

sudo chmod +x /usr/local/bin/renew-ssl.sh

# 크론 작업 추가 (12시간마다)
(crontab -l 2>/dev/null | grep -v "renew-ssl"; echo "0 */12 * * * /usr/local/bin/renew-ssl.sh") | crontab -
```

## SSL 자동 갱신 확인

```bash
# 인증서 정보 확인
sudo certbot certificates

# 갱신 테스트
sudo certbot renew --dry-run

# 갱신 로그 확인
tail -f /var/log/ssl-renewal.log
```

## 반응형 최적화 적용 사항

### 모바일 최적화
- ✅ 모바일 우반응형 디자인 (Mobile-first)
- ✅ 터치 타겟 44x44px 최소 크기
- ✅ 스크롤 최적화 (iOS bounce scroll 제어)
- ✅ Safe Area 지원 (노치 디스플레이)

### 반응형 그리드
- ✅ 카드 그리드: 1 → 2 → 3 → 4열
- ✅ KPI 그리드: 1 → 2 → 4열
- ✅ 플렉스 랩: 모바일 → 태블릿 → 데스크톱

### 타이포그래피
- ✅ 반응형 폰트 크기
- ✅ 줄 높이 최적화
- ✅ 가독성 향상

### 추가 기능
- ✅ 다크 모드 지원
- ✅ 프린트 스타일
- ✅ 키보드 네비게이션 (focus-visible)
- ✅ 프로그레시브 로딩 상태

## 검증

### HTTPS 확인
```bash
# HTTPS 접속 테스트
curl -k https://bis.claros.co.kr/

# HTTP → HTTPS 리다이렉트 확인
curl -I http://bis.claros.co.kr/
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://bis.claros.co.kr/
```

### 반응형 확인
1. 브라우저 개발자 도구 (F12) 열기
2. 반응형 디자인 모드 (Ctrl+Shift+M)
3. 다양한 화면 크기에서 확인:
   - 모바일: 375px, 414px
   - 태블릿: 768px, 1024px
   - 데스크톱: 1920px

## 문제 해결

### SSL 인증서 오류
```bash
# 인증서 삭제 후 재발급
sudo certbot delete --cert-name bis.claros.co.kr
sudo certbot certonly --standalone -d bis.claros.co.kr
```

### Frontend 시작 실패
```bash
# 로그 확인
docker compose logs frontend

# SSL 파일 확인
ls -la ~/claros-mis/ssl/

# Nginx 설정 테스트
docker exec claros-frontend nginx -t
```

### CORS 오류
```bash
# 환경 변수 확인
cat ~/claros-mis/.env | grep CORS

# Backend 재시작
docker compose restart backend
```

## URL 정보

- **HTTPS 메인**: https://bis.claros.co.kr/
- **HTTPS 대체**: https://bi.claros.co.kr/
- **자동 리다이렉트**: http:// → https://

## 유용한 명령어

```bash
# 컨테이너 상태 확인
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58 'cd ~/claros-mis && docker compose ps'

# 실시간 로그 보기
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58 'cd ~/claros-mis && docker compose logs -f'

# SSL 인증서 갱신
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58 'sudo certbot renew'

# Frontend 재시작
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58 'cd ~/claros-mis && docker compose restart frontend'
```
