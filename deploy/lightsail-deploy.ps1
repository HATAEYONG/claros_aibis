################################################################################
# 아마존 라이트세일 배포 스크립트 (PowerShell)
# AI & BI DeepSeeHub Platform
# Server IP: 3.36.114.58
################################################################################

#Requires -Modules Posh-SSH

# ========================================
# 설정 변수
# ========================================

$SERVER_HOST = "3.36.114.58"
$SERVER_USER = "ubuntu"
$SSH_KEY_PATH = "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem"

# 프로젝트 경로
$PROJECT_ROOT = "C:\work\claude_AIBIS\claros-mis-ai-dashboard"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "claros-mis-frontend"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "claros-mis-backend"

# 서버 경로
$SERVER_DEPLOY_PATH = "/var/www/deepseehub"
$FRONTEND_BUILD_PATH = "$SERVER_DEPLOY_PATH/frontend"
$BACKEND_DEPLOY_PATH = "$SERVER_DEPLOY_PATH/backend"

# ========================================
# 로그 함수
# ========================================

function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Log-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# ========================================
# 사전 체크
# ========================================

function Test-Prerequisites {
    Log-Info "사전 요구사항 확인 중..."

    # SSH 키 파일 확인
    if (-not (Test-Path $SSH_KEY_PATH)) {
        Log-Error "SSH 키 파일을 찾을 수 없습니다: $SSH_KEY_PATH"
        exit 1
    }
    Log-Success "SSH 키 파일 확인 완료"

    # WinSCP 확인 (파일 전송용)
    $winscpPath = "C:\Program Files\WinSCP\WinSCP.exe"
    if (-not (Test-Path $winscpPath)) {
        Log-Warning "WinSCP가 설치되어 있지 않습니다. https://winscp.net/ 에서 다운로드하세요."
        Log-Info "SCP를 사용하려면 Git Bash 또는 WSL을 사용하세요."
    }

    # Node.js 확인
    try {
        $nodeVersion = node --version
        Log-Success "Node.js 버전: $nodeVersion"
    } catch {
        Log-Error "Node.js가 설치되어 있지 않습니다."
        exit 1
    }

    Log-Success "사전 요구사항 확인 완료"
}

# ========================================
# 프론트엔드 배포
# ========================================

function Deploy-Frontend {
    Log-Info "=== 프론트엔드 배포 시작 ==="

    # 로컬 빌드
    Log-Info "프론트엔드 빌드 중..."
    Push-Location $FRONTEND_DIR

    try {
        # 의존성 설치
        Log-Info "npm install 실행 중..."
        npm install --legacy-peer-deps

        # 환경 변수 설정
        $env:VITE_API_URL = "http://3.36.114.58:8000/api"

        # 빌드
        Log-Info "프로덕션 빌드 실행 중..."
        npm run build

        Log-Success "프론트엔드 빌드 완료"
    } catch {
        Log-Error "프론트엔드 빌드 실패: $_"
        Pop-Location
        exit 1
    }

    Pop-Location

    # 파일 업로드 안내
    Log-Warning "파일 업로드가 필요합니다."
    Log-Info "다음 옵션 중 하나를 사용하세요:"
    Log-Info "1. WinSCP GUI 사용:"
    Log-Info "   - 호스트: $SERVER_HOST"
    Log-Info "   - 사용자: $SERVER_USER"
    Log-Info "   - 키 파일: $SSH_KEY_PATH"
    Log-Info "   - 업로드 대상: dist/* → $FRONTEND_BUILD_PATH"
    Log-Info ""
    Log-Info "2. Git Bash 사용:"
    Log-Info "   scp -i '$SSH_KEY_PATH' -r $FRONTEND_DIR\dist/* ${SERVER_USER}@${SERVER_HOST}:${FRONTEND_BUILD_PATH}/"
    Log-Info ""
    Log-Info "3. WSL 사용:"
    Log-Info "   scp -i '/mnt/c/work/claude_AIBIS/BI_LightsailDefaultKey-ap-northeast-2.pem' -r /mnt/c/work/claude_AIBIS/claros-mis-ai-dashboard/claros-mis-frontend/dist/* ubuntu@3.36.114.58:/var/www/deepseehub/frontend/"

    Log-Success "프론트엔드 배포 준비 완료"
}

# ========================================
# 백엔드 배포
# ========================================

function Deploy-Backend {
    Log-Info "=== 백엔드 배포 시작 ==="

    # 파일 업로드 안내
    Log-Warning "파일 업로드가 필요합니다."
    Log-Info "다음 파일들을 업로드하세요:"
    Log-Info "1. WinSCP GUI 사용:"
    Log-Info "   - $BACKEND_DIR\src → $BACKEND_DEPLOY_PATH/src"
    Log-Info "   - $BACKEND_DIR\package.json → $BACKEND_DEPLOY_PATH/"
    Log-Info "   - $BACKEND_DIR\tsconfig.json → $BACKEND_DEPLOY_PATH/"
    Log-Info ""
    Log-Info "2. Git Bash 사용:"
    Log-Info "   scp -i '$SSH_KEY_PATH' -r $BACKEND_DIR\src ${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"
    Log-Info "   scp -i '$SSH_KEY_PATH' $BACKEND_DIR\package.json ${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"
    Log-Info "   scp -i '$SSH_KEY_PATH' $BACKEND_DIR\tsconfig.json ${SERVER_USER}@${SERVER_HOST}:${BACKEND_DEPLOY_PATH}/"

    # 서버에서 실행할 명령어
    Log-Info ""
    Log-Info "서버에서 다음 명령어를 실행하세요:"
    Log-Info "ssh -i '$SSH_KEY_PATH' ${SERVER_USER}@${SERVER_HOST}"
    Log-Info ""
    Log-Info "cd $BACKEND_DEPLOY_PATH"
    Log-Info "npm install --production"
    Log-Info "npm run build"
    Log-Info "pm2 restart deepseehub-backend"

    Log-Success "백엔드 배포 준비 완료"
}

# ========================================
# 메인 함수
# ========================================

function Main {
    Write-Host ""
    Write-Host "============================================"
    Write-Host "  AI & BI DeepSeeHub Platform 배포 스크립트"
    Write-Host "  서버: $SERVER_HOST"
    Write-Host "============================================"
    Write-Host ""

    # 사전 체크
    Test-Prerequisites

    # 배포 모드 선택
    $mode = $args[0]
    if (-not $mode) {
        $mode = "all"
    }

    switch ($mode) {
        "frontend" {
            Deploy-Frontend
        }
        "backend" {
            Deploy-Backend
        }
        "all" {
            Deploy-Frontend
            Write-Host ""
            Deploy-Backend
        }
        default {
            Write-Host "사용법: .\lightsail-deploy.ps1 {frontend|backend|all}"
            Write-Host ""
            Write-Host "옵션:"
            Write-Host "  frontend  - 프론트엔드만 배포"
            Write-Host "  backend   - 백엔드만 배포"
            Write-Host "  all       - 전체 배포 (기본값)"
            exit 1
        }
    }

    Write-Host ""
    Log-Success "============================================"
    Log-Success "  배포 준비 완료!"
    Log-Success "============================================"
    Write-Host ""
    Write-Host "다음 단계:"
    Write-Host "1. 파일 업로드 (WinSCP 또는 Git Bash 사용)"
    Write-Host "2. 서버에서 Nginx 설정 적용"
    Write-Host "3. PM2로 백엔드 시작"
    Write-Host "4. http://$SERVER_HOST/ 접속 확인"
    Write-Host ""
}

# 스크립트 실행
Main $args
