# Survey App Worklog

## 프로젝트 개요
- 프로젝트명: 학교 설문 배포 웹앱
- 목적: 학생용/교사용/학부모용 설문 배포 + 관리자 통계 확인
- 배포: GitHub Pages

## 배포 링크
- 메인: https://dyuits.github.io/survey-app/
- 학생용: https://dyuits.github.io/survey-app/student.html
- 교사용: https://dyuits.github.io/survey-app/teacher.html
- 학부모용: https://dyuits.github.io/survey-app/parent.html
- 관리자: https://dyuits.github.io/survey-app/admin.html

## 핵심 기능
- 대상별 설문 분리:
  - 학생용, 교사용, 학부모용 개별 페이지 제공
- 설문 구성:
  - AI 디지털 리터러시 역량 12문항
  - 사회정서 설문문항 12문항
  - 총 24문항, 리커트 5점 척도
- UI/UX:
  - 모바일 가독성/터치 사용성 중심 카드형 UI
  - 각 문항 응답 선택 버튼 가로 5칸 표시
  - 학교명 상단 표기: 제주중앙고등학교(2026학년도 연구학교 지정)
- 관리자 대시보드:
  - 통계 카드(응답 건수, 영역별 평균, 전체 평균)
  - 그래프 표시:
    - 막대 그래프
    - 원형(파이) 그래프
  - 그래프 형식 전환 셀렉트 제공

## 보안/운영 메모
- 관리자 페이지는 비밀번호 입력 후 접근 가능
- 메인 화면에 비밀번호 숫자 직접 노출하지 않음
- 데이터 저장 방식 (둘 중 하나):
  - **`api-config.js`의 `SURVEY_API_BASE`가 비어 있음:** 브라우저 localStorage만 사용. 같은 기기에서만 관리자 통계에 보임.
  - **API 주소를 넣음:** 제출·통계·CSV·초기화가 모두 해당 API(JSON `GET/POST/DELETE …/results`)를 사용해 여러 기기 응답이 한곳에 모임.
- 저장소에 포함된 **Cloudflare Worker** (`worker/`): KV에 설문 배열을 저장하는 경량 API. 배포 절차:
  1. Cloudflare 계정에서 Wrangler 로그인: `npx wrangler login`
  2. KV 네임스페이스 생성: `cd worker && npx wrangler kv namespace create SURVEY`
  3. 출력된 `id`를 `worker/wrangler.toml`의 `REPLACE_WITH_KV_NAMESPACE_ID` 자리에 붙여넣기
  4. 배포: `npx wrangler deploy`
  5. 배포된 Worker URL(예: `https://survey-app-results.xxx.workers.dev`)을 `api-config.js`의 `window.SURVEY_API_BASE`에 넣고(끝 슬래시 없음) GitHub에 푸시해 Pages에 반영

## 링크 배포(정적 호스팅) 가이드
- 권장: GitHub Pages, Netlify, Vercel 중 정적 배포
- **여러 사람이 링크로 응답하고 관리자에서 합산하려면** 반드시 위 API(Worker 등)를 배포하고 `api-config.js`를 수정한 뒤 같은 저장소로 Pages를 갱신할 것.
- API 없이 쓰는 경우: 데모·동일 PC 테스트용으로만 적합.

## 주요 수정 이력(요약)
1. 초기 단일 설문 앱 생성
2. 학생/교사/학부모/관리자 페이지 분리
3. 이미지 기반 문항 반영(각 대상별 24문항)
4. 관리자 비밀번호 노출 문구 제거
5. 관리자 통계 그래프 개선(막대 + 파이 전환)
6. 설문 섹션 제목 표기 개선:
   - 1. AI 디지털 리터러시 역량
   - 2. 사회정서 설문문항
7. 통합 집계: `api-config.js` + `submitResult`/`fetchResults` 연동, 관리자 새로고침·CSV, Cloudflare Worker 샘플 추가
8. 예전 로컬 전용 제출 복구: `migrateLocalResultsToRemote()` — 시작/설문/관리자 페이지 방문 시 같은 브라우저에 남은 응답을 API로 전송. Worker는 동일 지문 중복 저장 방지

## 저장소
- GitHub: https://github.com/dyuits/survey-app
