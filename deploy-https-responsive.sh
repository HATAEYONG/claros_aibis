#!/bin/bash
# ============================================================
# HTTPS Setup & Responsive Deployment Script
# Domain: bis.claros.co.kr
# Server: 3.36.114.58 (AWS Lightsail)
# ============================================================

set -e

SERVER_IP="3.36.114.58"
SERVER_USER="ubuntu"
KEY_PATH="C:/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem"
DOMAIN="bis.claros.co.kr"
ALT_DOMAIN="bi.claros.co.kr"
PROJECT_DIR="C:/work/claude_AIBIS/claros-mis-ai-dashboard"

echo "=========================================="
echo "  HTTPS + 반응형 최적화 배포"
echo "  도메인: $DOMAIN"
echo "  서버: $SERVER_IP"
echo "=========================================="

# Function to execute SSH command
ssh_exec() {
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# 1. Update frontend code with responsive optimizations
echo ""
echo "[1/8] 프론트엔드 반응형 최적화 파일 업로드..."

# Copy updated nginx-ssl.conf
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    "$PROJECT_DIR/claros-mis-frontend/nginx-ssl.conf" \
    $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/

# Copy updated Dockerfile
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    "$PROJECT_DIR/claros-mis-frontend/Dockerfile" \
    $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/

# Copy updated index.css
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no \
    "$PROJECT_DIR/claros-mis-frontend/src/index.css" \
    $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/src/

echo "프론트엔드 파일 업로드 완료!"

# 2. Install certbot and obtain SSL certificate
echo ""
echo "[2/8] SSL 인증서 설치..."

ssh_exec << 'ENDSSH'
# Update packages
sudo apt-get update -y

# Install certbot
sudo apt-get install -y certbot

# Check if certificate already exists
if [ -f /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ]; then
    echo "SSL 인증서가 이미 존재합니다. 갱신을 시도합니다..."
    sudo certbot renew --quiet
else
    echo "SSL 인증서 발급 중..."

    # Stop frontend to free port 80
    docker stop claros-frontend 2>/dev/null || true
    sleep 2

    # Get certificate
    sudo certbot certonly --standalone \
        -d bis.claros.co.kr \
        -d bi.claros.co.kr \
        --email admin@claros.co.kr \
        --agree-tos \
        --non-interactive \
        --keep-until-expiring
fi

# Create SSL directory
mkdir -p ~/claros-mis/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
sudo chmod 644 ~/claros-mis/ssl/*.pem

echo "SSL 인증서 준비 완료!"
ENDSSH

# 3. Setup SSL auto-renewal
echo ""
echo "[3/8] SSL 자동 갱신 설정..."

ssh_exec << 'ENDSSH'
# Create renewal script
sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'RENEWAL'
#!/bin/bash
# SSL certificate renewal script
LOG_FILE="/var/log/ssl-renewal.log"
DATE=\$(date '+%Y-%m-%d %H:%M:%S')

echo "[\$DATE] SSL 인증서 갱신 확인 시작..." >> \$LOG_FILE

# Renew certificate
sudo certbot renew --quiet --no-self-upgrade >> \$LOG_FILE 2>&1

# Copy new certificates
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
sudo chmod 644 ~/claros-mis/ssl/*.pem

# Restart frontend
cd ~/claros-mis
docker compose restart frontend >> \$LOG_FILE 2>&1

echo "[\$DATE] SSL 인증서 갱신 완료" >> \$LOG_FILE
RENEWAL

sudo chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (run twice daily)
(crontab -l 2>/dev/null | grep -v "renew-ssl"; echo "0 */12 * * * /usr/local/bin/renew-ssl.sh") | crontab -

echo "SSL 자동 갱신 설정 완료!"
ENDSSH

# 4. Update docker-compose with SSL support
echo ""
echo "[4/8] Docker Compose SSL 설정..."

ssh_exec << 'ENDSSH'
cd ~/claros-mis

# Create SSL override configuration
cat > docker-compose.ssl.yml << 'EOF'
services:
  frontend:
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    environment:
      - DOMAIN=bis.claros.co.kr
    restart: always
EOF

# Merge configurations
docker compose -f docker-compose.yml -f docker-compose.ssl.yml config > docker-compose.yml.tmp
mv docker-compose.yml.tmp docker-compose.yml

echo "Docker Compose SSL 설정 완료!"
ENDSSH

# 5. Rebuild frontend with SSL and responsive optimizations
echo ""
echo "[5/8] 프론트엔드 재빌드..."

ssh_exec << 'ENDSSH'
cd ~/claros-mis

# Stop frontend container
docker compose stop frontend 2>/dev/null || true

# Remove old frontend image
docker rmi claros-mis-frontend:latest 2>/dev/null || true

# Rebuild with new configuration
echo "프론트엔드 이미지 빌드 중..."
docker compose build --no-cache frontend

echo "프론트엔드 빌드 완료!"
ENDSSH

# 6. Update environment variables for HTTPS
echo ""
echo "[6/8] 환경 변수 설정..."

ssh_exec << 'ENDSSH'
cd ~/claros-mis

# Update .env with HTTPS settings
cat > .env << 'EOF'
SECRET_KEY=$(openssl rand -base64 50)
DEBUG=False
ALLOWED_HOSTS=bis.claros.co.kr,bi.claros.co.kr,3.36.114.58,.amazonaws.com,localhost,127.0.0.1
DB_ENGINE=django.db.backends.postgresql
DB_NAME=claros_mis
DB_USER=claros_user
DB_PASSWORD=claros_password_2024
DB_HOST=db
DB_PORT=5432
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://bis.claros.co.kr,https://bi.claros.co.kr,http://3.36.114.58
VITE_API_URL=/api
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
EOF

echo "환경 변수 설정 완료!"
ENDSSH

# 7. Start all services
echo ""
echo "[7/8] 서비스 시작..."

ssh_exec << 'ENDSSH'
cd ~/claros-mis

# Start all containers
docker compose up -d

# Wait for services to be ready
echo "서비스 시작 대기..."
sleep 20

# Check status
docker compose ps
ENDSSH

# 8. Verify deployment
echo ""
echo "[8/8] 배포 검증..."

echo ""
echo "HTTPS 접속 테스트..."
sleep 5

# Test HTTPS endpoint
echo "curl -k https://$DOMAIN/"
ssh_exec "curl -k https://$DOMAIN/ 2>/dev/null | head -15"

echo ""
echo "HTTP to HTTPS 리다이렉트 테스트..."
ssh_exec "curl -I http://$DOMAIN/ 2>/dev/null | head -5"

echo ""
echo "=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "접속 URL:"
echo "  HTTPS: https://$DOMAIN/"
echo "  HTTPS (대체): https://$ALT_DOMAIN/"
echo "  HTTP: 자동으로 HTTPS로 리다이렉트됩니다"
echo ""
echo "SSL 인증서 정보:"
ssh_exec "sudo certbot certificates 2>/dev/null | head -20"
echo ""
echo "반응형 최적화 적용 사항:"
echo "  ✓ 모바일 우반응형 디자인"
echo "  ✓ 터치 타겟 최적화 (44x44px)"
echo "  ✓ 반응형 타이포그래피"
echo "  ✓ 그리드 시스템 최적화"
echo "  ✓ 다크 모드 지원"
echo "  ✓ 프린트 스타일"
echo "  ✓ 접근성 향상 (키보드 네비게이션)"
echo ""
echo "유용한 명령어:"
echo "  로그 보기: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'cd ~/claros-mis && docker compose logs -f frontend'"
echo "  컨테이너 상태: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'cd ~/claros-mis && docker compose ps'"
echo "  SSL 갱신: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'sudo certbot renew'"
echo ""
