# SafeMeals App Design

This is a Next.js 14 project for SafeMeals App Design. The original project is available at https://www.figma.com/design/fGAuThpvHIa1La2c6waZJB/SafeMeals-App-Design.

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지
│   └── globals.css        # 전역 스타일
├── components/            # React 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── onboarding/       # 온보딩 관련 컴포넌트
│   ├── profile/          # 프로필 관련 컴포넌트
│   ├── screens/          # 화면 컴포넌트
│   └── ui/               # UI 컴포넌트 (shadcn/ui)
├── lib/                  # 유틸리티 및 라이브러리
│   ├── translations.ts   # 다국어 번역
│   └── translations-clean.ts
├── public/               # 정적 파일
│   └── assets/          # 이미지 및 에셋
├── next.config.js       # Next.js 설정
├── tailwind.config.ts   # Tailwind CSS 설정
├── tsconfig.json        # TypeScript 설정
└── package.json         # 프로젝트 의존성
```

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

## 기술 스택

- **Next.js 14** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Radix UI** - 접근성 있는 UI 컴포넌트
- **React Hook Form** - 폼 관리
- **Lucide React** - 아이콘

## 주요 기능

- 사용자 인증 및 온보딩
- 알레르기 및 식이 제한 관리
- 메뉴 스캔 및 안전성 확인
- 다국어 지원 (한국어, 영어, 일본어, 중국어, 스페인어)
- 프로필 관리
