#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f ".env.production" ]; then
  echo "deploy/.env.production 파일이 없습니다."
  echo "먼저 deploy/.env.production.example 을 복사해서 값을 채워주세요."
  exit 1
fi

docker compose --env-file .env.production -f docker-compose.public.yml up -d --build
docker compose --env-file .env.production -f docker-compose.public.yml ps

echo
echo "배포 완료. 헬스체크:"
echo "curl -sS https://$(grep '^APP_DOMAIN=' .env.production | cut -d'=' -f2)/api/health"
