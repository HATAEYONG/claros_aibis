#!/bin/bash

################################################################################
# 아마존 라이트세일 배포 스크립트
# AI & BI DeepSeeHub Platform
# 고정 IP: 3.36.114.58
################################################################################

set -e  # 오류 발생 시 스크립트 중단

# ========================================
# 설정 변수
# ========================================

# 서버 정보
SERVER_HOST="3.36.114.58"
SERVER_USER="ubuntu"

# SSH 키 경로 (Windows에서 Git Bash/WSL 사용)
# Git Bash: /c/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem
# WSL: /mnt/c/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem
SSH_KEY_PATH="/c/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem"

# 프로젝트 경로
LOCAL_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${LOCAL_PROJECT_ROOT}/claros-mis-frontend"
BACKEND_DIR="${LOCAL_PROJECT_ROOT}/claros-mis-backend"

# 서버 경로
SERVER_DEPLOY_PATH="/var/www/deepseehub"
FRONTEND_BUILD_PATH="${SERVER_DEPLOY_PATH}/frontend"
BACKEND_DEPLOY_PATH="${SERVER_DEPLOY_PATH}/backend"

# Nginx 설정
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_SITE_NAME="deepseehub"

# ========================================
# 색상 출력 함수
# ========================================

log_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

log_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# ========================================
# 사전 체크 함수
# ========================================

check_prerequisites() {
    log_info "사전 요구사항 확인 중..."

    # SSH 키 파일 확인
    if [ ! -f "${SSH_KEY_PATH}" ]; then
        log_error "SSH 키 파일을 찾을 수 없습니다: ${SSH_KEY_PATH}"
        log_info "SSH_KEY_PATH 환경변수로 키 파일 경로를 지정해주세요."
        exit 1
    fi

    # SSH 키 권한 확인
    if [ "$(stat -c %a "${SSH_KEY_PATH}" 2>/dev/null || stat -f %A "${SSH_KEY_PATH}")" != "400" ]; then
        log_warning "SSH 키 권한이 400이 아닙니다. 권한을 변경합니다..."
        chmod 400 "${SSH_KEY_PATH}"
    fi

    # SSH 연결 테스트
    log_info "SSH 연결 테스트 중..."
    if ssh -i "${SSH_KEY_PATH}" -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        "${SERVER_USER}@${SERVER_HOST}" "echo 'SSH 연결 성공'" 2>/dev/null; then
        log_success "SSH 연결 성공"
    else
        log_error "SSH 연결 실패. 서버 정보와 네트워크를 확인해주세요."
        exit 1
    fi

    # Node.js 버전 확인 (로컬)
    if ! command -v node &> /dev/null; then
        log_error "Node.js가 설치되어 있지 않습니다."
        exit 1
    fi
    log_success "Node.js 버전: $(node --version)"

    log_success "사전 요구사항 확인 완료"
}

# ========================================
# 프론트엔드 배포 함수
# ========================================

deploy_frontend() {
    log_info "=== 프론트엔드 배포 시작 ==="

    # 로컬 빌드
    log_info "프론트엔드 빌드 중..."
    cd "${FRONTEND_DIR}"

    # 의존성 설치
    log_info "npm install 실행 중..."
    npm install --legacy-peer-deps

    # 환경 변수 설정
    export VITE_API_URL="http://3.36.114.58:8000/api"

    # 빌드
    log_info "프로덕션 빌드 실행 중..."
    npm run build

    log_success "프론트엔드 빌드 완료"

    # 서버 배경
    log_info "서버에 프론트엔드 배포 중..."

    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
set -e

# 배포 디렉토리 생성
sudo mkdir -p /var/www/deepseehub/frontend
sudo chown -R ubuntu:ubuntu /var/www/deepseehub

echo "파일 전송을 기다리는 중..."
ENDSSH

    # 빌드 파일 업로드
    log_info "빌드 파일 업로드 중..."
    scp -i "${SSH_KEY_PATH}" -r "${FRONTEND_DIR}/dist/"* \
        "${SERVER_USER}@${SERVER_HOST}:${FRONTEND_BUILD_PATH}/"

    # Nginx 설정
    log_info "Nginx 설정 중..."
    setup_nginx

    log_success "프론트엔드 배포 완료"
}

# ========================================
# Nginx 설정 함수
# ========================================

setup_nginx() {
    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
set -e

# Nginx 설정 파일 생성
sudo tee /etc/nginx/sites-available/deepseehub > /dev/null << 'EOF'
server {
    listen 80;
    server_name 3.36.114.58;

    # 프론트엔드 정적 파일
    location / {
        root /var/www/deepseehub/frontend;
        try_files $uri $uri/ /index.html;

        # 캐싱 설정
        add_header Cache-Control "public, max-age=3600";
    }

    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS 헤더
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 사이트 활성화
sudo ln -sf /etc/nginx/sites-available/deepseehub /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Nginx 설정 완료"
ENDSSH

    log_success "Nginx 설정 완료"
}

# ========================================
# 백엔드 배포 함수
# ========================================

deploy_backend() {
    log_info "=== 백엔드 배포 시작 ==="

    # 서버 준비
    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
set -e

# 백엔드 디렉토리 생성
mkdir -p /var/www/deepseehub/backend

# PM2 전역 설치 (없는 경우)
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    npm install -g pm2
fi
ENDSSH

    # 백엔드 파일 업로드
    log_info "백엔드 파일 업로드 중..."
    scp -i "${SSH_KEY_PATH}" -r "${BACKEND_DIR}/src" \
        "${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"
    scp -i "${SSH_KEY_PATH}" "${BACKEND_DIR}/package.json" \
        "${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"
    scp -i "${SSH_KEY_PATH}" "${BACKEND_DIR}/tsconfig.json" \
        "${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"

    # 백엔드 빌드 및 시작
    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
set -e

cd /var/www/deepseehub/backend

# 의존성 설치
echo "백엔드 의존성 설치 중..."
npm install --production

# TypeScript 컴파일
echo "TypeScript 컴파일 중..."
npm run build

# 환경 변수 파일 생성
cat > .env << 'EOF'
PORT=8000
NODE_ENV=production
DB_HOST=localhost
DB_USER=claros
DB_PASSWORD=your_password_here
DB_NAME=claros_mis
JWT_SECRET=your_jwt_secret_here
EOF

# PM2 설정 파일 생성
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'deepseehub-backend',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    }
  }]
};
EOF

# 기존 프로세스 중지 (있는 경우)
pm2 delete deepseehub-backend 2>/dev/null || true

# PM2로 백엔드 시작
echo "백엔드 서버 시작 중..."
pm2 start ecosystem.config.js

# PM2 시스템 서비스 등록
pm2 save
pm2 startup | tail -n 1 | sudo bash

echo "백엔드 배포 완료"
ENDSSH

    log_success "백엔드 배포 완료"
}

# ========================================
# 배포 상태 확인 함수
# ========================================

check_deployment() {
    log_info "=== 배포 상태 확인 ==="

    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << 'ENDSSH'
echo "=== 서비스 상태 ==="
echo ""
echo "[Nginx 상태]"
sudo systemctl status nginx --no-pager | head -n 5
echo ""
echo "[PM2 프로세스 상태]"
pm2 status
echo ""
echo "[디스크 사용량]"
df -h | grep -E "Filesystem|/dev"
echo ""
echo "[메모리 사용량]"
free -h
echo ""
echo "[최근 로그]"
pm2 logs deepseehub-backend --nostream --lines 10
ENDSSH

    log_info "웹 사이트 접속 테스트 중..."
    if command -v curl &> /dev/null; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_HOST}" || echo "000")
        if [ "${HTTP_STATUS}" = "200" ]; then
            log_success "웹 사이트 정상 작동 (HTTP ${HTTP_STATUS})"
        else
            log_warning "웹 사이트 상태: HTTP ${HTTP_STATUS}"
        fi
    fi

    log_success "배포 상태 확인 완료"
}

# ========================================
# 롤백 함수
# ========================================

rollback() {
    log_warning "=== 롤백 시작 ==="

    BACKUP_DATE=$(ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" \
        "ls -t /var/www/deepseehub/backups 2>/dev/null | head -n 1" || echo "")

    if [ -z "${BACKUP_DATE}" ]; then
        log_error "백업을 찾을 수 없습니다."
        exit 1
    fi

    log_info "백업일자 ${BACKUP_DATE}로 롤백합니다."

    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << ENDSSH
set -e

# 프론트엔드 롤백
sudo rm -rf /var/www/deepseehub/frontend
sudo cp -r /var/www/deepseehub/backups/${BACKUP_DATE}/frontend /var/www/deepseehub/frontend

# 백엔드 롤백
pm2 delete deepseehub-backend 2>/dev/null || true
cd /var/www/deepseehub/backups/${BACKUP_DATE}/backend
pm2 start ecosystem.config.js

sudo systemctl reload nginx
echo "롤백 완료"
ENDSSH

    log_success "롤백 완료"
}

# ========================================
# 백업 함수
# ========================================

backup() {
    log_info "=== 백업 시작 ==="

    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="/var/www/deepseehub/backups/${BACKUP_DATE}"

    ssh -i "${SSH_KEY_PATH}" "${SERVER_USER}@${SERVER_HOST}" << ENDSSH
set -e

# 백업 디렉토리 생성
sudo mkdir -p ${BACKUP_PATH}

# 프론트엔드 백업
sudo cp -r /var/www/deepseehub/frontend ${BACKUP_PATH}/frontend 2>/dev/null || true

# 백엔드 백업
sudo cp -r /var/www/deepseehub/backend ${BACKUP_PATH}/backend 2>/dev/null || true

# Nginx 설정 백업
sudo cp /etc/nginx/sites-available/deepseehub ${BACKUP_PATH}/nginx.conf 2>/dev/null || true

# 7일 이상 된 백업 삭제
find /var/www/deepseehub/backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "백업 완료: ${BACKUP_PATH}"
ENDSSH

    log_success "백업 완료: ${BACKUP_DATE}"
}

# ========================================
# 메인 함수
# ========================================

main() {
    echo ""
    echo "============================================"
    echo "  AI & BI DeepSeeHub Platform 배포 스크립트"
    echo "  서버: ${SERVER_HOST}"
    echo "============================================"
    echo ""

    # 사전 체크
    check_prerequisites

    # 기존 백업
    backup

    # 배포 모드에 따라 실행
    case "${1:-all}" in
        frontend|front)
            deploy_frontend
            ;;
        backend|back)
            deploy_backend
            ;;
        all)
            deploy_frontend
            deploy_backend
            ;;
        rollback)
            rollback
            exit 0
            ;;
        check|status)
            check_deployment
            exit 0
            ;;
        *)
            echo "사용법: $0 {frontend|backend|all|rollback|check}"
            echo ""
            echo "옵션:"
            echo "  frontend  - 프론트엔드만 배포"
            echo "  backend   - 백엔드만 배포"
            echo "  all       - 전체 배포 (기본값)"
            echo "  rollback  - 이전 버전으로 롤백"
            echo "  check     - 배포 상태 확인"
            exit 1
            ;;
    esac

    # 배포 상태 확인
    check_deployment

    echo ""
    log_success "============================================"
    log_success "  배포 완료!"
    log_success "============================================"
    echo ""
    echo "접속 정보:"
    echo "  웹 사이트: http://${SERVER_HOST}/"
    echo "  API: http://${SERVER_HOST}/api/"
    echo ""
    echo "관리 명령어:"
    echo "  SSH 접속: ssh -i ${SSH_KEY_PATH} ${SERVER_USER}@${SERVER_HOST}"
    echo "  PM2 로그: ssh -i ${SSH_KEY_PATH} ${SERVER_USER}@${SERVER_HOST} 'pm2 logs'"
    echo "  Nginx 로그: ssh -i ${SSH_KEY_PATH} ${SERVER_USER}@${SERVER_HOST} 'sudo tail -f /var/log/nginx/error.log'"
    echo ""
}

# 스크립트 실행
main "$@"
