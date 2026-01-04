import { test, expect } from '@playwright/test';

test('로그인 페이지에서 언어 변경 시 즉시 반영되어야 함', async ({ page }) => {
  // localStorage 초기화
  await page.goto('/auth/login');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 로그인 페이지 로딩 대기
  await page.waitForSelector('[data-testid="login-page-container"]', {
    timeout: 10000,
  });

  // 현재 언어 확인 (한국어가 기본) - subtitle 사용
  const koreanSubtitle = page.locator('text=안전한 식사를 시작하세요');
  const isKoreanVisible = await koreanSubtitle.isVisible().catch(() => false);
  console.log('Korean subtitle visible initially:', isKoreanVisible);

  // 언어 선택기 찾기
  const languageSelector = page
    .locator('select[aria-label="언어 선택"]')
    .first();
  await expect(languageSelector).toBeVisible({ timeout: 5000 });

  // 현재 선택된 언어 확인
  const currentLang = await languageSelector.inputValue();
  console.log('Current language:', currentLang);

  // 영어로 변경
  await languageSelector.selectOption('en');

  // 대기
  await page.waitForTimeout(1000);

  // 영어 subtitle 확인
  const englishSubtitle = page.locator(
    'text=Start your safe dining experience'
  );
  const isEnglishVisible = await englishSubtitle.isVisible().catch(() => false);
  console.log('English subtitle visible after change:', isEnglishVisible);

  // 한국어 subtitle이 사라졌는지 확인
  const isKoreanStillVisible = await koreanSubtitle
    .isVisible()
    .catch(() => false);
  console.log(
    'Korean subtitle still visible after change:',
    isKoreanStillVisible
  );

  // 페이지 HTML 출력
  const bodyText = await page.locator('body').textContent();
  console.log('Page text snippet:', bodyText?.substring(0, 500));

  // 페이지 스크린샷
  await page.screenshot({ path: 'test-results/lang-switch-after.png' });

  expect(isEnglishVisible).toBe(true);
});
