# 촉탁의 추천관리 시스템 MVP 설계

## 범위

지역의사협의회 사무국용 내부 관리자 MVP를 구현한다. 환자 진료기록, 처방, EMR, 공단 청구, 외부 로그인, 카카오 로그인, 알림톡/SMS 실발송은 구현하지 않는다.

## 접근

빈 저장소이므로 Next.js App Router, Prisma, SQLite, TypeScript 기반으로 구성한다. 관리자 인증은 내부 계정과 서명 쿠키 세션으로 구현하고, 권한은 서버 액션에서 `READ_ONLY` 수정 차단과 설정 접근 제한을 적용한다.

## 핵심 모듈

- Prisma 데이터 모델: User, Doctor, Facility, EducationRecord, RecommendationRequest, RecommendationCandidate, Assignment, Complaint, Document, AuditLog
- 서비스 로직: 상태 전이 검증, 후보 점수 계산, 계약 만료 계산, 대시보드 집계, AuditLog 기록
- UI: 좌측 사이드바, 상단 사용자 정보, 목록/상세/폼, 상태 배지, 주요 액션 버튼
- 문서: 추천서 PDF 생성 후 로컬 `uploads` 저장 및 Document 레코드 기록

## 검증

업무 규칙은 Vitest로 테스트한다. 최종 검증은 타입 체크, 린트, 테스트, 빌드, seed 및 통합 시나리오용 스모크 스크립트로 확인한다.
