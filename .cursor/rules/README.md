# SafeMeals 프로젝트 규칙 & 가이드

이 폴더는 SafeMeals 프로젝트의 개발 규칙과 가이드라인을 담고 있습니다.

---

## 📚 규칙 파일 목록

### ⭐ 핵심 규칙 (항상 참고)

| 파일                       | 설명                           | 적용 시점                |
| -------------------------- | ------------------------------ | ------------------------ |
| **00-quick-reference.mdc** | 빠른 참조 가이드               | 항상 (alwaysApply: true) |
| **01-common.mdc**          | 공통 조건 및 주의사항          | 모든 작업                |
| **02-wireframe.mdc**       | CSS & 스타일링 규칙 (Tailwind) | UI 작업                  |
| **03-ui.mdc**              | UI 컴포넌트 & 에셋 규칙        | UI 작업                  |
| **04-func.mdc**            | 기능 구현 규칙                 | 로직 구현                |
| **05-func.role.mdc**       | 권한 분기 규칙                 | 인증/권한                |

### 🆕 추가 규칙 (프로젝트 전용)

| 파일                         | 설명                | 용도          |
| ---------------------------- | ------------------- | ------------- |
| **06-project-specific.mdc**  | SafeMeals 전용 규칙 | 프로젝트 특성 |
| **07-refactoring-guide.mdc** | 리팩토링 가이드     | 코드 개선     |
| **08-prompt-templates.mdc**  | 프롬프트 템플릿     | 작업 지시     |

### ✔️ 재검토 트리거

| 파일                                      | 설명                 |
| ----------------------------------------- | -------------------- |
| **recheck.101.required.rule.mdc**         | 커서룰 재검토        |
| **recheck.102.required.codestyle.mdc**    | 스타일 일관성 재검토 |
| **recheck.201.optional.ui.component.mdc** | 공통 컴포넌트 재검토 |
| **recheck.202.optional.ui.mock.mdc**      | Mock 데이터 재검토   |
| **recheck.301.optional.func.test.mdc**    | 테스트 조건 재검토   |
| **recheck.302.optional.func.alltest.mdc** | 전체 테스트 실행     |
| **recheck.401.required.final.mdc**        | 최종 빌드 & 커밋     |

### 📖 문서

| 파일            | 설명               |
| --------------- | ------------------ |
| **EXAMPLES.md** | 실전 프롬프트 예시 |
| **README.md**   | 이 파일            |

---

## 🎯 사용 방법

### 1. 새 컴포넌트 만들 때

```markdown
@00-quick-reference.mdc ← 빠른 참조
@02-wireframe.mdc ← 스타일 규칙
@03-ui.mdc ← UI 규칙
@08-prompt-templates.mdc ← 템플릿 참고
```

**프롬프트 예시**:

```
EXAMPLES.md의 "예시 1: 알레르기 필터 컴포넌트" 참고
```

---

### 2. 로직 구현할 때

```markdown
@00-quick-reference.mdc ← 빠른 참조
@04-func.mdc ← 기능 규칙
@06-project-specific.mdc ← 프로젝트 규칙
```

**프롬프트 예시**:

```
EXAMPLES.md의 "예시 2: 식품안전 API 연동" 참고
```

---

### 3. 테스트 작성할 때

```markdown
@04-func.mdc (TEST 조건) ← 테스트 규칙
@08-prompt-templates.mdc ← 템플릿 참고
```

**프롬프트 예시**:

```
EXAMPLES.md의 "예시 3: 로그인 페이지 E2E 테스트" 참고
```

---

### 4. 리팩토링할 때

```markdown
@00-quick-reference.mdc ← 빠른 참조
@07-refactoring-guide.mdc ← 리팩토링 가이드
@recheck.102.required.codestyle.mdc ← 스타일 재검토
```

**프롬프트 예시**:

```
EXAMPLES.md의 "예시 4: 기존 컴포넌트 리팩토링" 참고
```

---

## 🔄 기존 방식 vs 새 방식

### ❌ 기존 방식 (CSS Module)

```
components/feature-name/
├── index.tsx              # 컴포넌트
├── styles.module.css      # CSS Module ❌
└── hook.tsx               # 로직
```

### ✅ 새 방식 (Tailwind CSS)

```
components/feature-name/
├── index.tsx              # 컴포넌트 (Tailwind CSS)
├── hooks/                 # 로직 분리
│   └── use-feature.tsx
└── components/            # 하위 컴포넌트 (필요시)
    ├── feature-item.tsx
    └── feature-card.tsx
```

---

## 📋 주요 차이점

### CSS 작성

| 기존                | 현재                    |
| ------------------- | ----------------------- |
| CSS Module          | Tailwind CSS            |
| `styles.module.css` | `className="..."`       |
| `:global`, `:root`  | CSS 변수 in globals.css |

### 컴포넌트 구조

| 기존         | 현재                    |
| ------------ | ----------------------- |
| `hook.tsx`   | `hooks/use-feature.tsx` |
| 단일 훅 파일 | 기능별 훅 분리 가능     |
| -            | 하위 컴포넌트 분리 권장 |

### 스타일링

| 기존                        | 현재                                 |
| --------------------------- | ------------------------------------ |
| `className={styles.button}` | `className="px-4 py-2 bg-[#2ECC71]"` |
| CSS 파일 참조               | 인라인 유틸리티 클래스               |
| -                           | `cn()` 유틸리티로 조건부 스타일링    |

---

## 🎨 핵심 규칙 요약

### ✅ 반드시 할 것

1. **Tailwind CSS 사용**

   ```tsx
   <div className="flex items-center gap-2 p-4">
   ```

2. **shadcn/ui 컴포넌트 활용**

   ```tsx
   import { Button } from '@/components/ui/button';
   ```

3. **lucide-react 아이콘**

   ```tsx
   import { Star, MapPin } from 'lucide-react';
   ```

4. **useTranslation 다국어**

   ```tsx
   const { t } = useTranslation();
   <h1>{t.title}</h1>;
   ```

5. **URL 상수 사용**

   ```tsx
   import { MAIN_URLS } from '@/commons/constants/url';
   router.push(MAIN_URLS.DASHBOARD);
   ```

6. **data-testid 추가**
   ```tsx
   <button data-testid="login-button">
   ```

### ❌ 절대 하지 말 것

1. **CSS Module 생성**

   ```
   ❌ styles.module.css
   ```

2. **public/icons/, public/images/ 사용**

   ```
   ❌ /icons/star.svg
   ✅ lucide-react 아이콘 사용
   ✅ /assets/ 폴더 사용
   ```

3. **position: absolute 남용**

   ```
   ❌ className="absolute top-0 left-0"
   ✅ className="flex items-center" (Flexbox)
   ```

4. **!important 사용**

   ```
   ❌ !important
   ```

5. **하드코딩된 텍스트**
   ```
   ❌ <h1>로그인</h1>
   ✅ <h1>{t.login}</h1>
   ```

---

## 🚀 빠른 시작

### 1단계: 규칙 파일 읽기

```
1. 00-quick-reference.mdc (필수)
2. 작업 유형에 맞는 규칙 파일
3. EXAMPLES.md에서 유사한 예시 찾기
```

### 2단계: 프롬프트 작성

```
1. 08-prompt-templates.mdc 템플릿 복사
2. 프로젝트에 맞게 수정
3. EXAMPLES.md 예시 참고
```

### 3단계: 구현

```
1. AI에게 프롬프트 전달
2. 생성된 코드 검토
3. 체크리스트 확인
```

### 4단계: 검증

```
1. TypeScript 에러 확인
2. npm run build 실행
3. Playwright 테스트 작성/실행
```

---

## 💡 프롬프트 작성 팁

### 좋은 프롬프트 구조

```markdown
# [구현 경로] ← 파일 경로 명시

# [커서룰 적용] ← 적용할 규칙

# [기술스택] ← 사용할 기술

[핵심요구사항-1] ← 구체적인 요구사항
1-1. 세부 항목
1-2. 세부 항목
=========================
[코드 예시] ← 예시 코드
=========================
[체크리스트] ← 검증 항목

- [ ] 항목 1
- [ ] 항목 2
```

### 구조화 방법

1. **섹션 구분**: `[섹션명]`
2. **구분선**: `=====`
3. **계층 구조**: `1-1`, `1-2`, `2-1`
4. **코드 블록**: ` ```typescript `
5. **체크리스트**: `- [ ]`

---

## 📖 더 알아보기

- **EXAMPLES.md**: 실전 프롬프트 4가지 예시
- **07-refactoring-guide.mdc**: 상세한 리팩토링 가이드
- **08-prompt-templates.mdc**: 템플릿 4종 (UI, 로직, API, 테스트)

---

## 🤝 기여 방법

규칙이나 가이드를 개선하고 싶다면:

1. 규칙 파일 수정
2. EXAMPLES.md에 예시 추가
3. 팀과 공유

---

## 📞 도움이 필요하면

1. **00-quick-reference.mdc** 먼저 확인
2. **EXAMPLES.md**에서 유사 예시 찾기
3. **규칙 파일** 상세 내용 읽기
4. 팀원에게 질문

---

**Happy Coding! 🎉**
