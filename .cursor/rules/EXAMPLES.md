# 실전 프롬프트 예시 모음

이 문서는 실제 프로젝트에서 바로 사용할 수 있는 프롬프트 예시를 담고 있습니다.

---

## 📌 예시 1: 알레르기 필터 컴포넌트 만들기

### 사용할 프롬프트:

````markdown
[구현 경로]
src/components/allergy-filter/index.tsx
src/components/allergy-filter/hooks/use-allergy-filter.tsx

==============================================

[커서룰 적용]
@00-quick-reference.mdc
@02-wireframe.mdc
@03-ui.mdc
@04-func.mdc

==============================================

[기술스택]

- Tailwind CSS (스타일링)
- shadcn/ui: Button, Badge, Card
- lucide-react: Filter, X, Check
- useTranslation (다국어)
- Zustand (필터 상태 관리)

==============================================

[핵심요구사항-1] 필터 UI 구현

1-1. 필터 버튼 그룹 - "전체", "안전", "주의", "위험" 4개 버튼 - 선택된 버튼은 bg-[#2ECC71] 스타일 - 미선택 버튼은 border-gray-200 스타일

1-2. 알레르기 목록 - Badge 컴포넌트로 표시 - 클릭하면 필터 추가/제거 - 선택된 항목은 체크 아이콘 표시

1-3. 반응형 디자인 - 모바일: flex-col, gap-2 - 태블릿: flex-row, gap-4

==============================================

[핵심요구사항-2] 로직 구현 (hooks/use-allergy-filter.tsx)

2-1. 상태 관리

```typescript
const [selectedLevel, setSelectedLevel] = useState<
  'all' | 'safe' | 'caution' | 'danger'
>('all');
const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
```
````

2-2. 필터 토글 함수

```typescript
const toggleAllergy = (allergyId: string) => {
  setSelectedAllergies((prev) =>
    prev.includes(allergyId)
      ? prev.filter((id) => id !== allergyId)
      : [...prev, allergyId]
  );
};
```

2-3. 필터링된 결과 반환

```typescript
const filteredItems = items.filter((item) => {
  const levelMatch = selectedLevel === 'all' || item.level === selectedLevel;
  const allergyMatch =
    selectedAllergies.length === 0 ||
    selectedAllergies.some((id) => item.allergyIds.includes(id));
  return levelMatch && allergyMatch;
});
```

==============================================

[핵심요구사항-3] 다국어 처리

3-1. 필요한 번역 키 - t.filterAll - t.filterSafe - t.filterCaution - t.filterDanger - t.selectedCount

==============================================

[핵심요구사항-4] 테스트 지원

4-1. data-testid 추가 - 필터 컨테이너: "allergy-filter" - 레벨 버튼: "filter-level-{level}" - 알레르기 배지: "allergy-badge-{id}" - 초기화 버튼: "filter-reset"

==============================================

[주의사항]

- CSS Module 사용 금지
- position: absolute 사용 금지
- 하드코딩된 텍스트 금지
- 알레르기 데이터는 props로 받을 것

==============================================

[체크리스트]

- [ ] Tailwind CSS만 사용
- [ ] shadcn/ui 컴포넌트 활용
- [ ] 로직이 훅으로 분리
- [ ] useTranslation 사용
- [ ] data-testid 추가
- [ ] 반응형 디자인
- [ ] TypeScript 타입 정의

````

---

## 📌 예시 2: 식품안전 API 연동

### 사용할 프롬프트:

```markdown
[구현 경로]
src/app/api/food-safety/route.ts

==============================================

[커서룰 적용]
@04-func.mdc

==============================================

[API 정보]
- 엔드포인트: http://openapi.foodsafetykorea.go.kr/api/{API_KEY}/{SERVICE_ID}/json/{START}/{END}
- API 키: 환경변수 NEXT_PUBLIC_FOOD_SAFETY_API_KEY 사용
- 서비스 ID: COOKRCP01 (레시피), I1250 (HACCP)

==============================================

[핵심요구사항-1] GET 메서드 구현

1-1. Query Parameters 처리
     - type: 'recipe' | 'haccp'
     - start: number (기본값 1)
     - end: number (기본값 10)

1-2. API 호출
```typescript
const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
const SERVICE_ID = type === 'recipe' ? 'COOKRCP01' : 'I1250';
const url = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${start}/${end}`;

const response = await fetch(url);
const data = await response.json();
````

1-3. 응답 데이터 정제

```typescript
const result = {
  success: true,
  data: data[SERVICE_ID]?.row || [],
  total: data[SERVICE_ID]?.total_count || 0,
};
```

==============================================

[핵심요구사항-2] 에러 처리

2-1. API 키 검증

```typescript
if (!API_KEY) {
  return NextResponse.json(
    { error: 'API 키가 설정되지 않음' },
    { status: 500 }
  );
}
```

2-2. 파라미터 검증

```typescript
if (!type || !['recipe', 'haccp'].includes(type)) {
  return NextResponse.json({ error: '유효하지 않은 타입' }, { status: 400 });
}
```

2-3. API 호출 실패 처리

```typescript
if (!response.ok) {
  throw new Error(`API 호출 실패: ${response.status}`);
}
```

==============================================

[핵심요구사항-3] 캐싱 설정

3-1. Next.js 캐싱

```typescript
export const revalidate = 3600; // 1시간
```

==============================================

[핵심요구사항-4] TypeScript 타입

4-1. 응답 타입 정의

```typescript
interface FoodSafetyResponse {
  success: boolean;
  data: Array<{
    BSSH_NM?: string; // 업소명
    PRDLST_NM?: string; // 제품명
    ADDR?: string; // 주소
    RCP_NM?: string; // 레시피명
  }>;
  total: number;
}
```

==============================================

[구현 예시 코드]

```typescript
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'recipe' | 'haccp';
    const start = searchParams.get('start') || '1';
    const end = searchParams.get('end') || '10';

    // 검증
    if (!type || !['recipe', 'haccp'].includes(type)) {
      return NextResponse.json(
        { error: '유효하지 않은 타입' },
        { status: 400 }
      );
    }

    const API_KEY = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않음' },
        { status: 500 }
      );
    }

    const SERVICE_ID = type === 'recipe' ? 'COOKRCP01' : 'I1250';
    const url = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${SERVICE_ID}/json/${start}/${end}`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data[SERVICE_ID]?.row || [],
      total: data[SERVICE_ID]?.total_count || 0,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: '서버 내부 오류' }, { status: 500 });
  }
}
```

==============================================

[체크리스트]

- [ ] 환경변수 사용
- [ ] 파라미터 검증
- [ ] 에러 처리
- [ ] 적절한 HTTP 상태 코드
- [ ] TypeScript 타입 정의
- [ ] 캐싱 설정

````

---

## 📌 예시 3: 로그인 페이지 E2E 테스트

### 사용할 프롬프트:

```markdown
[구현 경로]
tests/auth/login.spec.ts

==============================================

[커서룰 적용]
@04-func.mdc (TEST 조건)

==============================================

[핵심요구사항-1] 테스트 시나리오

1-1. 페이지 로드 테스트
     - 로그인 페이지 접속
     - 이메일, 비밀번호 입력란 표시 확인
     - 로그인 버튼 표시 확인

1-2. 정상 로그인 테스트
     - 이메일 입력: test@example.com
     - 비밀번호 입력: password123
     - 로그인 버튼 클릭
     - /dashboard로 리다이렉트 확인

1-3. 폼 검증 테스트
     - 이메일 없이 로그인 시도 → 에러 메시지
     - 잘못된 이메일 형식 → 에러 메시지
     - 비밀번호 없이 로그인 → 에러 메시지

1-4. 비밀번호 표시/숨김 토글
     - 눈 아이콘 클릭
     - 비밀번호 표시 확인
     - 다시 클릭 → 숨김 확인

1-5. 소셜 로그인 버튼 표시
     - Google 버튼 표시
     - Apple 버튼 표시
     - Facebook 버튼 표시

==============================================

[핵심요구사항-2] data-testid 사용

2-1. 필요한 testid
     - input-email
     - input-password
     - button-login
     - button-toggle-password
     - button-google
     - button-apple
     - button-facebook
     - error-message

==============================================

[핵심요구사항-3] 테스트 작성 규칙

3-1. page.goto는 경로만
     - page.goto('/auth/login') ✅
     - page.goto('http://localhost:3000/auth/login') ❌

3-2. timeout 최소화
     - await expect().toBeVisible({ timeout: 2000 })
     - 2000ms 이하로 제한

3-3. 실제 데이터 사용
     - mock 데이터 사용하지 말 것
     - 실제 API 호출

==============================================

[구현 예시]

```typescript
import { test, expect } from '@playwright/test';

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('페이지가 정상적으로 로드됨', async ({ page }) => {
    await expect(page.getByTestId('input-email')).toBeVisible();
    await expect(page.getByTestId('input-password')).toBeVisible();
    await expect(page.getByTestId('button-login')).toBeVisible();
  });

  test('정상 로그인', async ({ page }) => {
    await page.getByTestId('input-email').fill('test@example.com');
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-login').click();

    // 대시보드로 리다이렉트
    await expect(page).toHaveURL('/dashboard', { timeout: 2000 });
  });

  test('이메일 없이 로그인 시도', async ({ page }) => {
    await page.getByTestId('input-password').fill('password123');
    await page.getByTestId('button-login').click();

    // 에러 메시지 표시
    await expect(page.getByTestId('error-message')).toBeVisible();
  });

  test('비밀번호 표시/숨김 토글', async ({ page }) => {
    const passwordInput = page.getByTestId('input-password');
    const toggleButton = page.getByTestId('button-toggle-password');

    // 초기 상태: 비밀번호 숨김
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // 토글 클릭
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // 다시 토글
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('소셜 로그인 버튼 표시', async ({ page }) => {
    await expect(page.getByTestId('button-google')).toBeVisible();
    await expect(page.getByTestId('button-apple')).toBeVisible();
    await expect(page.getByTestId('button-facebook')).toBeVisible();
  });
});
````

==============================================

[체크리스트]

- [ ] 모든 주요 시나리오 테스트
- [ ] data-testid 사용
- [ ] timeout 2000ms 이하
- [ ] 경로만 사용 (baseURL 제외)
- [ ] 실제 API 호출

````

---

## 📌 예시 4: 기존 컴포넌트 리팩토링

### 사용할 프롬프트:

```markdown
[대상 파일]
src/components/home-dashboard/index.tsx

==============================================

[커서룰 적용]
@00-quick-reference.mdc
@02-wireframe.mdc
@04-func.mdc

==============================================

[리팩토링 목표]

1. 비즈니스 로직 분리
   - API 호출 로직을 hooks/use-dashboard-data.tsx로 분리
   - 이벤트 핸들러를 훅으로 이동

2. 하위 컴포넌트 분리
   - RecentScans 섹션 → components/recent-scans.tsx
   - HaccpList 섹션 → components/haccp-list.tsx

3. Tailwind CSS 최적화
   - 중복 클래스 제거
   - cn() 유틸리티 활용

4. 다국어 처리 개선
   - 하드코딩된 텍스트 제거
   - useTranslation 훅 사용

==============================================

[step-by-step 구현]

Step 1: hooks/use-dashboard-data.tsx 생성
```typescript
import { useQuery } from '@tanstack/react-query';

export function useDashboardData() {
  const { data: haccpData, isLoading } = useQuery({
    queryKey: ['haccp-list'],
    queryFn: async () => {
      const res = await fetch('/api/combined');
      return res.json();
    },
  });

  return {
    haccpList: haccpData?.haccp || [],
    isLoading,
  };
}
````

Step 2: components/recent-scans.tsx 생성

```typescript
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useTranslation } from '@/hooks/useTranslation';

interface Scan {
  id: number;
  name: string;
  image: string;
  time: string;
}

interface RecentScansProps {
  scans: Scan[];
}

export function RecentScans({ scans }: RecentScansProps) {
  const { t } = useTranslation();

  return (
    <div className="px-6 mb-8 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2>{t.recentScans}</h2>
        <button className="text-sm text-[#2ECC71]">{t.seeAll}</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {scans.map(scan => (
          <Card key={scan.id} className="flex-shrink-0 w-32">
            <ImageWithFallback
              src={scan.image}
              alt={scan.name}
              className="w-32 h-32 rounded-2xl object-cover"
            />
            <p className="text-sm truncate mt-2">{scan.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{scan.time}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

Step 3: index.tsx 리팩토링

```typescript
import { useDashboardData } from './hooks/use-dashboard-data';
import { RecentScans } from './components/recent-scans';
import { HaccpList } from './components/haccp-list';
import { LanguageSelector } from '../language-selector';
import { useTranslation } from '@/hooks/useTranslation';

interface HomeDashboardProps {
  onScanMenu: () => void;
}

export function HomeDashboard({ onScanMenu }: HomeDashboardProps) {
  const { t } = useTranslation();
  const { haccpList, isLoading } = useDashboardData();

  return (
    <div className="min-h-screen bg-white pb-24" data-testid="home-dashboard">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#2ECC71]">{t.appName}</h1>
            <p className="text-sm text-muted-foreground">{t.tagline}</p>
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Recent Scans */}
      <RecentScans scans={recentScansData} />

      {/* HACCP List */}
      <HaccpList items={haccpList} isLoading={isLoading} />
    </div>
  );
}
```

==============================================

[검증 체크리스트]

- [ ] 로직이 훅으로 분리됨
- [ ] 하위 컴포넌트 생성됨
- [ ] Tailwind CSS만 사용
- [ ] 하드코딩된 텍스트 제거
- [ ] data-testid 추가
- [ ] 파일 크기 200줄 이하
- [ ] TypeScript 에러 없음
- [ ] npm run build 성공

```

---

## 🎯 프롬프트 작성 팁

### 1. 명확한 구조 사용
```

[섹션명] ← 대괄호로 섹션 구분
========= ← 구분선으로 가독성 향상

````

### 2. 코드 예시 포함
```typescript
// 좋은 프롬프트는 예시 코드를 포함합니다
const example = "이렇게요";
````

### 3. 체크리스트 제공

```
- [ ] 항목 1
- [ ] 항목 2
```

### 4. 금지사항 명시

```
❌ 하지 말 것
✅ 해야 할 것
```

### 5. Step-by-step 지시

```
Step 1: ...
Step 2: ...
Step 3: ...
```

---

이 예시들을 참고하여 프로젝트에 맞는 프롬프트를 작성하세요!
