#!/bin/bash
# ============================================================
# NetPlus MIS-AI Dashboard AWS Lightsail 배포 스크립트
# 고정 IP: 52.79.230.126
# ============================================================

# 설정 변수
SERVER_IP="52.79.230.126"
SERVER_USER="ubuntu"
KEY_PATH="$1"  # SSH 키 경로 (첫 번째 인자)

if [ -z "$KEY_PATH" ]; then
    echo "사용법: $0 <ssh-key-path>"
    echo "예시: $0 ~/.ssh/lightsail-key.pem"
    exit 1
fi

echo "=========================================="
echo "  NetPlus MIS-AI Dashboard 배포"
echo "  서버: $SERVER_IP"
echo "=========================================="

# 1. Docker 설치 확인 및 설치
echo ""
echo "[1/6] Docker 설치 확인..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Docker 설치 중..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
else
    echo "Docker 이미 설치됨"
fi
ENDSSH

# 2. 프로젝트 디렉토리 생성
echo ""
echo "[2/6] 프로젝트 디렉토리 생성..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
mkdir -p ~/netplus-mis
cd ~/netplus-mis
ENDSSH

# 3. 파일 업로드
echo ""
echo "[3/6] 프로젝트 파일 업로드..."
echo "  - docker-compose.yml"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no docker-compose.yml $SERVER_USER@$SERVER_IP:~/netplus-mis/

echo "  - netplus-mis-backend/"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r netplus-mis-backend $SERVER_USER@$SERVER_IP:~/netplus-mis/

echo "  - netplus-mis-frontend/"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r netplus-mis-frontend $SERVER_USER@$SERVER_IP:~/netplus-mis/

# 4. 환경변수 설정
echo ""
echo "[4/6] 환경변수 설정..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/netplus-mis

cat > .env << EOF
SECRET_KEY=$(openssl rand -base64 50)
DEBUG=False
ALLOWED_HOSTS=52.79.230.126,.amazonaws.com,localhost
DB_ENGINE=django.db.backends.sqlite3
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://52.79.230.126,https://52.79.230.126
EOF
ENDSSH

# 5. Docker Compose 빌드 및 시작
echo ""
echo "[5/6] Docker 컨테이너 빌드 및 시작..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/netplus-mis

# 기존 컨테이너 중지
docker compose down 2>/dev/null || true

# 이미지 빌드
echo "이미지 빌드 중..."
docker compose build --no-cache

# 컨테이너 시작
echo "컨테이너 시작 중..."
docker compose up -d

# 대기
echo "서버 시작 대기..."
sleep 10
ENDSSH

# 6. 배포 확인
echo ""
echo "[6/6] 배포 상태 확인..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/netplus-mis
echo ""
echo "=========================================="
echo "  컨테이너 상태"
echo "=========================================="
docker compose ps

echo ""
echo "=========================================="
echo "  최근 로그"
echo "=========================================="
docker compose logs --tail=20
ENDSSH

# 완료 메시지
echo ""
echo "=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "접속 URL:"
echo "  Frontend:  http://52.79.230.126/"
echo "  Backend:   http://52.79.230.126/api/"
echo "  Swagger:   http://52.79.230.126/swagger/"
echo ""
echo "유용한 명령어:"
echo "  ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP"
echo "  로그 보기: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'cd ~/netplus-mis && docker compose logs -f'"
echo ""
