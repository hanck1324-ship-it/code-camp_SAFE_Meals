import { test, expect } from '@playwright/test';

/**
 * 안전카드 PIN 검증 기능 테스트 (Playwright 기반)
 *
 * 테스트 시나리오:
 * 1) PIN 입력 폼이 렌더링되는지 확인
 * 2) 4자리 PIN 입력 후 제출 시 검증 성공 및 안전카드 내용 표시
 * 3) 잘못된 PIN 입력 시 에러 메시지 표시
 * 4) 4자리가 아닌 PIN 입력 시 유효성 검증 실패
 * 5) 숫자가 아닌 문자 입력 시 유효성 검증 실패
 *
 * 테스트 조건:
 * - jest, @testing-library/react 제외
 * - timeout: 500ms 미만
 * - 페이지 로드 식별: data-testid 대기 (networkidle 금지)
 */

// 테스트용 계정 정보 (환경변수에서 가져옴)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// 올바른 테스트용 PIN (환경변수 또는 기본값)
const TEST_CORRECT_PIN = process.env.TEST_SAFETY_CARD_PIN || '1234';

test.describe('안전카드 PIN 검증 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 먼저 수행
    await page.goto('/auth/login');
    await page.waitForSelector('[data-testid="login-page-container"]');

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-submit-button"]');

    // 대시보드로 리다이렉트 대기
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 안전카드 페이지로 이동
    await page.goto('/profile/safety-card');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector('[data-testid="safety-card-page-container"]');
  });

  /**
   * 테스트 1) PIN 입력 폼이 렌더링되는지 확인
   */
  test('PIN 입력 폼이 렌더링된다', async ({ page }) => {
    // PIN 입력 폼 컨테이너 확인
    await expect(
      page.locator('[data-testid="safety-card-pin-form"]')
    ).toBeVisible();

    // PIN 입력 필드들 확인 (4개)
    for (let i = 0; i < 4; i++) {
      await expect(
        page.locator(`[data-testid="pin-input-${i}"]`)
      ).toBeVisible();
    }

    // 잠금 해제 버튼 확인
    await expect(
      page.locator('[data-testid="pin-submit-button"]')
    ).toBeVisible();
  });

  /**
   * 테스트 2) 4자리 PIN 입력 후 제출 시 검증 성공 및 안전카드 내용 표시
   */
  test('올바른 4자리 PIN 입력 후 제출 시 안전카드 내용이 표시된다', async ({
    page,
  }) => {
    // 4자리 PIN 입력
    for (let i = 0; i < 4; i++) {
      await page.fill(`[data-testid="pin-input-${i}"]`, TEST_CORRECT_PIN[i]);
    }

    // 잠금 해제 버튼 클릭
    await page.click('[data-testid="pin-submit-button"]');

    // 안전카드 내용 표시 확인
    await expect(
      page.locator('[data-testid="safety-card-content"]')
    ).toBeVisible();

    // 잠금 해제 상태 확인 (PIN 입력 폼이 숨겨짐)
    await expect(
      page.locator('[data-testid="safety-card-pin-form"]')
    ).not.toBeVisible();
  });

  /**
   * 테스트 3) 잘못된 PIN 입력 시 에러 메시지 표시
   */
  test('잘못된 PIN 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    // 잘못된 4자리 PIN 입력
    const wrongPin = '9999';
    for (let i = 0; i < 4; i++) {
      await page.fill(`[data-testid="pin-input-${i}"]`, wrongPin[i]);
    }

    // 잠금 해제 버튼 클릭
    await page.click('[data-testid="pin-submit-button"]');

    // 에러 메시지 표시 확인
    await expect(
      page.locator('[data-testid="pin-error-message"]')
    ).toBeVisible();

    // 에러 메시지 내용 확인
    await expect(
      page.locator('[data-testid="pin-error-message"]')
    ).toContainText('PIN 번호가 일치하지 않습니다.');

    // 잠금 상태 유지 확인 (PIN 입력 폼이 여전히 표시됨)
    await expect(
      page.locator('[data-testid="safety-card-pin-form"]')
    ).toBeVisible();
  });

  /**
   * 테스트 4) 4자리가 아닌 PIN 입력 시 유효성 검증 실패
   */
  test('4자리가 아닌 PIN 입력 시 유효성 검증 실패 메시지가 표시된다', async ({
    page,
  }) => {
    // 3자리만 입력
    for (let i = 0; i < 3; i++) {
      await page.fill(`[data-testid="pin-input-${i}"]`, '1');
    }

    // 잠금 해제 버튼 클릭
    await page.click('[data-testid="pin-submit-button"]');

    // 에러 메시지 표시 확인
    await expect(
      page.locator('[data-testid="pin-error-message"]')
    ).toBeVisible();

    // 에러 메시지 내용 확인
    await expect(
      page.locator('[data-testid="pin-error-message"]')
    ).toContainText('PIN은 정확히 4자리여야 합니다.');
  });

  /**
   * 테스트 5) 숫자가 아닌 문자 입력 시 유효성 검증 실패
   *
   * 참고: 입력 필드에서 숫자만 허용하도록 구현되어 있으므로,
   * 문자 입력 시 입력이 무시되어 PIN이 비어있는 상태가 됨
   */
  test('숫자가 아닌 문자는 입력되지 않는다', async ({ page }) => {
    // 문자 입력 시도
    await page.fill('[data-testid="pin-input-0"]', 'a');

    // 입력 필드가 비어있는지 확인 (숫자가 아닌 문자는 필터링됨)
    await expect(page.locator('[data-testid="pin-input-0"]')).toHaveValue('');
  });
});
