#!/bin/bash
# ============================================================
# HTTPS Setup Script for bis.claros.co.kr
# Using Let's Encrypt with certbot
# ============================================================

set -e

SERVER_IP="3.36.114.58"
SERVER_USER="ubuntu"
KEY_PATH="C:/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem"
DOMAIN="bis.claros.co.kr"
EMAIL="admin@claros.co.kr"

echo "=========================================="
echo "  HTTPS 설정 시작"
echo "  도메인: $DOMAIN"
echo "  서버: $SERVER_IP"
echo "=========================================="

# 1. Install certbot and get initial certificate
echo ""
echo "[1/5] Certbot 설치 및 SSL 인증서 발급..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Update packages
sudo apt-get update -y

# Install certbot and nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# Create temporary directory for standalone challenge
sudo mkdir -p /var/www/certbot

# Stop nginx to free up port 80
sudo docker stop claros-frontend 2>/dev/null || true

# Get certificate using standalone mode
sudo certbot certonly --standalone \
    -d bis.claros.co.kr \
    -d bi.claros.co.kr \
    --email admin@claros.co.kr \
    --agree-tos \
    --non-interactive \
    --keep-until-expiring

# Copy certificates to project directory
sudo mkdir -p ~/claros-mis/ssl
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
sudo chmod 644 ~/claros-mis/ssl/*.pem

echo "SSL 인증서 발급 완료!"
ENDSSH

# 2. Create docker-compose override for SSL
echo ""
echo "[2/5] Docker Compose SSL 설정..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis

cat > docker-compose.ssl.yml << 'EOF'
services:
  frontend:
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
EOF

echo "Docker Compose SSL 설정 완료!"
ENDSSH

# 3. Setup auto-renewal
echo ""
echo "[3/5] SSL 인증서 자동 갱신 설정..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
# Create renewal script
sudo tee /usr/local/bin/renew-ssl.sh > /dev/null << 'RENEWAL'
#!/bin/bash
# Renew SSL certificate and restart frontend container

sudo certbot renew --quiet --no-self-upgrade

# Copy new certificates
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/fullchain.pem ~/claros-mis/ssl/
sudo cp /etc/letsencrypt/live/bis.claros.co.kr/privkey.pem ~/claros-mis/ssl/
sudo chmod 644 ~/claros-mis/ssl/*.pem

# Restart frontend to apply new certificates
cd ~/claros-mis
docker compose restart frontend
RENEWAL

sudo chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (renew twice daily)
(crontab -l 2>/dev/null; echo "0 */12 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -

echo "SSL 자동 갱신 설정 완료!"
ENDSSH

# 4. Update docker-compose configuration
echo ""
echo "[4/5] Docker Compose 설정 업데이트..."

ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis

# Merge SSL configuration with existing compose
docker compose -f docker-compose.yml -f docker-compose.ssl.yml config > docker-compose.yml.tmp
mv docker-compose.yml.tmp docker-compose.yml

# Restart frontend with SSL
echo "Frontend 컨테이너 재시작 중..."
docker compose up -d frontend
ENDSSH

# 5. Verify HTTPS
echo ""
echo "[5/5] HTTPS 설정 확인..."
sleep 10

echo ""
echo "curl -k https://$DOMAIN/ | head -10"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "curl -k https://$DOMAIN/ 2>/dev/null | head -10"

echo ""
echo "=========================================="
echo "  HTTPS 설정 완료!"
echo "=========================================="
echo ""
echo "접속 URL:"
echo "  HTTPS: https://$DOMAIN/"
echo "  HTTP:  http://$DOMAIN/ (자동 리다이렉트)"
echo ""
echo "SSL 인증서 정보:"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "sudo certbot certificates"
echo ""
