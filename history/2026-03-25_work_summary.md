# Detailed Work Summary: 2026-03-25

## 1. 개요 및 세션 목표
본 세션에서는 서비스의 전체적인 안정성 향상과 검색 시스템의 고도화, 그리고 마이페이지 UI의 효율성 개선을 목표로 함. 사용자의 4가지 핵심 규칙을 준수하며 모든 수정을 사전 승인 후 진행함.

## 2. 기술적 수정 사항 상세

### 2.1. 데이터 매핑 및 버그 수정
- **상세 페이지 추천(좋아요) 상태 동기화**
    - **문제**: 사용자가 좋아요를 눌렀음에도 상세 페이지 재진입 시 버튼이 활성화되지 않음.
    - **원인**: 백엔드 응답 필드 `liked`가 프론트엔드 `isLiked` 상태와 매핑되지 않음.
    - **해결**: `fetchPostDetail` 내에서 `isLiked: !!(rawData.isLiked || rawData.liked)` 로직으로 보완.
- **새로고침 시 인증 튕김(Redirect) 버그**
    - **문제**: 로그인 상태에서 새로고침 시 "로그인이 필요한 서비스입니다" 알림 후 메인으로 리다이렉트됨.
    - **원인**: `UserContext`의 유저 정보 복구 지연 중(isLoading=true) `!user` 조건이 먼저 실행됨.
    - **해결**: `MyPage`, `WritePostPage`, `AdminMemberPage`의 `useEffect` 내부에 `if (isLoading) return;` 구문을 추가하여 인증 체크를 지연시킴.

### 2.2. 검색 시스템 고도화 (FTS & Debouncing)
- **통합 검색 파라미터 규격 수립**
    - 모든 검색 파라미터 명칭을 **`keyword`**로 통일 (URL 파라미터 포함).
    - **백엔드 규칙**: 검색어 부재 시 `keyword: null`을 전송하면 axios가 파라미터를 삭제하므로, 명시적으로 **빈 문자열(`""`)**을 전송하여 URL에 `?keyword=`가 포함되도록 강제함.
- **게시판 목록(`PracticeExams.tsx`) API 분기 로직**
    - **전문 검색(FTS)**: `keyword` 존재 시 `/api/board/searchContent` 호출 (파라미터: `keyword`, `boardType`, `page`, `size`).
    - **일반 페이징**: `keyword` 부재 시 `/api/board/list/paging` 호출 (파라미터: `boardType`, `category`, `keyword=""`, `page`, `size`).
- **성능 최적화 (Debouncing)**
    - `useRef`를 활용한 0.5초 타이머 구현. 타이핑 중단 0.5초 후 자동으로 검색 요청 수행.
    - `Enter` 키 입력 시 즉시 타이머를 `clearTimeout` 하고 검색 함수(`handleSearch`)를 직접 실행하여 즉각적인 피드백 제공.

### 2.3. UI/UX 및 인터랙션 개선
- **마이페이지 리스트형 리디자인**
    - 기존 `ScrappedPost` 카드를 가로형 `Row` 리스트로 변경.
    - 한 화면에 노출되는 정보 밀도를 높임 (제목 강조, 메타데이터 우측 배치).
    - `divide-y` 클래스를 활용한 구분선 및 `hover:bg-slate-50`을 통한 인터랙션 강화.
- **추천 버튼 단일 토글화**
    - 기존 '추천' / '추천 취소(빨간색)' 버튼을 하나의 버튼으로 통합.
    - `exam.isLiked` 상태에 따라 브랜드 컬러(`primary`) 배경색과 흰색 아이콘으로 동적 렌더링.
    - `framer-motion`의 `whileTap={{ scale: 0.9 }}`를 적용하여 클릭 피드백 개선.
- **선택적 툴팁(Tooltip) 적용**
    - 직관적인 아이콘(수정, 삭제 등)은 제거하고, 오해의 소지가 있는 아이콘(추천 취소, 링크 복사, 이미지 확대)에만 전략적으로 적용.

## 3. 세션 중 발생한 주요 에러 및 조치
- **ReferenceError: useRef is not defined**
    - **원인**: `import { useRef } from 'react'` 누락 및 `React.ChangeEvent` 사용 시 `React` 객체 참조 불가.
    - **조치**: 최상단 임포트를 `import React, { ..., useRef } from 'react'`로 정밀 수정.
- **ReferenceError: handleSearch is not defined**
    - **원인**: 함수명을 `handleSearchChange`로 리팩토링했으나 JSX 내 버튼의 `onClick` 핸들러가 예전 이름을 참조함.
    - **조치**: `handleSearch`를 `useCallback`으로 재정의하여 버튼 및 엔터 키 로직과 연결.

## 4. 향후 작업 가이드라인
- **파라미터 보안**: `keyword`는 항상 트림(`trim()`) 처리하여 전송할 것.
- **상태 관리**: 게시판 필터(카테고리, 태그) 변경 시 항상 `page=1`로 초기화하는 로직 유지할 것.

---
**기록 완료일**: 2026-03-25
**작업자**: Gemini CLI (Senior Engineer)
