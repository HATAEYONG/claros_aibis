#!/bin/bash
# ============================================================
# Claros MIS-AI Dashboard 배포 스크립트
# 서버: 3.36.114.58 (AWS Lightsail ap-northeast-2)
# ============================================================

# 설정 변수
SERVER_IP="3.36.114.58"
SERVER_USER="ubuntu"
KEY_PATH="C:/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem"
PROJECT_DIR="C:/work/claude_AIBIS/claros-mis-ai-dashboard"

echo "=========================================="
echo "  Claros MIS-AI Dashboard 배포"
echo "  서버: $SERVER_IP"
echo "=========================================="

# 1. Docker 설치
echo ""
echo "[1/7] Docker 설치..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Docker 설치 중..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    echo "Docker 설치 완료"
else
    echo "Docker 이미 설치됨: $(docker --version)"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Docker Compose 설치 중..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose 설치 완료"
else
    echo "Docker Compose 이미 설치됨"
fi
ENDSSH

# 2. 프로젝트 디렉토리 생성
echo ""
echo "[2/7] 프로젝트 디렉토리 생성..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
mkdir -p ~/claros-mis
mkdir -p ~/claros-mis/logs
ENDSSH

# 3. docker-compose.yml 업로드
echo ""
echo "[3/7] docker-compose.yml 업로드..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/docker-compose.yml" $SERVER_USER@$SERVER_IP:~/claros-mis/

# 4. 백엔드 업로드
echo ""
echo "[4/7] 백엔드 파일 업로드..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis
mkdir -p claros-mis-backend
ENDSSH

# 백엔드 필수 파일만 업로드 (불필요한 파일 제외)
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-backend/manage.py" $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-backend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-backend/requirements.txt" $SERVER_USER@$SERVER_IP:~/claros-mis-backend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-backend/Dockerfile" $SERVER_USER@$SERVER_IP:~/claros-mis-backend/

# 백엔드 디렉토리 구조 업로드
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis/claros-mis-backend
mkdir -p config logs
ENDSSH

# 백엔드 전체 업로드 (rsync 사용하여 빠르게)
cd "$PROJECT_DIR"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r claros-mis-backend/* $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-backend/

# 5. 프론트엔드 업로드
echo ""
echo "[5/7] 프론트엔드 파일 업로드..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis
mkdir -p claros-mis-frontend
ENDSSH

scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-frontend/package.json" $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-frontend/Dockerfile" $SERVER_USER@$SERVER_IP:~/claros-mis-frontend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-frontend/vite.config.ts" $SERVER_USER@$SERVER_IP:~/claros-mis-frontend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-frontend/index.html" $SERVER_USER@$SERVER_IP:~/claros-mis-frontend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "$PROJECT_DIR/claros-mis-frontend/tsconfig.json" $SERVER_USER@$SERVER_IP:~/claros-mis-frontend/

# 프론트엔드 전체 업로드
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r claros-mis-frontend/public $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r claros-mis-frontend/src $SERVER_USER@$SERVER_IP:~/claros-mis/claros-mis-frontend/

# 6. 환경변수 설정
echo ""
echo "[6/7] 환경변수 설정..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis

cat > .env << EOF
SECRET_KEY=$(openssl rand -base64 50)
DEBUG=False
ALLOWED_HOSTS=3.36.114.58,.amazonaws.com,localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=http://3.36.114.58,https://3.36.114.58
VITE_API_URL=/api
EOF
ENDSSH

# 7. Docker Compose 빌드 및 시작
echo ""
echo "[7/7] Docker 컨테이너 빌드 및 시작..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis

# 기존 컨테이너 중지
docker compose down 2>/dev/null || true

# 이미지 빌드 (백엔드만 빌드 - SQLite 사용)
echo "백엔드 이미지 빌드 중..."
docker compose build backend

echo "프론트엔드 이미지 빌드 중..."
docker compose build frontend

# 컨테이너 시작
echo "컨테이너 시작 중..."
docker compose up -d backend frontend

# 대기
echo "서버 시작 대기..."
sleep 15
ENDSSH

# 8. 배포 확인
echo ""
echo "=========================================="
echo "  배포 상태 확인"
echo "=========================================="
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis
docker compose ps
ENDSSH

# 완료 메시지
echo ""
echo "=========================================="
echo "  배포 완료!"
echo "=========================================="
echo ""
echo "접속 URL:"
echo "  Frontend:  http://3.36.114.58/"
echo "  Backend:   http://3.36.114.58/api/"
echo "  Health:    http://3.36.114.58/api/health/"
echo ""
echo "유용한 명령어:"
echo "  SSH 접속: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP"
echo "  로그 보기: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'cd ~/claros-mis && docker compose logs -f'"
echo "  상태 확인: ssh -i $KEY_PATH $SERVER_USER@$SERVER_IP 'cd ~/claros-mis && docker compose ps'"
echo ""
