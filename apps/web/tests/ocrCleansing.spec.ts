import { test, expect } from '@playwright/test';

test.describe('OCR Cleansing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test-ocr-pipeline');
    await page.waitForSelector('[data-testid="ocr-pipeline-test-page"]');
  });

  test('removes noise and special characters', async ({ page }) => {
    const input = [
      {
        text: '김치찌개##',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(1);
    expect(results[0].original).toBe('김치찌개##');
    expect(results[0].cleansed).toBe('김치찌개');
    expect(results[0].confidence).toBe(0.95);
  });

  test('fixes Korean OCR errors', async ({ page }) => {
    const input = [
      {
        text: 'ㄱ치찌개',
        confidence: 0.87,
        bbox: { x: 10, y: 60, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].cleansed).toBe('김치찌개');
  });

  test('normalizes price formatting - removes commas', async ({ page }) => {
    const input = [
      {
        text: '10,000원',
        confidence: 0.92,
        bbox: { x: 120, y: 20, w: 80, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].cleansed).toBe('10000원');
  });

  test('normalizes price formatting - converts k notation', async ({ page }) => {
    const input = [
      {
        text: '10k',
        confidence: 0.90,
        bbox: { x: 120, y: 20, w: 60, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].cleansed).toBe('10000');
  });

  test('normalizes price formatting - converts 만원', async ({ page }) => {
    const input = [
      {
        text: '1만원',
        confidence: 0.91,
        bbox: { x: 120, y: 20, w: 70, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].cleansed).toBe('10000원');
  });

  test('preserves confidence and bbox', async ({ page }) => {
    const input = [
      {
        text: '김치찌개##',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].confidence).toBe(0.95);
    expect(results[0].bbox).toEqual({ x: 10, y: 20, w: 100, h: 30 });
  });

  test('handles empty array', async ({ page }) => {
    const input: never[] = [];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results).toEqual([]);
  });

  test('handles multiple items', async ({ page }) => {
    const input = [
      {
        text: '김치찌개##',
        confidence: 0.95,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
      {
        text: '10,000원',
        confidence: 0.92,
        bbox: { x: 120, y: 20, w: 80, h: 30 },
      },
      {
        text: 'ㄱ치찌개',
        confidence: 0.87,
        bbox: { x: 10, y: 60, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results).toHaveLength(3);
    expect(results[0].cleansed).toBe('김치찌개');
    expect(results[1].cleansed).toBe('10000원');
    expect(results[2].cleansed).toBe('김치찌개');
  });

  test('fixes common Korean typos', async ({ page }) => {
    const input = [
      {
        text: '김치찌게',
        confidence: 0.88,
        bbox: { x: 10, y: 20, w: 100, h: 30 },
      },
    ];

    await page.fill(
      '[data-testid="ocr-input-textarea"]',
      JSON.stringify(input)
    );
    await page.click('[data-testid="run-cleansing"]');

    const resultText = await page.textContent('[data-testid="cleansed-results"]');
    const results = JSON.parse(resultText!);

    expect(results[0].cleansed).toBe('김치찌개');
  });
});
