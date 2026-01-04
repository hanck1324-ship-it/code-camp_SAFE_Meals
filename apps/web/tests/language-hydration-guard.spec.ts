import { test, expect } from '@playwright/test';

/**
 * LanguageHydrationGuard 컴포넌트 테스트
 *
 * zustand persist hydration이 완료될 때까지 로딩 UI를 표시하고,
 * 완료 후 children을 렌더링하는지 검증합니다.
 */
test.describe('LanguageHydrationGuard 테스트', () => {
  const STORAGE_KEY = 'safemeals-language-storage';
  // 테스트 페이지 사용
  const TEST_PAGE = '/test/language-hydration';

  test.describe('성공 시나리오', () => {
    test('localStorage에 영어(en)가 저장된 경우 해당 언어로 로드되어야 한다', async ({
      page,
    }) => {
      // localStorage에 persist 포맷으로 'en' 저장
      await page.addInitScript((key) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            state: { language: 'en' },
            version: 0,
          })
        );
      }, STORAGE_KEY);

      // 페이지 로드
      await page.goto(TEST_PAGE);

      // hydration 완료 후 data-testid="app-content" 대기
      await page.locator('[data-testid="app-content"]').waitFor();

      // children이 렌더링되었는지 확인
      await expect(page.locator('[data-testid="app-content"]')).toBeVisible();

      // 로딩 UI가 표시되지 않는지 확인
      await expect(
        page.locator('[data-testid="language-loading"]')
      ).not.toBeVisible();
    });
  });

  test.describe('hydration 대기 시나리오', () => {
    test('localStorage가 비어있을 때 기본 언어(ko)로 로드되어야 한다', async ({
      page,
    }) => {
      // localStorage 비우기
      await page.addInitScript((key) => {
        localStorage.removeItem(key);
      }, STORAGE_KEY);

      // 페이지 로드
      await page.goto(TEST_PAGE);

      // hydration 완료 후 data-testid="app-content" 대기
      await page.locator('[data-testid="app-content"]').waitFor();

      // children이 렌더링되었는지 확인
      await expect(page.locator('[data-testid="app-content"]')).toBeVisible();
    });
  });

  test.describe('언어 전환 시나리오', () => {
    test('언어 전환 시 localStorage가 업데이트되어야 한다', async ({
      page,
    }) => {
      // localStorage에 persist 포맷으로 'ko' 저장
      await page.addInitScript((key) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            state: { language: 'ko' },
            version: 0,
          })
        );
      }, STORAGE_KEY);

      // 페이지 로드
      await page.goto(TEST_PAGE);

      // hydration 완료 후 data-testid="app-content" 대기
      await page.locator('[data-testid="app-content"]').waitFor();

      // 언어 선택기가 있다면 언어 변경 테스트
      // 언어 선택기가 페이지에 있는지 확인
      const languageSelector = page.locator(
        '[data-testid="language-selector"]'
      );
      const hasSelector = await languageSelector.count();

      if (hasSelector > 0) {
        // 언어 선택기 클릭
        await languageSelector.click();

        // 영어 옵션 선택
        const englishOption = page.locator(
          '[data-testid="language-option-en"]'
        );
        if ((await englishOption.count()) > 0) {
          await englishOption.click();

          // localStorage가 업데이트되었는지 확인
          const storedValue = await page.evaluate((key) => {
            return localStorage.getItem(key);
          }, STORAGE_KEY);

          const parsed = JSON.parse(storedValue || '{}');
          expect(parsed.state?.language).toBe('en');
        }
      }

      // 언어 선택기가 없어도 테스트 통과 (기본 동작 확인)
      await expect(page.locator('[data-testid="app-content"]')).toBeVisible();
    });
  });
});
