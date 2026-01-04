import { test, expect } from '@playwright/test';

test('언어 변경 시 즉시 반영되어야 함', async ({ page }) => {
  // 1. 대시보드 페이지로 이동
  await page.goto('/dashboard');
  
  // 2. 로딩 대기
  await page.waitForSelector('[data-testid="dashboard-container"]', { timeout: 10000 });
  
  // 3. 현재 언어 확인 (한국어가 기본)
  const appNameBefore = await page.locator('h1:has-text("SafeMeals")').first().textContent();
  console.log('Before language change - AppName:', appNameBefore);
  
  // 4. tagline 확인
  const taglineBefore = await page.locator('text=안전하게, 어디서나').first().isVisible().catch(() => false);
  console.log('Korean tagline visible before:', taglineBefore);
  
  // 5. 언어 선택기 찾기
  const languageSelector = page.locator('select[aria-label="언어 선택"]').first();
  await expect(languageSelector).toBeVisible();
  
  // 6. 영어로 변경
  await languageSelector.selectOption('en');
  
  // 7. 약간 대기
  await page.waitForTimeout(500);
  
  // 8. 영어 tagline 확인
  const taglineAfter = await page.locator('text=Safe anywhere').first().isVisible().catch(() => false);
  console.log('English tagline visible after:', taglineAfter);
  
  // 9. 한국어 tagline이 사라졌는지 확인
  const koreanTaglineAfter = await page.locator('text=안전하게, 어디서나').first().isVisible().catch(() => false);
  console.log('Korean tagline visible after:', koreanTaglineAfter);
  
  expect(taglineAfter).toBe(true);
  expect(koreanTaglineAfter).toBe(false);
});
