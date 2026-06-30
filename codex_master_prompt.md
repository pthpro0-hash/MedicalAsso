# codex_master_prompt.md

아래 지시대로 개발을 진행하세요.

이 프로젝트는 지역의사협의회용 촉탁의 추천·등록·현황관리 시스템입니다.

먼저 `plans.md`를 읽고 전체 방향을 이해하세요.  
그다음 아래 파일을 반드시 순서대로 진행하세요.

1. `00_product_direction.md`
2. `01_project_setup.md`
3. `02_data_model.md`
4. `03_auth_admin.md`
5. `04_doctor_facility_management.md`
6. `05_recommendation_request.md`
7. `06_candidate_matching.md`
8. `07_document_generation.md`
9. `08_contract_status.md`
10. `09_complaint_rerecommendation.md`
11. `10_dashboard_report.md`

각 파트마다 다음 절차를 반드시 따르세요.

1. 해당 md 파일의 목표와 범위를 읽는다.
2. 현재 코드 구조를 확인한다.
3. 구현 계획을 짧게 작성한다.
4. 구현한다.
5. 자체 테스트와 검수를 수행한다.
6. 문제가 있으면 수정 후 다시 검수한다.
7. 검수 통과 시 `docs/dev_notes.md`에 완료 내용, 변경 파일, 테스트 결과, 남은 이슈를 기록한다.
8. 다음 파트로 넘어간다.

중요한 제한:
- 환자 진료기록, 처방, EMR, 공단 청구 기능은 개발하지 않는다.
- 초기 MVP는 관리자용 내부 업무관리 시스템이다.
- 외부 요양원/촉탁의사 포털은 이번 MVP 범위가 아니다.
- 모든 주요 상태 변경은 AuditLog로 남긴다.
- 각 단계에서 기능이 실제 UI에서 확인되어야 한다.
- 검수 통과 전 다음 파트로 넘어가지 않는다.

최종 완료 시 다음을 보고하세요.

1. 구현 완료 기능
2. 실행 방법
3. 테스트 방법
4. 검수 결과
5. 남은 이슈
6. 다음 개발 추천 항목
