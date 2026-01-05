import { test, expect } from '@playwright/test';

test.describe('언어 전역 상태 동기화 테스트', () => {
  test('메인페이지에서 언어 변경 시 마이페이지에도 반영되어야 함', async ({
    page,
  }) => {
    // 콘솔 로그 수집
    const logs: string[] = [];
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

    // 테스트 페이지에서 확인 (로그인 필요 없음)
    await page.goto('/test/language-hydration');
    await page
      .locator('[data-testid="app-content"]')
      .waitFor({ timeout: 5000 });

    // 초기 언어 확인
    const initialLang = await page
      .locator('[data-testid="current-language"]')
      .textContent();
    console.log(`Initial language: ${initialLang}`);

    // 영어로 변경
    await page.locator('[data-testid="change-to-en"]').click();
    await page.waitForTimeout(500);

    // localStorage 확인
    const storageAfterChange = await page.evaluate(() => {
      return localStorage.getItem('safemeals-language-storage');
    });
    console.log(`localStorage after change: ${storageAfterChange}`);

    // 현재 언어 확인
    const langAfterChange = await page
      .locator('[data-testid="current-language"]')
      .textContent();
    console.log(`Language after change: ${langAfterChange}`);

    // 페이지 새로고침
    await page.reload();
    await page
      .locator('[data-testid="app-content"]')
      .waitFor({ timeout: 5000 });

    // 새로고침 후 언어 확인
    const langAfterReload = await page
      .locator('[data-testid="current-language"]')
      .textContent();
    console.log(`Language after reload: ${langAfterReload}`);

    // localStorage 확인
    const storageAfterReload = await page.evaluate(() => {
      return localStorage.getItem('safemeals-language-storage');
    });
    console.log(`localStorage after reload: ${storageAfterReload}`);

    // 영어로 유지되어야 함
    expect(langAfterReload).toBe('en');
  });
});
