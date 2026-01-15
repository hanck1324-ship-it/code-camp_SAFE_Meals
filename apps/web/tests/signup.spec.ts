import { test, expect } from '@playwright/test';

/**
 * 회원가입 기능 테스트 (Playwright 기반)
 *
 * 테스트 환경:
 * - Supabase Auth 연동
 * - 페이지 로드 식별: data-testid 기반 (networkidle 사용 금지)
 */

// 테스트용 유니크 이메일 생성 함수
const generateUniqueEmail = () =>
  `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;

// 테스트용 이미 존재하는 계정 정보 (환경변수에서 가져옴)
const EXISTING_USER_EMAIL =
  process.env.TEST_USER_EMAIL || 'test@example.com';

test.describe('회원가입 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/auth/signup');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector('[data-testid="auth-signup-container"]');
    
    // hydration 완료를 위한 추가 대기
    await page.waitForTimeout(1000);
  });

  /**
   * 5-1. 이메일 회원가입 성공 테스트
   */
  test('이메일 회원가입 성공 시 login 페이지로 리다이렉트', async ({
    page,
  }) => {
    const uniqueEmail = generateUniqueEmail();

    // 유효한 폼 데이터 입력
    await page.locator('input[name="email"]').fill(uniqueEmail);
    await page.locator('input[name="password"]').fill('Password123');
    await page.locator('input[name="passwordConfirm"]').fill('Password123');

    // 폼 검증이 완료될 때까지 잠시 대기
    await page.waitForTimeout(500);

    // 버튼이 활성화될 때까지 대기 (최대 10초)
    await expect(
      page.locator('[data-testid="signup-submit-button"]')
    ).toBeEnabled({ timeout: 10000 });

    // alert 다이얼로그 자동 수락 설정
    page.on('dialog', async (dialog) => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });

    // 회원가입 버튼 클릭
    await page.click('[data-testid="signup-submit-button"]');

    // /auth/login으로 리다이렉트 확인
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30000 });

    // login-container 표시 확인
    await expect(
      page.locator('[data-testid="login-page-container"]')
    ).toBeVisible();
  });

  /**
   * 5-2. 비밀번호 불일치 테스트
   */
  test('비밀번호와 비밀번호 확인 불일치 시 에러 메시지 표시', async ({
    page,
  }) => {
    // 비밀번호 다르게 입력
    await page.locator('input[name="email"]').fill(generateUniqueEmail());
    await page.locator('input[name="password"]').fill('Password123');
    await page.locator('input[name="passwordConfirm"]').fill('DifferentPassword123');

    // 에러 메시지 표시 확인 (Zod 검증에서 표시)
    await expect(
      page.locator('[data-testid="password-mismatch-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="password-mismatch-error"]')
    ).toContainText('비밀번호가 일치하지 않습니다');

    // 제출 버튼 비활성화 확인
    await expect(
      page.locator('[data-testid="signup-submit-button"]')
    ).toBeDisabled();

    // 페이지 이동 없음 확인
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  /**
   * 5-3. 이메일 중복 테스트
   */
  test('이미 가입된 이메일 입력 시 에러 메시지 표시', async ({ page }) => {
    // 이미 가입된 이메일 입력
    await page.locator('input[name="email"]').fill(EXISTING_USER_EMAIL);
    await page.locator('input[name="password"]').fill('Password123');
    await page.locator('input[name="passwordConfirm"]').fill('Password123');

    // 버튼이 활성화될 때까지 대기
    await expect(
      page.locator('[data-testid="signup-submit-button"]')
    ).toBeEnabled();

    // 회원가입 버튼 클릭
    await page.click('[data-testid="signup-submit-button"]');

    // 에러 메시지 표시 확인
    await expect(
      page.locator('[data-testid="signup-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="signup-error-message"]')
    ).toContainText('이미 가입된 이메일입니다');

    // 페이지 이동 없음 확인
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  /**
   * 5-4. 유효성 검증 테스트
   */
  test.describe('유효성 검증 테스트', () => {
    test('이메일 빈 값 입력 시 제출 버튼 비활성화', async ({ page }) => {
      // 이메일 제외 입력
      await page.locator('input[name="password"]').fill('Password123');
      await page.locator('input[name="passwordConfirm"]').fill('Password123');

      // 제출 버튼 비활성화 확인
      await expect(
        page.locator('[data-testid="signup-submit-button"]')
      ).toBeDisabled();

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test('잘못된 이메일 형식 입력 시 에러 표시', async ({ page }) => {
      // 잘못된 이메일 형식 입력
      await page.locator('input[name="email"]').fill('invalid-email');
      await page.locator('input[name="password"]').fill('Password123');
      await page.locator('input[name="passwordConfirm"]').fill('Password123');

      // 제출 버튼 비활성화 또는 에러 표시 확인
      await expect(
        page.locator('[data-testid="signup-submit-button"]')
      ).toBeDisabled();

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/signup/);
    });

    test('비밀번호 6자 미만 입력 시 에러 표시', async ({ page }) => {
      // 짧은 비밀번호 입력
      await page.locator('input[name="email"]').fill(generateUniqueEmail());
      await page.locator('input[name="password"]').fill('12345');
      await page.locator('input[name="passwordConfirm"]').fill('12345');

      // 제출 버튼 비활성화 확인
      await expect(
        page.locator('[data-testid="signup-submit-button"]')
      ).toBeDisabled();

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/signup/);
    });
  });
});
