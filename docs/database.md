# PostgreSQL Migration Guide

## 목적

이 프로젝트의 정식 DB 체계는 PostgreSQL과 Prisma Migrate를 기준으로 한다. SQLite 직접 초기화 스크립트는 제거했으며, 스키마 변경은 `prisma/migrations`에 SQL migration으로 기록한다.

## 로컬 PostgreSQL 준비

예시 접속 정보:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/association_doctor_recommendation?schema=public"
```

로컬 DB 생성 예시:

```bash
createdb association_doctor_recommendation
```

Docker를 사용할 경우:

```bash
docker compose up -d postgres
```

## 명령

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

운영/배포 환경에서는 migration을 새로 만들지 않고 적용만 한다.

```bash
npm run db:deploy
```

개발 DB를 초기화하고 seed까지 다시 넣을 때:

```bash
npm run db:reset
```

## Migration 원칙

- DB 구조 변경은 `prisma/schema.prisma` 수정 후 `npm run db:migrate`로 migration 파일을 생성한다.
- 운영 반영은 `npm run db:deploy`만 사용한다.
- `prisma db push`는 정식 체계에서 사용하지 않는다.
- seed는 개발 및 검수용 데이터만 생성한다.

## 검수 기준

- `npx prisma validate`
- `npm run db:generate`
- PostgreSQL 연결 가능 환경에서 `npm run db:deploy`
- PostgreSQL 연결 가능 환경에서 `npm run db:seed`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
