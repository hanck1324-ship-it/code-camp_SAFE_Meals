# 회원가입 후 로그인 페이지 거쳐서 온보딩 흐름 구현

## 📋 요구사항

### 현재 문제
- 회원가입 후 바로 온보딩(알레르기 설정)으로 이동
- 로그인 페이지를 거치지 않음
- `created_at` 기준 1분 타이머로 신규 사용자 판단 → 시간 지나면 온보딩 스킵됨

### 원하는 흐름

**신규 사용자:**
```
회원가입 완료
  → 로그인 페이지로 복귀
  → 첫 로그인 시도
  → 알레르기 설정
  → 식단 설정
  → 안전카드 PIN 설정
  → 홈(대시보드)
```

**기존 사용자:**
```
로그인 → 바로 홈(대시보드)
```

---

## ✅ 구현 완료 사항

### 1. 온보딩 상태 확인 유틸리티 함수 생성

**파일:** `apps/web/src/lib/checkOnboardingStatus.ts` (신규)

```typescript
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 사용자의 온보딩 완료 여부 확인
 * @param userId - Supabase 사용자 ID
 * @returns true면 신규 사용자(온보딩 필요), false면 기존 사용자(온보딩 완료)
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  try {
    console.log('[checkOnboardingStatus] 온보딩 상태 확인 시작:', userId);

    // 알레르기 데이터 확인
    const { data: allergies, error: allergyError } = await supabase
      .from('user_allergies')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (allergyError) {
      console.error('[checkOnboardingStatus] 알레르기 조회 에러:', allergyError);
    }

    // 식단 데이터 확인
    const { data: diets, error: dietError } = await supabase
      .from('user_diets')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (dietError) {
      console.error('[checkOnboardingStatus] 식단 조회 에러:', dietError);
    }

    // 안전카드 확인
    const { data: safetyCard, error: safetyError } = await supabase
      .from('safety_cards')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (safetyError) {
      console.error('[checkOnboardingStatus] 안전카드 조회 에러:', safetyError);
    }

    // 하나라도 데이터가 있으면 온보딩 완료 (기존 사용자)
    const hasOnboarded =
      (allergies && allergies.length > 0) ||
      (diets && diets.length > 0) ||
      (safetyCard && safetyCard.length > 0);

    console.log('[checkOnboardingStatus] 온보딩 데이터:', {
      hasAllergies: allergies && allergies.length > 0,
      hasDiets: diets && diets.length > 0,
      hasSafetyCard: safetyCard && safetyCard.length > 0,
      hasOnboarded,
    });

    // 신규 사용자인지 반환 (온보딩 미완료)
    const isNewUser = !hasOnboarded;
    console.log('[checkOnboardingStatus] 결과:', isNewUser ? '신규 사용자 (온보딩 필요)' : '기존 사용자 (온보딩 완료)');

    return isNewUser;
  } catch (error) {
    console.error('[checkOnboardingStatus] 예상치 못한 에러:', error);
    // 에러 발생 시 안전하게 신규 사용자로 간주 (온보딩 진행)
    return true;
  }
}
```

**기능:**
- DB에서 `user_allergies`, `user_diets`, `safety_cards` 테이블 조회
- 하나라도 데이터가 있으면 온보딩 완료 (기존 사용자)
- 모두 비어있으면 신규 사용자 (온보딩 필요)

---

### 2. 로그인 로직 수정 - DB 기반 신규 사용자 판단

**파일:** `apps/web/src/hooks/useLogin.ts`

**변경 위치:** 라인 96-97

**변경 전:**
```typescript
// 계정 생성 시간이 1분 이내면 신규 사용자로 간주
const createdAt = new Date(data.user.created_at);
const now = new Date();
const timeDiff = now.getTime() - createdAt.getTime();
const isNewUser = timeDiff < 60000; // 1분 = 60,000ms
```

**변경 후:**
```typescript
// DB에서 온보딩 완료 여부 확인
const isNewUser = await checkOnboardingStatus(data.user.id);

console.log('[useLogin] 사용자 정보:', {
  userId: data.user.id,
  isNewUser,
});
```

**추가한 import:**
```typescript
import { checkOnboardingStatus } from '@/lib/checkOnboardingStatus';
```

**개선 사항:**
- 시간 기반 판단 제거 → DB 데이터 기반 정확한 판단
- 회원가입 후 언제든지 로그인해도 온보딩 필요 여부 정확히 파악

---

### 3. 회원가입 로직 수정 - 로그인 페이지로 리다이렉트

**파일:** `apps/web/src/features/auth/components/signup-form/hooks/useSignup.ts`

**변경 위치:** 라인 114-123

**변경 전:**
```typescript
// 세션이 있으면 자동 로그인 상태
if (authData.session) {
  setUser(authData.user);

  // 네이티브 앱에서 실행 중인 경우 토큰 저장 및 온보딩 메시지 전송
  if (typeof window !== 'undefined' && (window as any).SafeMealsBridge) {
    const session = authData.session;
    if (session?.access_token) {
      (window as any).SafeMealsBridge.postMessage({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: session.access_token,
          refreshToken: session.refresh_token,
          userId: authData.user.id,
          isNewUser: true,
        },
      });
    }
  }

  // 웹 환경에서는 온보딩으로 직접 이동
  if (!isNativeApp) {
    alert('회원가입에 성공하였습니다. 알레르기와 식단을 설정해주세요.');
    router.push('/onboarding/allergy');
  }
}
```

**변경 후:**
```typescript
// 회원가입 성공 시 - 항상 로그인 페이지로 이동
if (authData.session) {
  // 세션이 자동 생성되었지만 즉시 로그아웃하여 사용자가 수동으로 로그인하도록 유도
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();

  console.log('[useSignup] 회원가입 성공 - 세션 로그아웃 후 로그인 페이지로 이동');

  alert('회원가입에 성공하였습니다. 로그인 페이지에서 로그인해주세요.');
  router.push(AUTH_URLS.LOGIN);
} else {
  // 이메일 인증이 필요한 경우
  alert(
    '회원가입에 성공하였습니다. 이메일을 확인하여 인증을 완료해주세요.'
  );
  router.push(AUTH_URLS.LOGIN);
}
```

**제거한 코드:**
```typescript
// useAppStore import 제거
import { useAppStore } from '@/commons/stores/useAppStore';

// setUser 제거
const setUser = useAppStore((state) => state.setUser);
```

**개선 사항:**
- 회원가입 후 자동 생성된 세션을 즉시 로그아웃
- LOGIN_SUCCESS 메시지 전송 제거 → 자동 로그인 방지
- 사용자가 수동으로 로그인 페이지에서 로그인해야 함

---

## 🔄 최종 흐름

### 신규 사용자 (회원가입 및 첫 로그인)

```
1. 회원가입 페이지
   ↓ 이메일/비밀번호 입력

2. Supabase signUp()
   ↓ 세션 자동 생성

3. ✅ 즉시 signOut() 호출
   ↓ 로그인 페이지로 리다이렉트

4. 사용자가 수동으로 로그인

5. useLogin.loginWithEmail()
   ↓ checkOnboardingStatus(userId)
   ↓ DB 조회: user_allergies, user_diets, safety_cards
   ↓ 모두 비어있음 → isNewUser = true

6. LOGIN_SUCCESS 메시지 전송
   ↓ payload: { token, userId, isNewUser: true }

7. 네이티브 앱: WebViewScreen.tsx에서 메시지 수신
   ↓ router.replace('/(auth)/onboarding')

8. 온보딩 WebView 로드
   ↓ /onboarding/allergy

9. 알레르기 설정 → 식단 설정 → 안전카드 PIN

10. ONBOARDING_COMPLETE 메시지
    ↓ AsyncStorage.setItem('hasOnboarded', 'true')
    ↓ router.replace('/(tabs)')

11. 대시보드
```

### 기존 사용자 (재로그인)

```
1. 로그인 페이지
   ↓ 이메일/비밀번호 입력

2. useLogin.loginWithEmail()
   ↓ checkOnboardingStatus(userId)
   ↓ DB 조회: user_allergies, user_diets, safety_cards
   ↓ 데이터 존재 → isNewUser = false

3. LOGIN_SUCCESS 메시지 전송
   ↓ payload: { token, userId, isNewUser: false }

4. 네이티브 앱: WebViewScreen.tsx에서 메시지 수신
   ↓ AsyncStorage.setItem('hasOnboarded', 'true')
   ↓ router.replace('/(tabs)')

5. 대시보드
```

---

## 📁 변경된 파일 목록

### 신규 생성
- `apps/web/src/lib/checkOnboardingStatus.ts`

### 수정
1. `apps/web/src/hooks/useLogin.ts`
   - Import 추가: `checkOnboardingStatus`
   - 라인 96-97: 신규 사용자 판단 로직 변경

2. `apps/web/src/features/auth/components/signup-form/hooks/useSignup.ts`
   - Import 제거: `useAppStore`
   - 라인 114-123: 회원가입 성공 시 로그아웃 및 로그인 페이지 리다이렉트
   - `setUser` 제거

---

## 🔍 핵심 개선 사항

### 1. 신규 사용자 판단 정확도 향상
**기존:**
- `created_at` 기준 1분 이내 → 시간 지나면 온보딩 스킵
- 회원가입 후 1분 지나서 로그인하면 기존 사용자로 간주됨

**개선:**
- DB 테이블 데이터 확인 → 정확한 온보딩 상태 파악
- 회원가입 후 언제든지 로그인해도 온보딩 필요 여부 정확히 판단

### 2. 회원가입 후 자동 로그인 제거
**기존:**
- 회원가입 → 세션 자동 생성 → 바로 온보딩
- LOGIN_SUCCESS 메시지로 네이티브 앱 라우팅

**개선:**
- 회원가입 → 세션 로그아웃 → 로그인 페이지
- 사용자가 수동으로 로그인해야 온보딩 시작

### 3. 일관된 사용자 경험
**기존:**
- 신규 사용자: 회원가입 → 바로 온보딩
- 기존 사용자: 로그인 → 대시보드

**개선:**
- 모든 사용자: 로그인 페이지에서 시작
- 신규/기존 여부는 DB 데이터로 자동 판단

---

## ⚠️ 주의사항

### 1. Supabase 세션 관리
- 회원가입 후 세션이 자동 생성되지만 즉시 `signOut()` 호출
- 사용자가 로그인할 때 새로운 세션 생성
- WebView localStorage에 세션이 남아있지 않도록 완전 로그아웃

### 2. 온보딩 데이터 확인 기준
- `user_allergies`, `user_diets`, `safety_cards` 중 **하나라도** 있으면 온보딩 완료
- 세 테이블 모두 비어있어야 신규 사용자로 판단
- 알레르기만 설정하고 중단한 경우에도 기존 사용자로 간주됨

### 3. 성능 고려
- 로그인할 때마다 DB 쿼리 3개 실행
- `limit(1)`로 최소한의 데이터만 조회
- 필요시 결과 캐싱 고려 가능

### 4. 에러 처리
- DB 조회 실패 시 안전하게 신규 사용자로 간주
- 온보딩을 다시 진행하도록 유도 (데이터 손실 방지)

---

## ✅ 테스트 시나리오

### 시나리오 1: 신규 회원가입
1. 회원가입 페이지에서 이메일/비밀번호 입력
2. **확인:** 로그인 페이지로 이동
3. 동일한 이메일/비밀번호로 로그인
4. **확인:** 알레르기 설정 화면 표시
5. 알레르기 → 식단 → 안전카드 순서로 진행
6. **확인:** 모든 단계 완료 후 대시보드 표시

### 시나리오 2: 기존 사용자 재로그인
1. 온보딩 완료한 계정으로 로그인
2. **확인:** 온보딩 스킵, 바로 대시보드 표시

### 시나리오 3: 온보딩 중단 후 재로그인
1. 회원가입 → 로그인 → 알레르기만 설정
2. 앱 종료 (식단, 안전카드 설정 안 함)
3. 다시 로그인
4. **확인:** DB에 `user_allergies` 데이터 있음 → 기존 사용자로 간주
5. **예상 동작:** 바로 대시보드로 이동 (온보딩 재시작 안 함)

### 시나리오 4: 시간 지나서 로그인
1. 회원가입 완료
2. 1분 이상 대기
3. 로그인 시도
4. **확인:** DB에 데이터 없음 → 신규 사용자로 정확히 판단
5. **확인:** 온보딩 진행

---

## 🚀 향후 개선 가능 사항

### 1. 온보딩 진행률 추적
현재는 하나라도 데이터가 있으면 완료로 간주하지만, 진행률을 세밀하게 추적 가능:

```typescript
interface OnboardingProgress {
  hasAllergies: boolean;
  hasDiets: boolean;
  hasSafetyCard: boolean;
  completedSteps: number;
  totalSteps: number;
  nextStep: 'allergy' | 'diet' | 'safety-card' | 'complete';
}

// 중단된 지점부터 재개 가능
if (progress.nextStep === 'diet') {
  router.replace('/onboarding/diet-category');
}
```

### 2. 결과 캐싱
로그인할 때마다 DB 쿼리 3개는 부담이 될 수 있음:

```typescript
// 세션에 온보딩 상태 저장
const { data: session } = await supabase.auth.getSession();
if (session?.user.user_metadata?.hasOnboarded) {
  return false; // 기존 사용자
}

// 캐시 미스 시에만 DB 조회
const isNewUser = await checkOnboardingStatus(userId);

// 결과를 user_metadata에 저장
await supabase.auth.updateUser({
  data: { hasOnboarded: !isNewUser }
});
```

### 3. 온보딩 건너뛰기 허용 시 처리
현재 안전카드에는 "나중에 설정하기" 버튼이 있음. 모든 단계를 건너뛸 수 있다면:

```typescript
// 온보딩 건너뛰기 플래그 추가
const { data: skipFlag } = await supabase
  .from('user_preferences')
  .select('onboarding_skipped')
  .eq('user_id', userId)
  .single();

if (skipFlag?.onboarding_skipped) {
  return false; // 건너뛴 사용자도 기존 사용자로 간주
}
```

---

## 📚 관련 파일 참조

### 인증 관련
- `apps/web/src/hooks/useLogin.ts` - 로그인 로직
- `apps/web/src/features/auth/components/signup-form/hooks/useSignup.ts` - 회원가입 로직
- `apps/web/src/app/_providers/auth-provider.tsx` - 인증 상태 관리

### 온보딩 관련
- `apps/web/src/app/onboarding/allergy/page.tsx` - 알레르기 설정
- `apps/web/src/app/onboarding/diet-category/page.tsx` - 식단 카테고리 선택
- `apps/web/src/app/onboarding/diet-detail/page.tsx` - 식단 상세 설정
- `apps/web/src/app/onboarding/safety-card/page.tsx` - 안전카드 PIN 설정

### 네이티브 앱 연동
- `apps/mobile/components/WebViewScreen.tsx` - WebView 브릿지 및 메시지 처리
- `apps/mobile/app/index.tsx` - 앱 진입점 및 초기 라우팅
- `apps/mobile/app/(auth)/onboarding.tsx` - 온보딩 WebView 래퍼

### Supabase 테이블
- `user_allergies` - 사용자 알레르기 정보
- `user_diets` - 사용자 식단 정보
- `safety_cards` - 사용자 안전카드 정보

---

## 📝 구현 일시
- **작성일:** 2025-12-31
- **작성자:** Claude Code
- **버전:** 1.0.0
