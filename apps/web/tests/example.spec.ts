import { test, expect } from '@playwright/test';

test.describe('SafeMeals 기본 테스트', () => {
  test('메인 페이지 로드 확인', async ({ page }) => {
    // 메인 페이지로 이동
    await page.goto('/');

    // 페이지 제목 확인
    await expect(page).toHaveTitle(/SafeMeals/);
  });
});
