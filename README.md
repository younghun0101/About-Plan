# About-Plan

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_g8wldsDxITP0zHEIFwtehi42XjtX)

## Getting Started

Prerequisite: Node.js `>=20.9.0` (this project is currently pinned to `20.20.2` via `.nvmrc`).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

## Deployment

- 인터넷 공개 배포 가이드: `docs/DEPLOYMENT_PUBLIC_KR.md`

### 무료 임시 공개 URL (터널)

- 생성일: `2026-04-01`
- 프론트 URL: `https://bd4b48a32ae624.lhr.life`
- 백엔드 URL: `https://304809b6bceecb.lhr.life`
- 상태: 생성 당시 외부 접속/로그인 API 동작 확인

### 무료 임시 공개 재실행 방법

1. 백엔드 실행 (CORS에 프론트 공개 URL 포함)

```bash
cd backend
export JAVA_HOME=/Users/hyh/About-Plan/.tools/java/jdk-21.0.10+7/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
export APP_CORS_ALLOWED_ORIGINS='https://<frontend-public-url>,http://localhost:3000,http://127.0.0.1:3000'
./gradlew --no-daemon bootRun
```

2. 프론트 실행 (백엔드 공개 URL 연결)

```bash
cd /Users/hyh/About-Plan
NEXT_PUBLIC_API_BASE_URL=https://<backend-public-url> npm run dev -- --hostname 0.0.0.0 --port 3000
```

3. 백엔드 터널 생성

```bash
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:8080 nokey@localhost.run
```

4. 프론트 터널 생성

```bash
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3000 nokey@localhost.run
```

### 주의사항

- `localhost.run` 무료 주소는 임시 주소라서 터널 세션이 끊기면 URL도 종료됩니다.
- 프론트 URL이 바뀌면 `APP_CORS_ALLOWED_ORIGINS` 값도 새 URL로 맞춰야 합니다.
- 장기 운영용 고정 도메인은 `docs/DEPLOYMENT_PUBLIC_KR.md`의 정식 배포 절차를 사용하세요.

<a href="https://v0.app/chat/api/kiro/clone/younghun0101/About-Plan" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
