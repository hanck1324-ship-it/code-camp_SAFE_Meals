import { test, expect } from '@playwright/test';

test.describe('Menu Translation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-ocr-pipeline');
    await page.waitForSelector('[data-testid="ocr-pipeline-test-page"]', {
      timeout: 10000,
    });
  });

  test('translates from local mapping table', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(1);
    expect(results[0].translated).toBe('Kimchi Stew');
    expect(results[0].normalized).toBe('김치찌개');
  });

  test('uses romanization for unique dishes', async ({ page }) => {
    const input = [
      {
        text: '불고기',
        confidence: 0.93,
        bbox: { x: 10, y: 20, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results[0].translated).toBe('Bulgogi');
  });

  test('combines romanization and translation', async ({ page }) => {
    const input = [
      {
        text: '삼계탕',
        confidence: 0.92,
        bbox: { x: 10, y: 20, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results[0].translated).toBe('Samgyetang (Ginseng Chicken Soup)');
  });

  test('generates unique IDs', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '불고기',
        confidence: 0.93,
        bbox: { x: 10, y: 60, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBeTruthy();
    expect(results[1].id).toBeTruthy();
    expect(results[0].id).not.toBe(results[1].id);
    expect(results[0].id).toMatch(/^menu-/);
  });

  test('preserves bbox information', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results[0].bbox).toEqual({ x: 10, y: 20, w: 100, h: 30 });
  });

  test('falls back to normalized on unmapped items', async ({ page }) => {
    const input = [
      {
        text: '신기한메뉴',
        confidence: 0.85,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    // Should fall back to the normalized Korean name
    expect(results[0].translated).toBe('신기한메뉴');
  });

  test('handles empty array', async ({ page }) => {
    // Test via API directly since UI button is disabled for empty arrays
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/ocr-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrResults: [],
          stages: ['cleanse', 'normalize', 'translate'],
        }),
      });
      return res.json();
    });

    expect(response.translated).toEqual([]);
  });

  test('handles complete pipeline', async ({ page }) => {
    const input = [
      {
        text: '김치찌개##',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '삼겹',
        confidence: 0.90,
        bbox: { x: 10, y: 60, w: 80, h: 30 },
      },
      {
        text: '불고기',
        confidence: 0.93,
        bbox: { x: 10, y: 100, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-translation"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="translated-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(3);
    expect(results[0].translated).toBe('Kimchi Stew');
    expect(results[1].translated).toBe('Samgyeopsal (Pork Belly)');
    expect(results[2].translated).toBe('Bulgogi');
  });
});
