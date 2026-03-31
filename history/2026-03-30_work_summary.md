# Detailed Work Summary: 2026-03-30

## 1. 개요 및 세션 목표
본 세션에서는 백엔드의 보안 설정 변경(JWT 엄격 적용 및 URL 구조 개편)에 대응하여 프론트엔드 전반의 API 연동 규격을 최신화하고, 고질적인 토큰 리프레시 버그 및 브라우저 히스토리 꼬임 문제를 해결하여 시스템의 완성도를 높임.

## 2. 주요 작업 및 기술적 성과

### 2.1. 토큰 리프레시 시스템 정상화 (`api.ts`, `UserContext.tsx`)
- **현상**: 토큰 만료 시 스토리지는 갱신되나 리액트 상태가 동기화되지 않아 로그아웃 처리되거나 옛날 토큰을 계속 사용하는 문제.
- **수정**: 
    - 스토리지 업데이트 **직전**에 이전 토큰과 비교하도록 로직 순서 교정 (`isTokenChanged` 플래그 정확도 확보).
    - `UserContext`에서 `auth-token-refreshed` 이벤트를 수신하여 기존 유저 정보와 새 토큰을 안전하게 병합(Mapping)하도록 개선.
    - 리프레시 최종 실패 시 `auth-error` 이벤트를 통해 전역적으로 세션을 정리하는 로직 추가.

### 2.2. 백엔드 보안 가이드에 따른 API URL 전면 개편
백엔드 구조 변경에 맞춰 프론트엔드 호출 경로를 일제히 수정함.
- **인증(Auth)**: `/api/common` -> `/api/auth` (signIn, signUp, token-refresh).
- **회원(Member)**: `/api/common` -> `/api/member` (profile-image, deleteMember).
- **게시판(Board)**:
    - 상세 조회: `/api/board/detailContent` -> `/api/board/list/detail/{boardId}`.
    - 내 글 목록: `/api/board/myBoardPage` -> `/api/board/my-list`.
    - 내 스크랩: `/api/board/myScrapPage` -> `/api/board/searchScrapMyPage`.
    - 파일 다운로드: `/api/board/file/download/{id}` -> `/api/board/download/{fileId}`.
- **상호작용**: 스크랩 등록/취소(`insertBoardScrap`, `deleteMyScrapPage`) 명세 준수.

### 2.3. 보안 로직 및 인터셉터 강화
- **명시적 헤더 제거**: `WritePostPage.tsx` 등에서 수동으로 부착하던 `Authorization` 헤더를 제거하고, `api.ts` 인터셉터가 항상 스토리지의 최신 토큰을 강제 주입하도록 일원화함.
- **효과**: 리프레시 직후 재시도 시 옛날 토큰이 새 토큰을 덮어씌우는 충돌 현상을 원천 차단.

### 2.4. 브라우저 히스토리 트랩 해결 (`WritePostPage.tsx`)
- **현상**: 게시글 수정 완료 후 뒤로가기를 누르면 이전 수정 창이 계속해서 다시 나타나는 현상.
- **수정**: 
    - 저장 성공 시 `isSuccessfullySubmitted` 플래그를 즉시 활성화하여 `popstate` 이벤트 무력화.
    - 상세 페이지 이동 전 `window.history.back()`을 실행하여 방어용으로 생성했던 가짜 히스토리 엔트리를 제거.
    - 그 후 `replace: true`로 이동하여 스택을 `[목록, 상세]` 순으로 깔끔하게 정리.

## 3. 향후 작업 가이드라인
- **API 호출 시**: 가급적 개별 헤더를 설정하지 말고 공통 인터셉터(`api.ts`)를 신뢰할 것.
- **경로 변수**: 백엔드 가이드에 따라 ID 값은 쿼리 파라미터가 아닌 경로 변수(`${id}`) 형식을 우선 사용할 것.
- **히스토리 관리**: 작성/수정 페이지 진입 시 생성되는 가짜 스택은 반드시 종료 시(성공/취소) 적절히 제거(back) 처리할 것.

---
**기록 완료일**: 2026-03-30
**작업자**: Gemini CLI (Senior Engineer)
