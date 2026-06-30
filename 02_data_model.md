# 02_data_model.md

## 목표

촉탁의 추천관리 시스템의 핵심 데이터 모델을 정의하고 DB 스키마를 구현한다.

---

## 핵심 엔티티

### User

관리자 계정.

필드 예시:

- id
- name
- email
- passwordHash
- role
- isActive
- createdAt
- updatedAt

role:

```text
SUPER_ADMIN
STAFF
REVIEWER
READ_ONLY
```

---

### Doctor

촉탁의사 후보자.

필드 예시:

- id
- name
- licenseNumber
- medicalInstitutionName
- specialty
- phone
- email
- availableRegions
- availableDays
- maxFacilityCount
- currentFacilityCount
- educationStatus
- status
- memo
- createdAt
- updatedAt

status:

```text
AVAILABLE
NEEDS_REVIEW
FULL
ON_HOLD
STOPPED
```

educationStatus:

```text
COMPLETED
PENDING
UNKNOWN
```

---

### Facility

요양원.

필드 예시:

- id
- name
- facilityType
- address
- capacity
- currentResidents
- representativeName
- managerName
- phone
- email
- status
- memo
- createdAt
- updatedAt

status:

```text
NORMAL
NEEDS_DOCTOR
CONTRACT_EXPIRING
RERECOMMENDATION
INACTIVE
```

---

### EducationRecord

촉탁의사 교육 이수 정보.

- id
- doctorId
- courseName
- completedAt
- certificateFileId
- memo
- createdAt

---

### RecommendationRequest

요양원의 촉탁의 추천 요청.

- id
- facilityId
- requestType
- requestedSpecialty
- preferredDays
- reason
- status
- requestedAt
- reviewedAt
- completedAt
- memo
- createdBy
- createdAt
- updatedAt

requestType:

```text
NEW
CHANGE
RENEWAL
RERECOMMENDATION
```

status:

```text
RECEIVED
UNDER_REVIEW
CANDIDATES_SELECTED
SENT_TO_FACILITY
ASSIGNED
CONTRACT_REGISTERED
CLOSED
CANCELED
```

---

### RecommendationCandidate

추천 요청에 연결된 후보 의사.

- id
- recommendationRequestId
- doctorId
- rank
- reason
- selectedByAssociation
- sentToFacility
- createdAt

---

### Assignment

최종 지정 및 계약.

- id
- facilityId
- doctorId
- recommendationRequestId
- contractStartDate
- contractEndDate
- status
- registrationFee
- registrationFeePaid
- contractFileId
- memo
- createdAt
- updatedAt

status:

```text
ACTIVE
EXPIRING_SOON
EXPIRED
TERMINATED
RENEWAL_PENDING
```

---

### Complaint

민원/이슈.

- id
- facilityId
- doctorId
- assignmentId
- type
- title
- content
- status
- receivedAt
- resolvedAt
- memo
- createdAt
- updatedAt

type:

```text
SCHEDULE
COMMUNICATION
DOCUMENT
SCOPE_MISUNDERSTANDING
GUARDIAN
CONTRACT_CHANGE
OTHER
```

status:

```text
RECEIVED
UNDER_REVIEW
CHECKING
ADJUSTED
RERECOMMENDATION_NEEDED
CLOSED
```

---

### Document

첨부파일 및 생성 문서.

- id
- type
- fileName
- filePath
- mimeType
- size
- relatedEntityType
- relatedEntityId
- createdAt

type:

```text
CERTIFICATE
RECOMMENDATION_LETTER
CONTRACT
REQUEST_FORM
INTERNAL_NOTE
OTHER
```

---

### AuditLog

주요 작업 이력.

- id
- actorUserId
- action
- entityType
- entityId
- beforeJson
- afterJson
- createdAt

---

## 관계

| 관계 | 설명 |
|---|---|
| Doctor 1:N EducationRecord | 의사별 교육 이력 |
| Facility 1:N RecommendationRequest | 시설별 추천 요청 |
| RecommendationRequest 1:N RecommendationCandidate | 요청별 추천 후보 |
| Doctor 1:N RecommendationCandidate | 의사별 추천 이력 |
| Facility 1:N Assignment | 시설별 계약 이력 |
| Doctor 1:N Assignment | 의사별 담당 시설 이력 |
| Assignment 1:N Complaint | 계약 관련 민원 |
| Document N:1 Entity | 여러 엔티티에 파일 연결 |
| User 1:N AuditLog | 사용자 작업 이력 |

---

## 구현 지시

1. 현재 DB 도구를 확인한다.
2. 위 엔티티를 스키마로 구현한다.
3. 상태값은 enum 또는 안정적인 상수로 관리한다.
4. createdAt, updatedAt을 주요 테이블에 포함한다.
5. 삭제는 가능하면 soft delete를 고려한다.
6. 주요 검색 필드에 인덱스를 추가한다.
7. 기본 seed 데이터를 만든다.

---

## Seed 데이터

최소 아래 데이터가 있어야 한다.

- 관리자 1명
- 촉탁의사 5명
- 요양원 5곳
- 추천 요청 2건
- 계약 1건
- 민원 1건

---

## 검수 체크리스트

- [ ] DB 마이그레이션이 성공하는가?
- [ ] seed 데이터가 생성되는가?
- [ ] 주요 enum/status가 코드에서 재사용 가능한가?
- [ ] Doctor, Facility, RecommendationRequest 관계가 정상인가?
- [ ] Assignment가 Doctor/Facility와 연결되는가?
- [ ] AuditLog를 기록할 수 있는 구조인가?

## 다음 단계 이동 조건

DB 마이그레이션, seed, 기본 조회가 성공하면 `03_auth_admin.md`로 이동한다.
