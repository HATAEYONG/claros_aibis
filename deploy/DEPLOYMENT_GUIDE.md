# 아마존 라이트세일 배포 가이드

**AI & BI DeepSeeHub Platform**
**서버 IP: 3.36.114.58**
**리전: ap-northeast-2 (서울)**

---

## 📋 배포 정보

| 항목 | 값 |
|------|-----|
| 서버 IP | 3.36.114.58 |
| SSH 사용자 | ubuntu |
| SSH 키 파일 | `C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem` |
| 프론트엔드 | React + Vite (정적 파일) |
| 백엔드 | Express + TypeScript (PM2) |
| 웹 서버 | Nginx |

---

## 🔧 사전 준비

### 1. Windows에서 배포를 위한 도구 설치

**옵션 A: Git Bash 사용 (권장)**
```powershell
# Git Bash가 설치되어 있는지 확인
git --version
```

**옵션 B: WSL (Windows Subsystem for Linux)**
```powershell
# WSL 설치
wsl --install
```

### 2. SSH 키 권한 설정

Windows에서는 chmod가 없으므로 Git Bash나 WSL에서 실행:

```bash
# SSH 키 권한 변경 (필수)
chmod 400 "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem"
```

### 3. 서버 연결 테스트

```bash
# SSH 연결 테스트
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58

# 첫 연결 시 fingerprint 확인 메시지에 'yes' 입력
```

---

## 🚀 배포 방법

### 방법 1: Git Bash에서 배포 스크립트 실행

```bash
# 프로젝트 배포 디렉토리로 이동
cd C:/work/claude_AIBIS/claros-mis-ai-dashboard/deploy

# 스크립트 실행 권한 부여
chmod +x lightsail-deploy.sh

# 전체 배포
./lightsail-deploy.sh all

# 또는 프론트엔드만 배포
./lightsail-deploy.sh frontend

# 또는 백엔드만 배포
./lightsail-deploy.sh backend
```

### 방법 2: 수동 배포 (PowerShell)

#### 2-1. 프론트엔드 배포

```powershell
# 1. 프론트엔드 디렉토리로 이동
cd C:\work\claude_AIBIS\claros-mis-ai-dashboard\claros-mis-frontend

# 2. 의존성 설치
npm install --legacy-peer-deps

# 3. 환경 변수 설정
$env:VITE_API_URL="http://3.36.114.58:8000/api"

# 4. 빌드
npm run build

# 5. SCP로 파일 업로드 (Git Bash 또는 WinSCP 사용)
# Git Bash에서:
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" -r dist/* ubuntu@3.36.114.58:/var/www/deepseehub/frontend/
```

#### 2-2. 백엔드 배포

```powershell
# 1. 백엔드 디렉토리로 이동
cd C:\work\claude_AIBIS\claros-mis-ai-dashboard\claros-mis-backend

# 2. 백엔드 파일 업로드
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" -r src ubuntu@3.36.114.58:/var/www/deepseehub/backend/
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" package.json ubuntu@3.36.114.58:/var/www/deepseehub/backend/
scp -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" tsconfig.json ubuntu@3.36.114.58:/var/www/deepseehub/backend/
```

### 방법 3: WinSCP 사용 (GUI)

1. WinSCP 다운로드: https://winscp.net/
2. 새 세션 생성:
   - 파일 프로토콜: SFTP
   - 호스트 이름: 3.36.114.58
   - 사용자 이름: ubuntu
   - 키 파일: `C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem`
3. 연결 후 파일 업로드

---

## 🖥️ 서버 설정

### 첫 배포 시 서버 초기 설정

```bash
# SSH 접속
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58

# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
sudo apt install -y nginx nodejs npm

# Node.js 최신 버전 (노드 18.x)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 전역 설치
sudo npm install -g pm2

# 배포 디렉토리 생성
sudo mkdir -p /var/www/deepseehub
sudo chown -R ubuntu:ubuntu /var/www/deepseehub
```

### 데이터베이스 설정 (MySQL)

```bash
# MySQL 설치
sudo apt install -y mysql-server

# MySQL 보안 설정
sudo mysql_secure_installation

# 데이터베이스 생성
sudo mysql -u root -p
```

```sql
-- MySQL 쿼리
CREATE DATABASE claros_mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'claros'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON claros_mis.* TO 'claros'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📁 Nginx 설정

Nginx 설정 파일은 배포 스크립트가 자동 생성하지만, 수동으로 설정하려면:

```bash
# SSH 접속 후
sudo nano /etc/nginx/sites-available/deepseehub
```

Nginx 설정 내용은 `deploy/nginx.conf` 파일을 참조하세요.

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/deepseehub /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔍 배포 상태 확인

### 서비스 상태 확인

```bash
# SSH 접속
ssh -i "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem" ubuntu@3.36.114.58

# Nginx 상태
sudo systemctl status nginx

# PM2 상태
pm2 status

# PM2 로그
pm2 logs deepseehub-backend

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
```

### 웹 사이트 접속

- **프론트엔드**: http://3.36.114.58/
- **백엔드 API**: http://3.36.114.58/api/

---

## 🔄 배포 후 관리

### PM2 명령어

```bash
# 프로세스 목록
pm2 list

# 프로세스 중지
pm2 stop deepseehub-backend

# 프로세스 시작
pm2 start deepseehub-backend

# 프로세스 재시작
pm2 restart deepseehub-backend

# 프로세스 삭제
pm2 delete deepseehub-backend

# 로그 보기
pm2 logs deepseehub-backend

# 모니터링
pm2 monit
```

### Nginx 명령어

```bash
# Nginx 재시작
sudo systemctl restart nginx

# Nginx 리로드 (설정만 적용)
sudo systemctl reload nginx

# Nginx 상태 확인
sudo systemctl status nginx
```

### 로그 파일 위치

| 서비스 | 로그 파일 |
|--------|-----------|
| Nginx 접근 로그 | `/var/log/nginx/access.log` |
| Nginx 에러 로그 | `/var/log/nginx/error.log` |
| PM2 로그 | `~/.pm2/logs/` |

---

## 🛠️ 문제 해결

### 문제 1: SSH 연결 거부

```bash
# 키 권한 확인
chmod 400 "C:\work\claude_AIBIS\BI_LightsailDefaultKey-ap-northeast-2.pem"

# 보안 그룹 인바운드 규칙 확인 (라이트세일 콘솔)
# - 포트 22 (SSH) 허용
```

### 문제 2: Nginx 502 Bad Gateway

```bash
# 백엔드 프로세스 확인
pm2 status

# 백엔드 재시작
pm2 restart deepseehub-backend
```

### 문제 3: 빌드 실패

```powershell
# node_modules 삭제 후 재설치
cd C:\work\claude_AIBIS\claros-mis-ai-dashboard\claros-mis-frontend
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

### 문제 4: CORS 오류

Nginx 설정에서 프록시 설정을 확인하세요. `/api/` 경로는 백엔드로 프록시되어야 합니다.

---

## 📞 지원

배포 중 문제가 발생하면:

1. 배포 스크립트 로그 확인
2. PM2 로그 확인: `pm2 logs --lines 100`
3. Nginx 로그 확인: `sudo tail -n 100 /var/log/nginx/error.log`

---

## 📝 체크리스트

배포 전 확인:

- [ ] SSH 키 권한이 400으로 설정됨
- [ ] 서버에 SSH 접속 가능
- [ ] Node.js 버전 확인 (로컬/서버)
- [ ] Nginx 설치됨
- [ ] PM2 설치됨
- [ ] 데이터베이스 설정 완료

배포 후 확인:

- [ ] 웹 사이트 접속 가능 (http://3.36.114.58)
- [ ] API 응답 정상
- [ ] PM2 프로세스 실행 중
- [ ] Nginx 실행 중
- [ ] 로그에 치명적 에러 없음
