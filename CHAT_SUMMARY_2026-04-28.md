# 설문 앱 대화 정리 (2026-04-28)

## 1) 확인된 링크
- 학생용: `https://dyuits.github.io/survey-app/student.html`
- 교사용: `https://dyuits.github.io/survey-app/teacher.html`
- 학부모용: `https://dyuits.github.io/survey-app/parent.html`
- 관리자용: `https://dyuits.github.io/survey-app/admin.html`
- 저장소: `https://github.com/dyuits/survey-app`

## 2) 문제 원인
- 기존 구조는 응답을 기본적으로 브라우저 `localStorage`에 저장.
- 즉, 응답자 각자 기기에만 저장되어 관리자 PC에서 통합 집계가 안 보일 수 있음.

## 3) 적용한 개선
- `api-config.js` 추가:
  - `window.SURVEY_API_BASE`로 공통 API 주소 설정 가능.
- 설문 제출 로직 수정:
  - `submitResult(payload)` 경유로 서버 전송 시도.
- 관리자 통계 로직 수정:
  - `fetchResults()`로 서버 데이터 조회.
  - 새로고침 버튼 및 CSV 다운로드 동작 연결.
- Cloudflare Worker 샘플 추가:
  - 경로: `worker/src/index.js`, `worker/wrangler.toml`
  - `GET/POST/DELETE /results` 지원.
  - 동일 제출 중복 방지 로직 추가.
- 로컬 데이터 이관 기능 추가:
  - `migrateLocalResultsToRemote()` 구현.
  - 시작/설문/관리자 페이지 진입 시 로컬에 남은 과거 응답을 서버로 이관 시도.

## 4) 복구 가능/불가 범위
- 가능:
  - 응답자 기기에 아직 남아 있는 로컬 데이터는, 같은 브라우저로 페이지 재방문 시 서버 이관 가능.
- 불가:
  - 이미 사이트 데이터 삭제, 시크릿 모드, 브라우저 변경, 기기 교체/분실된 데이터는 복구 불가.

## 5) 운영 시 즉시 해야 할 일
1. Cloudflare Worker 배포 및 KV 연결.
2. 배포된 Worker URL을 `api-config.js`의 `window.SURVEY_API_BASE`에 입력.
3. GitHub Pages에 반영(푸시).
4. 응답자에게 기존 사용 브라우저로 링크 1회 재방문 안내(이관 목적).

## 6) 참고 파일
- `api-config.js`
- `data.js`
- `survey.js`
- `admin.js`
- `index.html`
- `worker/src/index.js`
- `worker/wrangler.toml`
- `WORKLOG.md`
