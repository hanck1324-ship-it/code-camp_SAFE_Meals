import { test, expect } from '@playwright/test';

test.describe('Menu Normalization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-ocr-pipeline');
    await page.waitForSelector('[data-testid="ocr-pipeline-test-page"]', {
      timeout: 10000,
    });
  });

  test('removes spacing in menu names', async ({ page }) => {
    // First run cleansing
    const input = [
      {
        text: '김치 찌개',
        confidence: 0.90,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.waitForTimeout(100); // Wait for state update
    await page.click('[data-testid="run-cleansing"]');

    // Wait for cleansing to complete
    await page.waitForTimeout(200);

    // Then run normalization
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results[0].normalized).toBe('김치찌개');
  });

  test('expands abbreviations', async ({ page }) => {
    const input = [
      {
        text: '삼겹',
        confidence: 0.88,
        bbox: { x: 10, y: 20, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results[0].normalized).toBe('삼겹살');
  });

  test('removes duplicates', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '김치찌개',
        confidence: 0.92,
        bbox: { x: 10, y: 60, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(1);
    expect(results[0].normalized).toBe('김치찌개');
    // Should keep the higher confidence item
    expect(results[0].confidence).toBe(0.95);
  });

  test('merges similar items', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '김치찌게',
        confidence: 0.88,
        bbox: { x: 10, y: 60, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(1);
    expect(results[0].normalized).toBe('김치찌개');
  });

  test('preserves bbox from first/highest confidence item', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '김치찌게',
        confidence: 0.88,
        bbox: { x: 10, y: 60, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    // Should preserve bbox from higher confidence item
    expect(results[0].bbox).toEqual({ x: 10, y: 20, w: 100, h: 30 });
  });

  test('handles empty array', async ({ page }) => {
    // Test via API directly since UI button is disabled for empty arrays
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/ocr-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocrResults: [],
          stages: ['cleanse', 'normalize'],
        }),
      });
      return res.json();
    });

    expect(response.normalized).toEqual([]);
  });

  test('handles multiple different items', async ({ page }) => {
    const input = [
      {
        text: '김치찌개',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '삼겹',
        confidence: 0.90,
        bbox: { x: 120, y: 20, w: 80, h: 30 },
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
    await page.waitForTimeout(100);
    await page.click('[data-testid="run-cleansing"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="run-normalization"]');
    await page.waitForTimeout(200);

    const resultText = await page.textContent(
      '[data-testid="normalized-results"]'
    );
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(3);
    expect(results[0].normalized).toBe('김치찌개');
    expect(results[1].normalized).toBe('삼겹살'); // Expanded
    expect(results[2].normalized).toBe('불고기');
  });
});
