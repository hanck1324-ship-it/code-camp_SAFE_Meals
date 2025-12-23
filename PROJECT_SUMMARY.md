# SafeMeals 프로젝트 요약

## 한줄 소개
알레르기 정보 관리와 메뉴 스캔을 통해 외식 시 안전한 메뉴를 안내하는 다국어 지원 모바일 우선 Next.js 앱.

## 문제와 해결
- 문제: 외식 시 알레르기 위험 식별의 어려움, 언어 장벽, 메뉴판 직접 확인 부담.
- 해결: 카메라 스캔으로 AI가 알레르기 성분을 분석하고, PIN 보호 Safety Card와 다국어 UI로 안전한 메뉴 선택을 지원.

## 주요 기능
- 메뉴 스캔: Gemini OCR + 알레르기 분석으로 위험도(Safe/Caution/Warning/Danger) 표시.
- Safety Card: 4자리 PIN으로 보호된 알레르기 정보 카드(한/영 병기).
- 온보딩·프로필: 알레르기·식이 제한 설정, 알림·언어·보안 설정 관리.
- 인증: 로그인·회원가입 흐름, Supabase 기반 백엔드 연동 준비.
- 다국어: 한국어/영어/일본어/중국어/스페인어 지원, 타입 안전한 번역 키 관리.

## 기술 스택
- Next.js 14 (App Router), TypeScript(strict), Tailwind CSS, Radix UI/shadcn/ui.
- 상태/데이터: React Query, Zustand(`useAppStore`, `useLanguageStore`).
- 기타: React Hook Form, Lucide 아이콘, Supabase 클라이언트 준비.

## 아키텍처 및 폴더
- `src/app`: 페이지 라우팅 및 레이아웃(웹/모바일), API 라우트 스켈레톤.
- `src/features`: 기능 단위 모듈(스캔, 대시보드, 프로필 등)로 독립 구성.
- `src/components`: 재사용 UI와 도메인 공통 컴포넌트 집합(shadcn/ui 기반).
- `src/lib`: Supabase, 번역 리소스, 유틸.
- `src/hooks`: 커스텀 훅(`useTranslation`, `useHaccp` 등).

## 실행 방법
```bash
npm install
npm run dev   # http://localhost:3000
npm run build
npm start
```

## 진행 상황·주의사항
- 문서 통합: 17개 문서를 `Refactoring 사항/README.md` 하나로 정리 완료.
- 로고 경로: `/assets/Logo.png` 미존재로 현재 `/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png` 사용 중. 통일하려면 `public/assets/Logo.png` 추가 후 경로 교체 필요.
- 프롬프트 작업: 온보딩·프로필 하위 프롬프트 미작성 상태.

## 핵심 원칙
- 기능 기반 모듈화로 확장성/테스트 용이성 확보.
- 타입 안전성과 a11y를 중시(Radix UI, strict TS).
- Tailwind 중심 스타일링, 다국어/하드코딩 금지, 절대 경로(`@/`) 사용.
