# About Plan Backend (Kotlin + Spring Boot)

## License / Cost
- Spring Boot, Kotlin, PostgreSQL, Flyway, Docker 모두 오픈소스 기반으로 라이선스 비용 없이 사용 가능합니다.

## Prerequisites
- JDK 21
- Docker (PostgreSQL 로컬 실행 시)

## Environment variables
- `DB_URL` (default: `jdbc:postgresql://localhost:5432/about_plan`)
- `DB_USERNAME` (default: `about_plan`)
- `DB_PASSWORD` (default: `about_plan`)
- `PORT` (default: `8080`)
- `JWT_SECRET` (default: dev key, 운영에서는 반드시 변경)
- `APP_CORS_ALLOWED_ORIGINS` (default: `http://localhost:3000,http://127.0.0.1:3000`)

## Run PostgreSQL (free, local)
```bash
cd backend
docker compose up -d
```

## Run (PostgreSQL)
```bash
cd backend
./gradlew bootRun
```

## Run (로컬 빠른 실행, Docker 없이)
```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

## Health check
- `GET /api/health`

## Notes
- Flyway migration `V1__init_schema.sql`가 앱 시작 시 자동으로 적용됩니다.
- 공개배포 절차는 루트의 `docs/DEPLOYMENT_PUBLIC_KR.md`를 참고하세요.

## Auth API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

## Domain API
- `GET/POST/PATCH/DELETE /api/categories`
- `GET/POST/PATCH/DELETE /api/events`
- `GET/POST/PATCH/DELETE /api/goals`
- `GET/POST /api/shared-calendars`
- `GET/POST/PATCH/DELETE /api/meeting-notes`
- `GET/POST/DELETE /api/meeting-notes/{id}/events/{eventId}`
- `GET/POST/PATCH/DELETE /api/board-posts`
- `GET/POST /api/board-posts/{id}/items`
- `PATCH/DELETE /api/board-items/{id}`
