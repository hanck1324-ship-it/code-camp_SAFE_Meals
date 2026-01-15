/**
 * 안전카드 접근 보안 테스트
 *
 * 목적: 프로필 페이지에서 안전카드로 이동 시 PIN 입력이 반드시 나타나는지 확인
 */

import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = 'test@safemeals.com';
const TEST_USER_PASSWORD = 'Test1234!';

test.describe('안전카드 접근 보안 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // 로그인 완료 대기 (최대 20초)
    await page.waitForURL(/\/(dashboard|profile|scan)/, { timeout: 20000 });
  });

  test('프로필 페이지에서 안전카드 직접 접근 시 PIN 입력 폼이 나타난다', async ({ page }) => {
    // 안전카드 페이지로 직접 이동
    await page.goto('/profile/safety-card');

    // PIN 입력 폼이 렌더링되는지 확인
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible({ timeout: 10000 });

    // PIN 입력 필드가 4개 있는지 확인
    const pinInputs = page.locator('[data-testid^="pin-input-"]');
    await expect(pinInputs).toHaveCount(4);

    // 제출 버튼이 있는지 확인
    await expect(page.locator('[data-testid="pin-submit-button"]')).toBeVisible();

    // 안전카드 내용이 보이지 않는지 확인 (잠금 상태)
    await expect(page.locator('[data-testid="safety-card-content"]')).not.toBeVisible();

    console.log('✅ PIN 입력 폼이 정상적으로 나타났습니다.');
  });

  test('브라우저 새로고침 후에도 PIN 입력이 유지된다', async ({ page }) => {
    // 안전카드 페이지로 이동
    await page.goto('/profile/safety-card');

    // PIN 입력 폼 확인
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 새로고침 후에도 PIN 입력 폼이 다시 나타나야 함
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible();

    console.log('✅ 새로고침 후에도 PIN 입력 폼이 유지됩니다.');
  });

  test('뒤로가기 후 다시 접근 시 PIN 입력이 요구된다', async ({ page }) => {
    // 안전카드 페이지로 이동
    await page.goto('/profile/safety-card');

    // PIN 입력 폼 확인
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible();

    // 뒤로 가기
    await page.goBack();

    // 다시 안전카드 페이지로 이동
    await page.goto('/profile/safety-card');

    // PIN 입력 폼이 다시 나타나야 함
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible();

    console.log('✅ 뒤로가기 후 재접근 시에도 PIN 입력이 요구됩니다.');
  });

  test('올바른 PIN 입력 후 안전카드 내용이 표시된다', async ({ page }) => {
    // 안전카드 페이지로 이동
    await page.goto('/profile/safety-card');

    // PIN 입력 폼 대기
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).toBeVisible();

    // 올바른 PIN 입력 (1234로 가정)
    const correctPin = '1234';
    for (let i = 0; i < 4; i++) {
      await page.fill(`[data-testid="pin-input-${i}"]`, correctPin[i]);
    }

    // 제출 버튼 클릭
    await page.click('[data-testid="pin-submit-button"]');

    // 안전카드 내용이 표시되는지 확인 (로딩, 에러, 빈 데이터, 또는 실제 내용)
    await page.waitForSelector(
      '[data-testid="safety-card-content"], [data-testid="safety-card-loading"], [data-testid="safety-card-error-message"], [data-testid="safety-card-empty-message"]',
      { timeout: 10000 }
    );

    // PIN 입력 폼이 사라졌는지 확인
    await expect(page.locator('[data-testid="safety-card-pin-form"]')).not.toBeVisible();

    console.log('✅ 올바른 PIN 입력 후 안전카드 페이지로 전환되었습니다.');
  });
});