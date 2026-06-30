# dev_notes.md

## 개발 진행 기록

### 공통 정보
- 프로젝트명: 촉탁의 추천관리 시스템
- 기술 스택: Next.js 15, React 19, TypeScript, Prisma, SQLite, Vitest
- DB: SQLite 개발 DB (`DATABASE_URL=file:./dev.db`)
- 실행 명령: `npm run dev`
- 테스트 명령: `npm run test`
- Seed 명령: `npm run db:seed`

---

## 파트별 기록

## 00_product_direction

### 완료 여부
- 완료

### 구현 내용
- 관리자용 행정관리 솔루션 목적과 의료행위/EMR/청구/외부 로그인 제외 범위를 문서화.
- 상태 기반 추천 업무 흐름과 용어 정의를 정리.

### 변경 파일
- `docs/product_direction.md`
- `docs/superpowers/specs/2026-06-29-association-doctor-recommendation-design.md`

### 실행한 검수
- 타입 체크: 해당 없음
- 린트: 해당 없음
- 테스트: 해당 없음
- 빌드: 해당 없음
- 수동 확인: 제품 방향 문서에 포함/제외 범위와 행정관리 목적 반영 확인

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 01_project_setup

### 완료 여부
- 완료

### 구현 내용
- Next.js 15, React 19, TypeScript, Prisma, SQLite, Vitest 프로젝트 구조 생성.
- 관리자 공통 레이아웃, 글로벌 CSS, 로그인 페이지, 기본 라우팅 추가.
- 개발 서버 실행 확인.

### 변경 파일
- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.env`
- `.env.example`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/login/page.tsx`
- `src/app/admin/layout.tsx`

### 실행한 검수
- 타입 체크: `npm run typecheck` 통과
- 린트: `npm run lint` 통과
- 테스트: `npm run test` 통과
- 빌드: `npm run build` 통과
- 수동 확인: `http://127.0.0.1:3001/login` 200 응답 확인

### 발견한 문제
- Windows에서 `localhost` 요청이 지연되어 `127.0.0.1`로 확인.
- 상위 폴더 lockfile 경고가 있어 Next output tracing root 명시.

### 수정 내용
- `next.config.ts`에 `outputFileTracingRoot` 설정.

### 다음 파트 진행 가능 여부
- 가능

## 02_data_model

### 완료 여부
- 완료

### 구현 내용
- User, Doctor, Facility, EducationRecord, RecommendationRequest, RecommendationCandidate, Assignment, Complaint, Document, AuditLog 모델 구현.
- 핵심 상태값은 안정적인 string enum 상수와 라벨로 관리.
- Seed 데이터 생성: 관리자 3명, 촉탁의사 5명, 요양원 5곳, 추천 요청 2건, 후보 연결 요청 1건, 계약 2건, 민원 1건.

### 변경 파일
- `prisma/schema.prisma`
- `prisma/init-sqlite.ts`
- `prisma/seed.ts`
- `src/server/db.ts`
- `src/server/constants.ts`

### 실행한 검수
- 타입 체크: `npm run typecheck` 통과
- 린트: `npm run lint` 통과
- 테스트: `npm run test` 통과
- 빌드: `npm run build` 통과
- DB: `npm run db:generate`, `npm run db:init`, `npm run db:push`, `npm run db:seed` 통과

### 발견한 문제
- Prisma 6.19 계열 schema engine 및 generated default export가 현재 환경에서 실패.

### 수정 내용
- Prisma와 Prisma Client를 6.10.1로 고정.
- SQLite 직접 초기화 스크립트 추가 후 `db:push`도 정상 동작 확인.

### 다음 파트 진행 가능 여부
- 가능

## 03_auth_admin

### 완료 여부
- 완료

### 구현 내용
- 관리자 로그인/로그아웃, HMAC 서명 쿠키 세션 구현.
- 권한 구조 SUPER_ADMIN, STAFF, REVIEWER, READ_ONLY 적용.
- READ_ONLY 서버 액션 수정 차단 및 설정 사용자 관리 SUPER_ADMIN 제한.

### 변경 파일
- `src/server/auth.ts`
- `src/server/services/workflow.ts`
- `src/server/actions.ts`
- `src/app/login/login-form.tsx`
- `src/app/admin/settings/users/page.tsx`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: `tests/workflow.test.ts` 통과
- 빌드: 통과
- 수동 확인: 로그인 페이지 200 응답, 스모크에서 READ_ONLY 수정 차단 확인

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 04_doctor_facility_management

### 완료 여부
- 완료

### 구현 내용
- 촉탁의사/요양원 목록, 검색, 필터, 등록, 상세, 수정 폼 구현.
- 상태 배지, 교육 상태, 계약/요청/민원 이력 표시.
- 생성/수정/상태변경 AuditLog 기록.

### 변경 파일
- `src/app/admin/doctors/page.tsx`
- `src/app/admin/doctors/[id]/page.tsx`
- `src/app/admin/facilities/page.tsx`
- `src/app/admin/facilities/[id]/page.tsx`
- `src/components/entity-forms.tsx`
- `src/server/actions.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: 통과
- 빌드: 통과
- 수동 확인: 스모크에서 의사/요양원 생성 및 AuditLog 확인

### 발견한 문제
- Next page 파일에서 임의 named export를 허용하지 않음.

### 수정 내용
- DoctorForm, FacilityForm을 `src/components/entity-forms.tsx`로 분리.

### 다음 파트 진행 가능 여부
- 가능

## 05_recommendation_request

### 완료 여부
- 완료

### 구현 내용
- 추천 요청 목록, 등록, 상세, 상태 변경 구현.
- 상태 변경 규칙 검증과 AuditLog 기록 구현.
- 요양원 연결 및 상태별 필터 구현.

### 변경 파일
- `src/app/admin/requests/page.tsx`
- `src/app/admin/requests/[id]/page.tsx`
- `src/server/services/workflow.ts`
- `src/server/actions.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: `tests/workflow.test.ts` 통과
- 빌드: 통과
- 수동 확인: 스모크에서 추천 요청 생성, 상태 전이 검증, AuditLog 확인

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 06_candidate_matching

### 완료 여부
- 완료

### 구현 내용
- 추천 요청 상세에서 후보 검색, 점수 표시, 복수 후보 선택, 순위/사유 저장 구현.
- 교육 이수, 추천 가능 상태, 전문과목, 지역, 담당 시설 수 기준 점수 계산.
- 보류/중지 상태 의사 저장 차단.

### 변경 파일
- `src/server/services/matching.ts`
- `src/app/admin/requests/[id]/page.tsx`
- `src/server/actions.ts`
- `tests/matching.test.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: `tests/matching.test.ts` 통과
- 빌드: 통과
- 수동 확인: 스모크에서 후보 2명 저장 및 추천 점수 검증

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 07_document_generation

### 완료 여부
- 완료

### 구현 내용
- 추천서 미리보기 텍스트 생성.
- PDFKit 기반 추천서 PDF 생성.
- Windows Malgun Gothic 폰트가 있으면 한글 폰트로 PDF 렌더링.
- Document 테이블 저장 및 다운로드 API 구현.
- 발송 완료 처리와 AuditLog 기록 구현.

### 변경 파일
- `src/server/services/documents.ts`
- `src/app/admin/requests/[id]/page.tsx`
- `src/app/admin/documents/page.tsx`
- `src/app/api/documents/[id]/route.ts`
- `src/server/actions.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: 통과
- 빌드: 통과
- 수동 확인: 스모크에서 PDF 파일 생성, Document 저장, 발송 상태 검증

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 08_contract_status

### 완료 여부
- 완료

### 구현 내용
- 최종 지정 의사 선택 및 계약 시작일/종료일 등록 구현.
- 계약 만료 30일 이내 EXPIRING_SOON 계산.
- 계약 현황 목록, 등록비/납부 여부, 만료 상태 갱신 구현.
- 계약 등록 및 상태 변경 AuditLog 기록.

### 변경 파일
- `src/app/admin/assignments/page.tsx`
- `src/app/admin/requests/[id]/page.tsx`
- `src/server/services/workflow.ts`
- `src/server/actions.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: 통과
- 빌드: 통과
- 수동 확인: 스모크에서 최종 지정/계약 생성, 대시보드 집계 확인

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 09_complaint_rerecommendation

### 완료 여부
- 완료

### 구현 내용
- 민원 목록, 등록, 상세, 상태 변경 구현.
- 환자 진료기록/처방/민감 건강정보 입력 금지 안내 표시.
- RERECOMMENDATION_NEEDED 상태에서 재추천 요청 생성 구현.
- 민원 및 재추천 AuditLog 기록.

### 변경 파일
- `src/app/admin/complaints/page.tsx`
- `src/app/admin/complaints/[id]/page.tsx`
- `src/server/actions.ts`

### 실행한 검수
- 타입 체크: 통과
- 린트: 통과
- 테스트: 통과
- 빌드: 통과
- 수동 확인: 스모크에서 민원 생성, 재추천 요청 생성, READ_ONLY 차단 확인

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

## 10_dashboard_report

### 완료 여부
- 완료

### 구현 내용
- 필수 KPI 12종 집계.
- 오늘 처리할 추천 요청, 계약 만료 예정, 민원 처리 대기, 확인 필요한 촉탁의사 업무 큐 표시.
- 빠른 액션 버튼 연결.
- 통합 스모크 검수 스크립트 추가.

### 변경 파일
- `src/app/admin/dashboard/page.tsx`
- `src/server/services/dashboard.ts`
- `tests/dashboard.test.ts`
- `scripts/smoke.ts`

### 실행한 검수
- 타입 체크: `npm run typecheck` 통과
- 린트: `npm run lint` 통과
- 테스트: `npm run test` 통과, 3 files / 7 tests passed
- 빌드: `npm run build` 통과
- 수동 확인: `http://127.0.0.1:3001/login` 200 응답
- 통합 스모크: `npm run smoke` 통과

### 발견한 문제
- 없음

### 수정 내용
- 없음

### 다음 파트 진행 가능 여부
- 가능

---

## Seed 계정

- SUPER_ADMIN: `admin@example.com` / `Admin123!`
- STAFF: `staff@example.com` / `Admin123!`
- READ_ONLY: `readonly@example.com` / `Admin123!`

## 최종 검수 요약

- DB 생성/동기화: `npm run db:generate`, `npm run db:init`, `npm run db:push`, `npm run db:seed` 통과
- 타입 체크: `npm run typecheck` 통과
- 린트: `npm run lint` 통과
- 테스트: `npm run test` 통과
- 빌드: `npm run build` 통과
- 통합 시나리오: `npm run smoke` 통과
- 개발 서버: `http://127.0.0.1:3001/login`

## 추가 작업 메모

### 2026-06-30 UI/운영 보완
- 대시보드 KPI 카드 클릭 시 상세 내역 팝업 표시 및 관리 화면 이동 기능 추가.
- 주요 신규 등록 폼을 목록 화면 인라인 영역에서 상단 버튼 기반 팝업으로 이동.
- 추천서 PDF 생성 시 Next 번들 내부에서 PDFKit 기본 폰트 파일을 찾지 못하던 문제를 `serverExternalPackages: ["pdfkit"]`로 해결.
- 전체 관리자 UI를 밝은 카드형 CMS 스타일로 정리하고, cyan 포인트 컬러와 부드러운 그림자 중심의 카카오스타일 톤을 적용.
- 검수: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` 통과.
