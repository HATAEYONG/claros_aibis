# ============================================================
# NetPlus MIS-AI Dashboard AWS Lightsail 배포 스크립트 (PowerShell)
# 고정 IP: 52.79.230.126
# ============================================================

$SERVER_IP = "52.79.230.126"
$SERVER_USER = "ubuntu"
$KEY_PATH = "C:\Users\hty10\Downloads\LightsailDefaultKey-ap-northeast-2.pem"
$PROJECT_DIR = "C:\work\claude_code\netplus-mis-ai-dashboard"
$REMOTE_DIR = "/home/ubuntu/netplus-mis"

# SSH 옵션
$sshOptions = "-i", $KEY_PATH, "-o", "StrictHostKeyChecking=no"

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "  NetPlus MIS-AI Dashboard 배포"  -ForegroundColor Cyan
Write-Host "  서버: $SERVER_IP"  -ForegroundColor Cyan
Write-Host "=========================================="  -ForegroundColor Cyan

# 0. 원격 디렉토리 생성
Write-Host "`n[0/5] 원격 디렉토리 생성..."  -ForegroundColor Yellow
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "mkdir -p $REMOTE_DIR"

# 1. SCP를 사용한 파일 업로드
Write-Host "`n[1/5] 프로젝트 파일 업로드 중..."  -ForegroundColor Yellow

# docker-compose.yml 업로드
Write-Host "  - docker-compose.yml"  -ForegroundColor Gray
& scp @sshOptions "$PROJECT_DIR\docker-compose.yml" "$SERVER_USER@${SERVER_IP}:${REMOTE_DIR}/docker-compose.yml"
if ($LASTEXITCODE -ne 0) { Write-Host "docker-compose.yml 업로드 실패!" -ForegroundColor Red }

# Backend 업로드 (tar로 압축해서 전송)
Write-Host "  - netplus-mis-backend/"  -ForegroundColor Gray
$backendTar = "$env:TEMP\backend.tar"
tar -cf "$env:TEMP\backend.tar" -C "$PROJECT_DIR" "netplus-mis-backend"
& scp @sshOptions "$backendTar" "$SERVER_USER@${SERVER_IP}:/tmp/backend.tar"
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "cd $REMOTE_DIR && tar -xf /tmp/backend.tar && rm /tmp/backend.tar"

# Frontend 업로드 (tar로 압축해서 전송)
Write-Host "  - netplus-mis-frontend/"  -ForegroundColor Gray
$frontendTar = "$env:TEMP\frontend.tar"
tar -cf "$env:TEMP\frontend.tar" -C "$PROJECT_DIR" "netplus-mis-frontend"
& scp @sshOptions "$frontendTar" "$SERVER_USER@${SERVER_IP}:/tmp/frontend.tar"
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "cd $REMOTE_DIR && tar -xf /tmp/frontend.tar && rm /tmp/frontend.tar"

# 2. Docker 설치 확인
Write-Host "`n[2/5] Docker 설치 확인..."  -ForegroundColor Yellow
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "if ! command -v docker &> /dev/null; then echo 'Docker 설치 중...'; curl -fsSL https://get.docker.com | sudo sh; sudo usermod -aG docker ubuntu; else echo 'Docker 이미 설치됨'; fi"

# 3. Docker Compose 빌드 및 시작
Write-Host "`n[3/5] Docker 컨테이너 빌드 및 시작..."  -ForegroundColor Yellow
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "cd $REMOTE_DIR && docker compose down 2>/dev/null || true && docker compose build && docker compose up -d"

# 대기
Write-Host "`n[4/5] 서버 시작 대기..."  -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 5. 배포 상태 확인
Write-Host "`n[5/5] 배포 상태 확인..."  -ForegroundColor Yellow
& ssh @sshOptions "$SERVER_USER@${SERVER_IP}" "cd $REMOTE_DIR && echo '==========================================' && echo '  컨테이너 상태' && echo '==========================================' && docker compose ps && echo '' && echo '==========================================' && echo '  최근 로그' && echo '==========================================' && docker compose logs --tail=20"

Write-Host "`n=========================================="  -ForegroundColor Green
Write-Host "  배포 완료!"  -ForegroundColor Green
Write-Host "=========================================="  -ForegroundColor Green
Write-Host "`n접속 URL:"  -ForegroundColor White
Write-Host "  Frontend:  http://52.79.230.126/"  -ForegroundColor Cyan
Write-Host "  Backend:   http://52.79.230.126/api/"  -ForegroundColor Cyan
Write-Host "  Swagger:   http://52.79.230.126/swagger/"  -ForegroundColor Cyan
Write-Host ""
