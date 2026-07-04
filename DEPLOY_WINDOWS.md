# Claros MIS-AI Dashboard 배포 가이드
# 고정 IP: 52.79.230.126

## Windows 배포 방법

### 1. 사전 준비

1. **AWS Lightsail 인스턴스 생성 완료**
   - 고정 IP: `52.79.230.126`
   - SSH 키 파일 (.pem) 준비

2. **Git Bash 또는 PowerShell 설치**
   - Windows: Git Bash 사용 권장
   - 또는 Windows Terminal + WSL2

### 2. 배포 실행

#### 방법 1: Git Bash 사용 (권장)

```bash
# 1. 프로젝트 디렉토리로 이동
cd C:/work/claude_code/claros-mis-ai-dashboard

# 2. 배포 스크립트 실행 (SSH 키 경로 지정)
bash deploy-to-lightsail.sh "/path/to/your-key.pem"

# 또는 현재 디렉토리에 키가 있는 경우
bash deploy-to-lightsail.sh "your-key.pem"
```

#### 방법 2: 직접 SSH 접속 후 배포

```bash
# 1. SSH 접속
ssh -i "your-key.pem" ubuntu@52.79.230.126

# 2. Docker 설치 (처음만)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# 3. 프로젝트 디렉토리 생성 및 이동
mkdir -p ~/claros-mis
cd ~/claros-mis

# 4. Docker Compose 파일 생성
cat > docker-compose.yml << 'EOF'
# docker-compose.yml 내용 붙여넣기
EOF

# 5. 빌드 및 실행
docker compose build
docker compose up -d
```

### 3. 배포 후 확인

```bash
# 컨테이너 상태 확인
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose ps"

# 로그 확인
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose logs -f"
```

### 4. 접속 URL

| 서비스 | URL |
|--------|-----|
| Frontend | http://52.79.230.126/ |
| Backend API | http://52.79.230.126/api/ |
| Swagger | http://52.79.230.126/swagger/ |

### 5. 코드 수정 후 재배포

```bash
# 방법 1: 업데이트 스크립트 사용
bash update-lightsail.sh "your-key.pem"

# 방법 2: 직접 SSH 접속 후
ssh -i "your-key.pem" ubuntu@52.79.230.126
cd ~/claros-mis
git pull  # Git 사용 시
docker compose build
docker compose up -d
```

### 6. 문제 해결

```bash
# 컨테이너 전체 재시작
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose restart"

# 컨테이너 전체 중지 및 삭제
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose down"

# 로그 확인
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose logs backend"
ssh -i "your-key.pem" ubuntu@52.79.230.126 "cd ~/claros-mis && docker compose logs frontend"
```
