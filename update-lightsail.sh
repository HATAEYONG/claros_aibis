# 배포 후 업데이트 스크립트 (코드 수정 시)
#!/bin/bash

KEY_PATH="$1"
SERVER_IP="52.79.230.126"
SERVER_USER="ubuntu"

if [ -z "$KEY_PATH" ]; then
    echo "사용법: $0 <ssh-key-path>"
    exit 1
fi

echo "코드 업데이트 및 재배포..."

# 파일 업로드
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no docker-compose.yml $SERVER_USER@$SERVER_IP:~/claros-mis/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r claros-mis-backend $SERVER_USER@$SERVER_IP:~/claros-mis/
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r claros-mis-frontend $SERVER_USER@$SERVER_IP:~/claros-mis/

# 재빌드 및 재시작
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd ~/claros-mis
docker compose build
docker compose up -d
ENDSSH

echo "업데이트 완료!"
