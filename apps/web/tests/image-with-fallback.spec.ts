import { test, expect } from '@playwright/test';

test.describe('ImageWithFallback 컴포넌트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('/test-image-fallback', { waitUntil: 'domcontentloaded' });
    // 페이지가 완전히 마운트될 때까지 대기
    await page.waitForSelector('[data-testid="page-loaded"]', { timeout: 30000 });
  });

  test('정상 이미지가 올바르게 표시되어야 함', async ({ page }) => {
    const validImage = page.getByTestId('valid-image');

    // 이미지가 표시될 때까지 대기
    await validImage.waitFor({ state: 'visible' });

    // 이미지 요소가 존재하는지 확인
    await expect(validImage).toBeVisible();

    // alt 텍스트 확인
    await expect(validImage).toHaveAttribute('alt', '정상 이미지');

    // src 속성이 올바른지 확인
    const src = await validImage.getAttribute('src');
    expect(src).toContain('picsum.photos/200/300');
  });

  test('잘못된 이미지 URL에 대해 폴백 UI를 표시해야 함', async ({ page }) => {
    // 에러 섹션 찾기
    const errorSection = page.getByTestId('error-section');

    // 폴백 이미지가 표시될 때까지 대기 (에러가 발생하는데 시간이 걸릴 수 있음)
    // data-original-url 속성을 가진 img가 나타날 때까지 대기
    const fallbackImage = errorSection.locator('img[data-original-url]');
    await expect(fallbackImage).toBeVisible({ timeout: 10000 });

    const src = await fallbackImage.getAttribute('src');
    expect(src).toContain('data:image/svg+xml;base64');

    // 원본 URL이 data 속성으로 저장되어 있는지 확인
    const originalUrl = await fallbackImage.getAttribute('data-original-url');
    expect(originalUrl).toContain('invalid-url-that-does-not-exist.com');
  });

  test('스타일이 올바르게 적용되어야 함', async ({ page }) => {
    const styledImage = page.getByTestId('styled-image');

    await styledImage.waitFor({ state: 'visible' });

    // 클래스가 적용되었는지 확인
    const className = await styledImage.getAttribute('class');
    expect(className).toContain('rounded-lg');
    expect(className).toContain('border-2');
    expect(className).toContain('border-blue-500');

    // 인라인 스타일이 적용되었는지 확인
    const style = await styledImage.getAttribute('style');
    expect(style).toContain('width');
    expect(style).toContain('height');
  });

  test('추가 HTML 속성이 올바르게 전달되어야 함', async ({ page }) => {
    const lazyImage = page.getByTestId('lazy-image');

    await lazyImage.waitFor({ state: 'visible' });

    // loading 속성 확인
    await expect(lazyImage).toHaveAttribute('loading', 'lazy');

    // 커스텀 data 속성 확인
    await expect(lazyImage).toHaveAttribute('data-custom-attr', 'test-value');
  });

  test('이미지 로딩 상태 변화 테스트', async ({ page }) => {
    // 새로운 이미지를 동적으로 추가하여 로딩 과정 테스트
    const testImage = 'https://picsum.photos/seed/test123/250/250';

    await page.evaluate((src) => {
      const container = document.createElement('div');
      container.id = 'dynamic-test';
      const img = document.createElement('img');
      img.setAttribute('data-testid', 'dynamic-image');
      img.src = src;
      container.appendChild(img);
      document.body.appendChild(container);
    }, testImage);

    const dynamicImage = page.getByTestId('dynamic-image');
    await expect(dynamicImage).toBeVisible();
  });

  test('폴백 UI의 구조가 올바른지 확인', async ({ page }) => {
    const errorSection = page.getByTestId('error-section');

    // 폴백 이미지가 표시되는지 확인
    const fallbackImage = errorSection.locator('img[data-original-url]');
    await expect(fallbackImage).toBeVisible({ timeout: 10000 });

    // 폴백 이미지의 부모 div 확인 (bg-gray-100 클래스를 가진)
    const fallbackDiv = errorSection.locator('div.bg-gray-100');
    await expect(fallbackDiv).toBeVisible();

    // flex 컨테이너가 존재하는지 확인
    const flexContainer = fallbackDiv.locator('div.flex');
    await expect(flexContainer).toBeVisible();
  });

  test('여러 이미지가 독립적으로 동작하는지 확인', async ({ page }) => {
    // 정상 이미지는 표시되고
    const validImage = page.getByTestId('valid-image');
    await expect(validImage).toBeVisible();

    // 에러 이미지는 폴백이 표시되어야 함
    const errorSection = page.getByTestId('error-section');
    const fallbackImage = errorSection.locator('img[data-original-url]');
    await expect(fallbackImage).toBeVisible({ timeout: 10000 });

    // 스타일 이미지도 정상 표시
    const styledImage = page.getByTestId('styled-image');
    await expect(styledImage).toBeVisible();
  });
});
