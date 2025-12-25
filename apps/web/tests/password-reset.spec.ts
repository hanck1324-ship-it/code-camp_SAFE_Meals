import { test, expect } from '@playwright/test';

/**
 * 비밀번호 재설정 기능 테스트 (Playwright 기반)
 *
 * 테스트 환경:
 * - Supabase 테스트 전용 계정 사용
 * - TEST_USER_EMAIL 환경변수 필요
 */

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';

test.describe('비밀번호 재설정 기능 테스트', () => {
  test.describe('비밀번호 재설정 메일 발송', () => {
    test.beforeEach(async ({ page }) => {
      // 로그인 페이지로 이동
      await page.goto('/auth/login');

      // 페이지 로드 완료 대기 (data-testid 기반)
      await page.waitForSelector('[data-testid="login-page-container"]');
    });

    /**
     * 4-1. 비밀번호 재설정 다이얼로그 표시 테스트
     */
    test('"비밀번호를 잊으셨나요?" 버튼 클릭 시 다이얼로그 표시', async ({
      page,
    }) => {
      // "비밀번호를 잊으셨나요?" 버튼 클릭
      await page.click('[data-testid="forgot-password-button"]');

      // 다이얼로그 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).toBeVisible();

      // 이메일 입력 필드 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-email-input"]')
      ).toBeVisible();

      // 버튼들 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-submit-button"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="password-reset-cancel-button"]')
      ).toBeVisible();
    });

    /**
     * 4-1. 비밀번호 재설정 메일 발송 성공 테스트
     */
    test('유효한 이메일로 비밀번호 재설정 메일 발송 성공', async ({ page }) => {
      // "비밀번호를 잊으셨나요?" 버튼 클릭
      await page.click('[data-testid="forgot-password-button"]');

      // 다이얼로그 표시 대기
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).toBeVisible();

      // 유효한 이메일 입력
      await page.fill(
        '[data-testid="password-reset-email-input"]',
        TEST_USER_EMAIL
      );

      // "재설정 메일 발송" 버튼 클릭
      await page.click('[data-testid="password-reset-submit-button"]');

      // 성공 메시지 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="password-reset-success-message"]')
      ).toContainText('비밀번호 재설정 메일을 발송하였습니다');

      // 다이얼로그 닫힘 확인 (성공 후)
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).not.toBeVisible();

      // 페이지 이동 없음 확인 (로그인 페이지 유지)
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    /**
     * 4-5. 빈 이메일 입력 시 에러 표시
     */
    test('빈 이메일 입력 시 에러 메시지 표시', async ({ page }) => {
      // "비밀번호를 잊으셨나요?" 버튼 클릭
      await page.click('[data-testid="forgot-password-button"]');

      // 다이얼로그 표시 대기
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).toBeVisible();

      // 이메일 입력 없이 "재설정 메일 발송" 버튼 클릭
      await page.click('[data-testid="password-reset-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-error-message"]')
      ).toBeVisible();
    });

    /**
     * 4-5. 잘못된 이메일 형식 입력 시 에러 표시
     */
    test('잘못된 이메일 형식 입력 시 에러 메시지 표시', async ({ page }) => {
      // "비밀번호를 잊으셨나요?" 버튼 클릭
      await page.click('[data-testid="forgot-password-button"]');

      // 다이얼로그 표시 대기
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).toBeVisible();

      // 잘못된 형식의 이메일 입력
      await page.fill(
        '[data-testid="password-reset-email-input"]',
        'invalid-email'
      );

      // "재설정 메일 발송" 버튼 클릭
      await page.click('[data-testid="password-reset-submit-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="password-reset-error-message"]')
      ).toBeVisible();
    });

    /**
     * 취소 버튼 클릭 시 다이얼로그 닫힘
     */
    test('취소 버튼 클릭 시 다이얼로그 닫힘', async ({ page }) => {
      // "비밀번호를 잊으셨나요?" 버튼 클릭
      await page.click('[data-testid="forgot-password-button"]');

      // 다이얼로그 표시 대기
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).toBeVisible();

      // "취소" 버튼 클릭
      await page.click('[data-testid="password-reset-cancel-button"]');

      // 다이얼로그 닫힘 확인
      await expect(
        page.locator('[data-testid="password-reset-dialog"]')
      ).not.toBeVisible();
    });
  });

  test.describe('비밀번호 재설정 페이지', () => {
    test.beforeEach(async ({ page }) => {
      // 비밀번호 재설정 페이지로 이동
      await page.goto('/auth/reset-password');

      // 페이지 로드 완료 대기 (data-testid 기반)
      await page.waitForSelector('[data-testid="reset-password-page-container"]');
    });

    /**
     * 4-3. 비밀번호 변경 페이지 UI 테스트
     */
    test('비밀번호 재설정 페이지 UI 요소 표시 확인', async ({ page }) => {
      // 새 비밀번호 입력 필드 표시 확인
      await expect(
        page.locator('[data-testid="new-password-input"]')
      ).toBeVisible();

      // 비밀번호 확인 입력 필드 표시 확인
      await expect(
        page.locator('[data-testid="confirm-password-input"]')
      ).toBeVisible();

      // "비밀번호 변경" 버튼 표시 확인
      await expect(
        page.locator('[data-testid="change-password-button"]')
      ).toBeVisible();
    });

    /**
     * 4-4. 비밀번호 불일치 테스트
     */
    test('비밀번호와 확인 비밀번호 불일치 시 에러 메시지 표시', async ({
      page,
    }) => {
      // 새 비밀번호 입력
      await page.fill('[data-testid="new-password-input"]', 'newpassword123');

      // 다른 비밀번호 확인 입력
      await page.fill(
        '[data-testid="confirm-password-input"]',
        'differentpassword123'
      );

      // "비밀번호 변경" 버튼 클릭
      await page.click('[data-testid="change-password-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="reset-password-error-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="reset-password-error-message"]')
      ).toContainText('비밀번호가 일치하지 않습니다');
    });

    /**
     * 4-5. 비밀번호 최소 길이 검증 테스트
     */
    test('비밀번호 최소 길이 미만 입력 시 에러 메시지 표시', async ({
      page,
    }) => {
      // 짧은 비밀번호 입력 (6자 미만)
      await page.fill('[data-testid="new-password-input"]', '12345');
      await page.fill('[data-testid="confirm-password-input"]', '12345');

      // "비밀번호 변경" 버튼 클릭
      await page.click('[data-testid="change-password-button"]');

      // 에러 메시지 표시 확인
      await expect(
        page.locator('[data-testid="reset-password-error-message"]')
      ).toBeVisible();
    });
  });
});
