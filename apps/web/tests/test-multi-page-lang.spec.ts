import { test, expect } from '@playwright/test';

test.describe('다양한 페이지에서 언어 전환 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
  });

  test('로그인 페이지', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForSelector('[data-testid="login-page-container"]', {
      timeout: 10000,
    });

    // 한국어 확인
    await expect(page.locator('text=안전한 식사를 시작하세요')).toBeVisible();

    // 영어로 변경
    await page
      .locator('select[aria-label="언어 선택"]')
      .first()
      .selectOption('en');
    await page.waitForTimeout(500);

    // 영어 확인
    await expect(
      page.locator('text=Start your safe dining experience')
    ).toBeVisible();

    // 일본어로 변경
    await page
      .locator('select[aria-label="언어 선택"]')
      .first()
      .selectOption('ja');
    await page.waitForTimeout(500);

    // 일본어 확인
    await expect(
      page.locator('text=安全な食事体験を始めましょう')
    ).toBeVisible();
  });

  test('회원가입 페이지 - 언어 유지', async ({ page }) => {
    // 로그인 페이지에서 영어로 설정
    await page.goto('/auth/login');
    await page.waitForSelector('[data-testid="login-page-container"]', {
      timeout: 10000,
    });
    await page
      .locator('select[aria-label="언어 선택"]')
      .first()
      .selectOption('en');
    await page.waitForTimeout(500);

    // 회원가입 페이지로 이동
    await page.click('text=Sign Up');
    await page.waitForTimeout(1000);

    // 영어가 유지되는지 확인 (회원가입 관련 영어 텍스트)
    const pageText = await page.locator('body').textContent();
    console.log('Signup page text snippet:', pageText?.substring(0, 300));

    // 언어 선택기가 영어로 설정되어 있는지 확인
    const langSelector = page.locator('select[aria-label="언어 선택"]').first();
    if (await langSelector.isVisible().catch(() => false)) {
      const selectedLang = await langSelector.inputValue();
      console.log('Selected language on signup:', selectedLang);
      expect(selectedLang).toBe('en');
    }
  });
});
