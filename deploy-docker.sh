#!/bin/bash
# ============================================================
# NetPlus MIS-AI Dashboard Docker 배포 스크립트
# AWS Lightsail Ubuntu + Docker Compose
# ============================================================

set -e

echo "=========================================="
echo "  Docker 배포 시작"
echo "=========================================="

# 1. Docker & Docker Compose 설치
echo ""
echo "[1/5] Docker 설치..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
fi

# Docker Compose v2
if ! docker compose version &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# 2. 프로젝트 디렉토리 설정
echo ""
echo "[2/5] 프로젝트 디렉토리 설정..."
mkdir -p /home/ubuntu/netplus-mis
cd /home/ubuntu/netplus-mis

# 3. GitHub에서 코드 가져오기 (또는 로컬에서 업로드)
echo ""
echo "[3/5] 코드 배치..."
# git clone https://your-repo.git .
# 또는 SCP로 업로드한 파일 사용

# 4. 환경변수 설정
echo ""
echo "[4/5] 환경변수 설정..."
cat > .env << EOF
SECRET_KEY=$(openssl rand -base64 50)
ALLOWED_HOSTS=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4),.amazonaws.com
CORS_ALLOWED_ORIGINS=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
VITE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
EOF

# 5. Docker Compose 빌드 및 시작
echo ""
echo "[5/5] Docker 컨테이너 시작..."
docker compose build
docker compose up -d

# 6. 방화벽 설정
echo ""
echo "방화벽 설정..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
echo "y" | sudo ufw enable

# 완료
echo ""
echo "=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "컨테이너 상태:"
docker compose ps
echo ""
echo "=========================================="
echo "  접속 정보"
echo "=========================================="
echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/"
echo "Backend API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/"
echo "Swagger: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/swagger/"
echo ""
echo "로그 보기:"
echo "  docker compose logs -f"
echo ""
echo "재시작:"
echo "  docker compose restart"
echo ""
