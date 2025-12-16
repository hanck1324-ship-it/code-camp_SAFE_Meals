# Hooks 사용 가이드

## 📚 useTranslation 훅

전역 다국어 상태를 관리하는 커스텀 훅입니다.

### ✨ 주요 특징

- ✅ **Prop Drilling 제거**: 언어 props를 계층마다 전달할 필요 없음
- ✅ **자동 저장**: 언어 설정이 localStorage에 자동 저장
- ✅ **타입 안전성**: TypeScript 완벽 지원
- ✅ **간단한 API**: 직관적이고 사용하기 쉬움

---

## 🚀 기본 사용법

### 1. 컴포넌트에서 번역 사용

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function MyPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t.appName}</h1>
      <p>{t.tagline}</p>
      <button>{t.getStarted}</button>
    </div>
  );
}
```

### 2. 언어 변경하기

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSettings() {
  const { t, language, setLanguage, languageName } = useTranslation();

  return (
    <div>
      <h1>{t.language}</h1>
      <p>현재 언어: {languageName}</p>
      
      <button onClick={() => setLanguage('ko')}>한국어</button>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('ja')}>日本語</button>
      <button onClick={() => setLanguage('zh')}>中文</button>
      <button onClick={() => setLanguage('es')}>Español</button>
    </div>
  );
}
```

### 3. LanguageSelector 컴포넌트 사용

Props 전달 없이 바로 사용 가능합니다:

```tsx
import { LanguageSelector } from '@/components/language-selector';

export default function Header() {
  return (
    <header>
      <h1>SafeMeals</h1>
      <LanguageSelector />
    </header>
  );
}
```

---

## 📖 API 레퍼런스

### useTranslation()

```typescript
function useTranslation(): {
  t: TranslationObject;
  language: Language;
  setLanguage: (lang: Language) => void;
  languageName: string;
}
```

#### 반환 값

| 속성 | 타입 | 설명 |
|------|------|------|
| `t` | `TranslationObject` | 현재 언어의 모든 번역 텍스트 |
| `language` | `'ko' \| 'en' \| 'ja' \| 'zh' \| 'es'` | 현재 선택된 언어 코드 |
| `setLanguage` | `(lang: Language) => void` | 언어 변경 함수 |
| `languageName` | `string` | 현재 언어의 표시 이름 |

---

## 💡 고급 사용법

### 1. 조건부 번역

```tsx
const { t, language } = useTranslation();

const greeting = language === 'ko' 
  ? '안녕하세요' 
  : 'Hello';
```

### 2. 유틸리티 함수

```tsx
import { getTranslation, getSupportedLanguages } from '@/hooks/useTranslation';

// 특정 언어의 번역 가져오기
const koreanAppName = getTranslation('ko', 'appName');

// 지원 언어 목록
const languages = getSupportedLanguages();
// [
//   { code: 'ko', name: '한국어' },
//   { code: 'en', name: 'English' },
//   ...
// ]
```

### 3. Server Component에서 사용

Server Component에서는 직접 translations를 import하세요:

```tsx
// app/page.tsx (Server Component)
import { translations } from '@/lib/translations';

export default function HomePage() {
  const t = translations['ko']; // 기본 언어

  return <h1>{t.appName}</h1>;
}
```

---

## 🔧 마이그레이션 가이드

### Before (Props 전달 방식)

```tsx
// ❌ 이전 방식: Props를 계속 전달해야 함
function ParentComponent() {
  const [language, setLanguage] = useState('ko');
  
  return (
    <ChildComponent 
      language={language} 
      onLanguageChange={setLanguage} 
    />
  );
}

function ChildComponent({ language, onLanguageChange }) {
  const t = translations[language];
  return <div>{t.appName}</div>;
}
```

### After (useTranslation 훅 사용)

```tsx
// ✅ 새로운 방식: 각 컴포넌트에서 독립적으로 사용
function ParentComponent() {
  return <ChildComponent />;
}

function ChildComponent() {
  const { t } = useTranslation();
  return <div>{t.appName}</div>;
}
```

---

## ⚠️ 주의사항

### 1. Client Component에서만 사용

```tsx
'use client'; // 필수!

import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { t } = useTranslation();
  // ...
}
```

### 2. 번역 키 확인

TypeScript가 자동 완성과 타입 체크를 제공합니다:

```tsx
const { t } = useTranslation();

t.appName     // ✅ OK
t.tagline     // ✅ OK
t.wrongKey    // ❌ 타입 에러!
```

---

## 🐛 문제 해결

### Q: 언어 변경이 저장되지 않아요

A: `useAppStore`가 persist 미들웨어와 함께 설정되어 있는지 확인하세요.

### Q: Server Component에서 useTranslation을 사용할 수 없어요

A: Server Component에서는 직접 `translations`를 import하세요:

```tsx
import { translations } from '@/lib/translations';
const t = translations['ko'];
```

### Q: 번역 텍스트가 업데이트되지 않아요

A: 브라우저를 새로고침하거나 개발 서버를 재시작하세요.

---

## 📚 관련 문서

- [Zustand 공식 문서](https://docs.pmnd.rs/zustand)
- [Next.js i18n 가이드](https://nextjs.org/docs/advanced-features/i18n-routing)
- [프로젝트 CODING_RULES.md](/common-rules/CODING_RULES.md)

