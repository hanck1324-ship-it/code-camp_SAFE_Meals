# 🌍 SafeMeals 다국어 사용 가이드

> **유지보수하기 쉬운 다국어 구조**를 위한 빠른 참조 가이드

---

## 🎯 핵심 개념

### ❌ 하지 말아야 할 것

```tsx
// ❌ Props로 언어 전달 (Prop Drilling)
function Parent() {
  const [language, setLanguage] = useState('ko');
  return <Child language={language} />;
}

function Child({ language }: { language: string }) {
  return <GrandChild language={language} />;
}
```

### ✅ 올바른 방법

```tsx
// ✅ useTranslation 훅 사용
function Parent() {
  return <Child />;
}

function Child() {
  const { t } = useTranslation();
  return <div>{t.appName}</div>;
}
```

---

## 📖 3단계 사용법

### 1️⃣ 훅 import

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';
```

### 2️⃣ 컴포넌트에서 사용

```tsx
export default function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t.appName}</h1>;
}
```

### 3️⃣ 언어 변경 (필요한 경우만)

```tsx
const { t, setLanguage } = useTranslation();

<button onClick={() => setLanguage('en')}>English</button>;
```

---

## 🔧 주요 API

### useTranslation()

| 반환값         | 타입       | 설명           | 예시                     |
| -------------- | ---------- | -------------- | ------------------------ |
| `t`            | `object`   | 번역 객체      | `t.appName`, `t.tagline` |
| `language`     | `string`   | 현재 언어 코드 | `'ko'`, `'en'`, `'ja'`   |
| `setLanguage`  | `function` | 언어 변경      | `setLanguage('en')`      |
| `languageName` | `string`   | 언어 표시명    | `'한국어'`, `'English'`  |

---

## 💡 자주 사용하는 패턴

### 패턴 1: 기본 텍스트 표시

```tsx
const { t } = useTranslation();

<div>
  <h1>{t.appName}</h1>
  <p>{t.tagline}</p>
</div>;
```

### 패턴 2: 버튼 텍스트

```tsx
const { t } = useTranslation();

<button className="...">{t.getStarted}</button>
<button className="...">{t.scanMenu}</button>
```

### 패턴 3: 폼 필드

```tsx
const { t } = useTranslation();

<input type="email" placeholder={t.emailPlaceholder} aria-label={t.email} />;
```

### 패턴 4: 언어 선택기

```tsx
import { LanguageSelector } from '@/components/language-selector';

<header>
  <Logo />
  <LanguageSelector /> {/* Props 불필요! */}
</header>;
```

---

## 📁 프로젝트 구조

```
src/
├── commons/stores/
│   └── useAppStore.ts          # ✅ Zustand 스토어 (언어 상태 관리)
├── hooks/
│   ├── useTranslation.ts       # ✅ 메인 훅
│   └── README.md               # 상세 문서
├── lib/
│   └── translations.ts         # ✅ 모든 번역 데이터
└── components/
    └── language-selector.tsx   # ✅ 언어 선택 컴포넌트
```

---

## 🎨 실전 예시

### 예시 1: 프로필 페이지

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/language-selector';

export default function ProfilePage() {
  const { t } = useTranslation();

  return (
    <div>
      <header>
        <h1>{t.myProfile}</h1>
        <LanguageSelector />
      </header>

      <section>
        <h2>{t.safetyProfile}</h2>
        <div>
          <h3>{t.allergies}</h3>
          {/* 알레르기 목록 */}
        </div>
      </section>
    </div>
  );
}
```

### 예시 2: 설정 페이지

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsPage() {
  const { t, language, setLanguage, languageName } = useTranslation();

  return (
    <div>
      <h1>{t.language}</h1>
      <p>현재: {languageName}</p>

      <div>
        <button onClick={() => setLanguage('ko')}>한국어</button>
        <button onClick={() => setLanguage('en')}>English</button>
      </div>
    </div>
  );
}
```

### 예시 3: 스캔 결과 화면

```tsx
'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function ScanResultPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t.scanComplete}</h1>
      <p>{t.itemsDetected}</p>

      <div>
        <span className="badge-safe">{t.safe}</span>
        <span className="badge-warning">{t.warning}</span>
        <span className="badge-danger">{t.danger}</span>
      </div>
    </div>
  );
}
```

---

## 🆕 새 번역 추가하는 방법

### 1. translations.ts 수정

```typescript
// src/lib/translations.ts
export const translations = {
  ko: {
    // ... 기존 번역들
    myNewKey: '새로운 번역', // ✅ 추가
  },
  en: {
    // ... 기존 번역들
    myNewKey: 'New Translation', // ✅ 추가
  },
  ja: {
    // ... 기존 번역들
    myNewKey: '新しい翻訳', // ✅ 추가
  },
  // zh, es도 동일하게 추가
};
```

### 2. 컴포넌트에서 사용

```tsx
const { t } = useTranslation();

<div>{t.myNewKey}</div>; // ✅ 자동 완성 지원!
```

---

## ⚠️ 주의사항

### 1. Client Component에서만 사용

```tsx
'use client'; // ✅ 필수!

import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { t } = useTranslation();
  // ...
}
```

### 2. Server Component는 직접 import

```tsx
// Server Component
import { translations } from '@/lib/translations';

export default function ServerComponent() {
  const t = translations['ko']; // 기본 언어 사용
  return <div>{t.appName}</div>;
}
```

### 3. 모든 언어에 번역 추가

```typescript
// ❌ 잘못됨: 한 언어만 추가
ko: {
  newKey: '번역';
}

// ✅ 올바름: 모든 언어에 추가
ko: {
  newKey: '번역';
}
en: {
  newKey: 'Translation';
}
ja: {
  newKey: '翻訳';
}
zh: {
  newKey: '翻译';
}
es: {
  newKey: 'Traducción';
}
```

---

## 🚀 성능 최적화

### 선택적 리렌더링

```tsx
// ✅ 필요한 것만 구독
const language = useAppStore((state) => state.language);

// ❌ 전체 상태 구독 (불필요한 리렌더링)
const state = useAppStore();
```

### 메모이제이션

```tsx
const { t } = useTranslation();

// 무거운 계산이 있다면 useMemo 사용
const formattedText = useMemo(() => processText(t.someKey), [t.someKey]);
```

---

## 📚 관련 문서

- [상세 문서](/src/hooks/README.md)
- [코딩 규칙](/common-rules/CODING_RULES.md#다국어-지원-i18n-가이드)
- [예시 컴포넌트](/src/components/examples/translation-example.tsx)

---

## 🐛 문제 해결

| 문제             | 해결 방법                                             |
| ---------------- | ----------------------------------------------------- |
| 타입 에러 발생   | `translations.ts`에 해당 키가 모든 언어에 있는지 확인 |
| 언어가 저장 안됨 | `useAppStore`의 persist 설정 확인                     |
| 번역이 안보임    | 'use client' 지시어 추가 확인                         |
| 자동완성 안됨    | TypeScript 서버 재시작                                |

---

## ✨ 장점 요약

- ✅ **Props Drilling 제거**: 언어를 계층마다 전달할 필요 없음
- ✅ **자동 저장**: localStorage에 자동 저장되어 새로고침해도 유지
- ✅ **타입 안전성**: TypeScript가 오타와 누락을 방지
- ✅ **간단한 API**: 배우기 쉽고 사용하기 편함
- ✅ **유지보수성**: 중앙 집중식 관리로 수정이 쉬움

---

**🎉 이제 다국어 기능을 마음껏 사용하세요!**
