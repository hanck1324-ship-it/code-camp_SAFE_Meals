import { test, expect } from '@playwright/test';

/**
 * 로그인 기능 테스트 (Playwright 기반)
 *
 * 테스트 환경:
 * - Supabase 테스트 전용 계정 사용
 * - TEST_USER_EMAIL, TEST_USER_PASSWORD 환경변수 필요
 */

// 테스트용 계정 정보 (환경변수에서 가져옴)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

test.describe('로그인 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('/auth/login');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector('[data-testid="login-page-container"]');
  });

  /**
   * 7-1. 이메일 로그인 성공 테스트
   */
  test('이메일 로그인 성공 시 dashboard로 리다이렉트', async ({ page }) => {
    // 유효한 이메일/비밀번호 입력
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);

    // 로그인 버튼 클릭
    await page.click('[data-testid="login-submit-button"]');

    // /dashboard로 리다이렉트 확인
    await expect(page).toHaveURL(/\/dashboard/);

    // dashboard-container 표시 확인
    await expect(
      page.locator('[data-testid="dashboard-container"]')
    ).toBeVisible();
  });

  /**
   * 7-2. 이메일 로그인 실패 테스트
   */
  test('잘못된 비밀번호 입력 시 에러 메시지 표시', async ({ page }) => {
    // 잘못된 비밀번호 입력
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword123');

    // 로그인 버튼 클릭
    await page.click('[data-testid="login-submit-button"]');

    // 에러 메시지 표시 확인
    await expect(
      page.locator('[data-testid="login-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="login-error-message"]')
    ).toContainText('이메일 또는 비밀번호가 올바르지 않습니다');

    // 페이지 이동 없음 확인
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  /**
   * 7-3. 유효성 검증 테스트
   */
  test.describe('유효성 검증 테스트', () => {
    test('이메일 빈 값 입력 시 에러 표시', async ({ page }) => {
      // 비밀번호만 입력
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);

      // 로그인 버튼 클릭
      await page.click('[data-testid="login-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toBeVisible();

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('비밀번호 빈 값 입력 시 에러 표시', async ({ page }) => {
      // 이메일만 입력
      await page.fill('input[type="email"]', TEST_USER_EMAIL);

      // 로그인 버튼 클릭
      await page.click('[data-testid="login-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toBeVisible();

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('잘못된 이메일 형식 입력 시 에러 표시', async ({ page }) => {
      // 잘못된 이메일 형식 입력
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);

      // 로그인 버튼 클릭
      await page.click('[data-testid="login-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toContainText('올바른 이메일 형식이 아닙니다');

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('비밀번호 6자 미만 입력 시 에러 표시', async ({ page }) => {
      // 비밀번호 6자 미만 입력
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', '12345');

      // 로그인 버튼 클릭
      await page.click('[data-testid="login-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="login-error-message"]')
      ).toContainText('비밀번호는 최소 6자 이상이어야 합니다');

      // 페이지 이동 없음 확인
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  /**
   * 로그인 페이지 UI 요소 테스트
   */
  test('로그인 페이지 필수 UI 요소 표시 확인', async ({ page }) => {
    // 로그인 페이지 컨테이너 확인
    await expect(
      page.locator('[data-testid="login-page-container"]')
    ).toBeVisible();

    // 로그인 버튼 확인
    await expect(
      page.locator('[data-testid="login-submit-button"]')
    ).toBeVisible();

    // 이메일 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 비밀번호 입력 필드 확인
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
