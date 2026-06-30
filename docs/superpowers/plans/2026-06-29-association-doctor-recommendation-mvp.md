# 촉탁의 추천관리 시스템 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지역의사협의회 사무국이 촉탁의 추천, 지정, 계약, 민원, 재추천을 관리하는 관리자용 MVP를 구현한다.

**Architecture:** Next.js App Router와 서버 액션을 사용해 UI와 서버 검증을 같은 프로젝트에서 관리한다. Prisma/SQLite로 개발 DB를 구성하고, 업무 규칙은 `src/server/services`에 모아 테스트한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma, SQLite, Vitest, PDFKit

---

### Task 1: Project and Docs

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.env.example`, `docs/product_direction.md`, `docs/dev_notes.md`

- [x] 제품 방향과 제외 범위를 문서화한다.
- [x] Next.js, TypeScript, Prisma, Vitest 스크립트를 추가한다.
- [x] 기본 환경 변수 예시를 작성한다.

### Task 2: Data Model and Core Rules

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Create: `src/server/services/*.ts`
- Test: `tests/workflow.test.ts`, `tests/matching.test.ts`, `tests/dashboard.test.ts`

- [x] 테스트를 먼저 작성한다.
- [x] Prisma 모델과 enum을 구현한다.
- [x] seed 데이터를 작성한다.
- [x] 상태 전이, 후보 점수, 계약 만료, 대시보드 집계를 구현한다.

### Task 3: Auth and Admin Layout

**Files:**
- Create: `src/server/auth.ts`, `src/app/login/page.tsx`, `src/app/admin/layout.tsx`
- Modify: `src/app/page.tsx`

- [x] 관리자 로그인, 로그아웃, 세션을 구현한다.
- [x] 권한 기반 수정 차단과 설정 접근 제한을 구현한다.
- [x] 좌측 사이드바와 상단 사용자 영역을 구현한다.

### Task 4: Admin Workflows

**Files:**
- Create: `src/app/admin/doctors/*`, `src/app/admin/facilities/*`, `src/app/admin/requests/*`, `src/app/admin/assignments/*`, `src/app/admin/complaints/*`, `src/app/admin/documents/*`, `src/app/admin/settings/*`
- Create: `src/components/*`, `src/server/actions.ts`

- [x] 촉탁의사/요양원 CRUD를 구현한다.
- [x] 추천 요청 상태 관리와 후보 저장을 구현한다.
- [x] 추천서 PDF 생성과 발송 완료 처리를 구현한다.
- [x] 최종 지정/계약, 민원/재추천, 대시보드를 구현한다.

### Task 5: Verification and Notes

**Files:**
- Modify: `docs/dev_notes.md`

- [x] 타입 체크, 린트, 테스트, 빌드를 실행한다.
- [x] seed와 통합 검수 스크립트를 실행한다.
- [x] 파트별 검수 결과를 기록한다.
