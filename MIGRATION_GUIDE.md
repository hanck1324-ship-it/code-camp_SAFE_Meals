# Next.js 14 마이그레이션 가이드

이 프로젝트는 Vite + React에서 Next.js 14 (App Router)로 마이그레이션되었습니다.

## 주요 변경사항

### 1. 폴더 구조 변경

**이전 구조 (Vite):**

```
src/
  ├── App.tsx
  ├── main.tsx
  ├── components/
  ├── lib/
  └── styles/
```

**새 구조 (Next.js 14):**

```
app/                    # Next.js App Router
  ├── layout.tsx       # 루트 레이아웃
  ├── page.tsx         # 홈 페이지
  └── globals.css      # 전역 스타일
components/            # React 컴포넌트 (루트 레벨)
lib/                   # 유틸리티 및 라이브러리 (루트 레벨)
public/                # 정적 파일
  └── assets/          # 이미지 및 에셋
```

### 2. 설정 파일 변경

- `vite.config.ts` → `next.config.js` (더 이상 필요 없음)
- `index.html` → `app/layout.tsx` (더 이상 필요 없음)
- `tsconfig.json` 업데이트 (Next.js 경로 별칭 추가)
- `tailwind.config.ts` 업데이트 (Next.js 경로 포함)
- `postcss.config.js` 추가

### 3. Import 경로 변경

모든 상대 경로(`../`, `./`)를 절대 경로(`@/`)로 변경했습니다:

```typescript
// 이전
import { translations } from '../lib/translations';
import { Button } from './button';

// 이후
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
```

### 4. 이미지 경로 변경

```typescript
// 이전 (Vite)
import logo from 'figma:asset/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';

// 이후 (Next.js)
const logo = '/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';
```

### 5. 라우팅 변경

**이전 (SPA - 상태 기반):**

- `App.tsx`에서 `currentScreen` 상태로 화면 전환

**이후 (Next.js - 파일 기반 라우팅):**

- `app/page.tsx`가 홈 페이지
- 향후 각 화면을 별도 라우트로 분리 가능:
  - `app/login/page.tsx`
  - `app/signup/page.tsx`
  - `app/home/page.tsx`
  - 등등

### 6. 패키지 변경

**추가된 패키지:**

- `next`: Next.js 프레임워크
- `eslint-config-next`: Next.js ESLint 설정
- `autoprefixer`, `postcss`: Tailwind CSS를 위한 PostCSS 플러그인

**제거된 패키지:**

- `vite`: 더 이상 사용하지 않음
- `@vitejs/plugin-react-swc`: 더 이상 사용하지 않음

### 7. 스크립트 변경

```json
{
  "scripts": {
    "dev": "next dev", // 이전: "vite"
    "build": "next build", // 이전: "vite build"
    "start": "next start", // 새로 추가
    "lint": "next lint" // 새로 추가
  }
}
```

## 다음 단계

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. 향후 개선 사항

1. **라우팅 개선**: 각 화면을 별도 라우트로 분리

   ```typescript
   // app/login/page.tsx
   // app/signup/page.tsx
   // app/home/page.tsx
   ```

2. **서버 컴포넌트 활용**: 가능한 곳에서 서버 컴포넌트 사용

3. **이미지 최적화**: Next.js `Image` 컴포넌트 사용

   ```typescript
   import Image from 'next/image';
   ```

4. **메타데이터 추가**: 각 페이지에 적절한 메타데이터 추가

5. **API 라우트**: 필요시 `app/api/` 디렉토리에 API 라우트 추가

## 주의사항

- 기존 `src/` 디렉토리는 백업용으로 남겨두었습니다. 안전하게 마이그레이션이 완료되면 삭제할 수 있습니다.
- `vite.config.ts`와 `index.html`은 더 이상 사용되지 않지만, 참고용으로 남겨두었습니다.
