# About-Plan 인터넷 공개 배포 가이드

이 문서는 `Next.js(프론트) + Spring Boot(Kotlin, 백엔드) + PostgreSQL`을 한 서버(VPS)에 Docker로 공개 배포하는 기준 절차입니다.

## 0) 배포 구조
- `https://도메인` -> `Caddy` -> `frontend(Next.js)`
- `https://도메인/api/*` -> `Caddy` -> `backend(Spring Boot)`
- `backend` -> `postgres`

## 1) 준비물
- 도메인 1개 (`about-plan.example.com`)
- 공개 서버 1대 (Ubuntu 22.04/24.04 권장)
- 서버 방화벽 오픈: `80/tcp`, `443/tcp`
- 로컬에서 Git push 가능한 상태

## 2) 최초 1회 서버 준비
서버 접속 후 실행:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

로그아웃/재접속 후 `docker --version` 확인.

## 3) 소스 받기
```bash
mkdir -p ~/apps
cd ~/apps
git clone <YOUR_GIT_REPO_URL> About-Plan
cd About-Plan
```

## 4) 배포 환경변수 작성
```bash
cd deploy
cp .env.production.example .env.production
```

`deploy/.env.production`에서 아래 값 수정:
- `APP_DOMAIN`: 실제 도메인
- `POSTGRES_PASSWORD`: 강한 비밀번호
- `JWT_SECRET`: 32자 이상 랜덤 문자열
- `NEXT_PUBLIC_API_BASE_URL`: `https://실제도메인`
- `APP_CORS_ALLOWED_ORIGINS`: `https://실제도메인`

## 5) DNS 연결
도메인 DNS에서 `A 레코드`를 서버 공인 IP로 설정.

예시:
- Host: `@`
- Type: `A`
- Value: `<SERVER_PUBLIC_IP>`

## 6) 최초 배포
```bash
cd ~/apps/About-Plan/deploy
chmod +x deploy.sh
./deploy.sh
```

정상 확인:
```bash
curl -sS https://<YOUR_DOMAIN>/api/health
```

## 7) 재배포(업데이트)
코드 변경 후:
```bash
cd ~/apps/About-Plan
git pull origin main
cd deploy
./deploy.sh
```

## 8) 데이터 저장/확인 방법
PostgreSQL 데이터는 Docker volume `pgdata`에 저장되어 컨테이너 재시작/재배포 후에도 유지됩니다.

테이블 직접 조회:
```bash
cd ~/apps/About-Plan/deploy
set -a; source .env.production; set +a
docker compose --env-file .env.production -f docker-compose.public.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"
```

예시 데이터 확인:
```bash
set -a; source .env.production; set +a
docker compose --env-file .env.production -f docker-compose.public.yml exec postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT * FROM users LIMIT 20;"
```

## 9) 장애 시 점검 순서
1. 컨테이너 상태
```bash
docker compose --env-file .env.production -f docker-compose.public.yml ps
```
2. 백엔드 로그
```bash
docker compose --env-file .env.production -f docker-compose.public.yml logs -f backend
```
3. 프론트 로그
```bash
docker compose --env-file .env.production -f docker-compose.public.yml logs -f frontend
```
4. 프록시(Caddy) 로그
```bash
docker compose --env-file .env.production -f docker-compose.public.yml logs -f caddy
```

## 10) 운영 팁
- `deploy/.env.production`은 Git에 올리지 마세요.
- `POSTGRES_PASSWORD`, `JWT_SECRET`는 반드시 강하게 설정하세요.
- 서버 백업: PostgreSQL dump를 주기적으로 저장하세요.

DB 백업 예시:
```bash
cd ~/apps/About-Plan/deploy
mkdir -p ~/backups
set -a; source .env.production; set +a
docker compose --env-file .env.production -f docker-compose.public.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > ~/backups/about_plan_$(date +%F_%H%M%S).sql
```
