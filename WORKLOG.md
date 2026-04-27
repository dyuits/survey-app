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
- 현재 데이터 저장 방식:
  - 브라우저 localStorage 기반
  - 같은 브라우저/기기에서 제출한 데이터만 관리자 화면에 합산됨
- 여러 기기 응답을 하나로 모으려면:
  - Google Sheets / Firebase / Supabase 등 서버 저장소 연동 필요
  - `window.SURVEY_API_BASE`를 설정하면 링크 배포에서도 통합 저장 가능

## 링크 배포(정적 호스팅) 가이드
- 권장: GitHub Pages, Netlify, Vercel 중 정적 배포
- 기본 동작:
  - 서버 없이도 설문 제출/통계 확인 가능
  - 단, 기기별 브라우저 저장소 기준이라 통합 집계는 되지 않음
- 통합 집계가 필요하면:
  - API를 별도 배포 후 각 페이지에 아래 설정 추가
  - 예시:
  ```html
  <script>window.SURVEY_API_BASE = "https://your-api.example.com/api";</script>
  ```

## 주요 수정 이력(요약)
1. 초기 단일 설문 앱 생성
2. 학생/교사/학부모/관리자 페이지 분리
3. 이미지 기반 문항 반영(각 대상별 24문항)
4. 관리자 비밀번호 노출 문구 제거
5. 관리자 통계 그래프 개선(막대 + 파이 전환)
6. 설문 섹션 제목 표기 개선:
   - 1. AI 디지털 리터러시 역량
   - 2. 사회정서 설문문항

## 저장소
- GitHub: https://github.com/dyuits/survey-app
