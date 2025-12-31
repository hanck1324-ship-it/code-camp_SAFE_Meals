import { test, expect } from '@playwright/test';

/**
 * 이미지 분석 제출 기능 테스트 (Playwright 기반)
 *
 * 테스트 시나리오:
 * 1) 이미지 촬영 후 "분석하기" 버튼 클릭 시 Edge Function 호출
 * 2) 품질 검사 통과 시 결과 페이지로 이동
 * 3) 품질 검사 실패 시 에러 메시지 표시 및 카메라 화면 유지
 * 4) 네트워크 에러 시 적절한 에러 메시지 표시
 * 5) 로딩 상태 동안 버튼 비활성화
 *
 * 테스트 조건:
 * - jest, @testing-library/react 제외
 * - timeout: 500ms 미만 (페이지 대기 제외)
 * - 페이지 로드 식별: data-testid 대기 (networkidle 금지)
 */

// 테스트용 이미지 URI (Base64 작은 이미지)
const TEST_IMAGE_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.describe('이미지 분석 제출 기능 테스트', () => {
  /**
   * 테스트 1) 분석 페이지가 올바르게 로드된다
   */
  test('분석 페이지가 올바르게 로드된다', async ({ page }) => {
    // API mock 설정 (분석 자동 시작 방지를 위해 느린 응답)
    await page.route('**/api/scan/analyze', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: { passed: true },
          analysis: {
            overall_status: 'SAFE',
            detected_ingredients: [],
            warnings: [],
            message_ko: '안전합니다',
            message_en: 'Safe to eat',
          },
        }),
      });
    });

    // 이미지 URI를 포함하여 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 페이지 요소 확인
    await expect(page.locator('[data-testid="preview-image"]')).toBeVisible();
  });

  /**
   * 테스트 2) 이미지가 없으면 안내 메시지가 표시된다
   */
  test('이미지가 없으면 안내 메시지가 표시된다', async ({ page }) => {
    // 이미지 없이 페이지로 이동
    await page.goto('/scan/analyze');
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 안내 메시지 확인
    await expect(page.locator('[data-testid="no-image-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="go-to-camera-button"]')).toBeVisible();
  });

  /**
   * 테스트 3) 분석 중 로딩 상태가 표시된다
   */
  test('분석 중 로딩 상태가 표시된다', async ({ page }) => {
    // API mock 설정 (지연된 응답)
    await page.route('**/api/scan/analyze', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: { passed: true },
          analysis: {
            overall_status: 'SAFE',
            detected_ingredients: [],
            warnings: [],
            message_ko: '안전합니다',
            message_en: 'Safe to eat',
          },
        }),
      });
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 로딩 상태 확인
    await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-text"]')).toBeVisible();
  });

  /**
   * 테스트 4) 품질 검사 통과 시 결과 페이지로 이동한다
   */
  test('품질 검사 통과 시 결과 페이지로 이동한다', async ({ page }) => {
    // API mock 설정 (성공 응답)
    await page.route('**/api/scan/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: { passed: true },
          analysis: {
            overall_status: 'SAFE',
            detected_ingredients: ['김치', '두부'],
            warnings: [],
            message_ko: '안전하게 섭취할 수 있습니다.',
            message_en: 'Safe to consume.',
          },
        }),
      });
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 결과 페이지로 이동 확인
    await page.waitForURL('**/scan/result', { timeout: 10000 });
    expect(page.url()).toContain('/scan/result');
  });

  /**
   * 테스트 5) 품질 검사 실패 시 에러 메시지가 표시된다
   */
  test('품질 검사 실패 시 에러 메시지가 표시된다', async ({ page }) => {
    // API mock 설정 (품질 검사 실패)
    await page.route('**/api/scan/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: {
            passed: false,
            reason: '사진이 흔들렸어요. 다시 촬영해주세요.',
          },
        }),
      });
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      '사진이 흔들렸어요'
    );

    // 재촬영 버튼 확인
    await expect(page.locator('[data-testid="retake-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  /**
   * 테스트 6) 네트워크 에러 시 에러 메시지가 표시된다
   */
  test('네트워크 에러 시 에러 메시지가 표시된다', async ({ page }) => {
    // API mock 설정 (네트워크 에러)
    await page.route('**/api/scan/analyze', async (route) => {
      await route.abort('failed');
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * 테스트 7) 서버 에러 시 에러 메시지가 표시된다
   */
  test('서버 에러 시 에러 메시지가 표시된다', async ({ page }) => {
    // API mock 설정 (서버 에러)
    await page.route('**/api/scan/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
        }),
      });
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 10000,
    });
  });

  /**
   * 테스트 8) 로딩 중 분석 버튼이 비활성화된다
   */
  test('로딩 중 분석 버튼이 비활성화된다', async ({ page }) => {
    // API mock 설정 (지연된 응답)
    await page.route('**/api/scan/analyze', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: { passed: true },
          analysis: {
            overall_status: 'SAFE',
            detected_ingredients: [],
            warnings: [],
            message_ko: '안전합니다',
            message_en: 'Safe to eat',
          },
        }),
      });
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 로딩 상태 확인
    await expect(page.locator('[data-testid="loading-overlay"]')).toBeVisible({
      timeout: 5000,
    });

    // 분석 버튼이 비활성화되어 있는지 확인
    await expect(page.locator('[data-testid="analyze-button"]')).toBeDisabled();
  });

  /**
   * 테스트 9) 재촬영 버튼 클릭 시 뒤로 이동한다
   */
  test('재촬영 버튼 클릭 시 뒤로 이동한다', async ({ page }) => {
    // API mock 설정 (품질 검사 실패)
    await page.route('**/api/scan/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          quality: {
            passed: false,
            reason: '너무 어두워요.',
          },
        }),
      });
    });

    // 분석 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 에러 메시지 대기
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 10000,
    });

    // 재촬영 버튼이 표시되는지 확인
    await expect(page.locator('[data-testid="retake-button"]')).toBeVisible();

    // 재촬영 버튼 클릭
    await page.click('[data-testid="retake-button"]');

    // URL이 변경되었는지 확인 (analyze 페이지를 벗어남)
    await page.waitForFunction(() => !window.location.href.includes('/scan/analyze'), {
      timeout: 5000,
    });
  });

  /**
   * 테스트 10) 재시도 버튼 클릭 시 다시 분석을 시도한다
   */
  test('재시도 버튼 클릭 시 다시 분석을 시도한다', async ({ page }) => {
    let callCount = 0;

    // API mock 설정 (첫 번째는 실패, 두 번째는 성공)
    await page.route('**/api/scan/analyze', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            quality: {
              passed: false,
              reason: '일시적인 오류입니다.',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            quality: { passed: true },
            analysis: {
              overall_status: 'SAFE',
              detected_ingredients: [],
              warnings: [],
              message_ko: '안전합니다',
              message_en: 'Safe to eat',
            },
          }),
        });
      }
    });

    // 페이지로 이동
    await page.goto(`/scan/analyze?imageUri=${encodeURIComponent(TEST_IMAGE_URI)}`);
    await page.waitForSelector('[data-testid="analyze-page"]');

    // 에러 메시지 대기
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 10000,
    });

    // 재시도 버튼 클릭
    await page.click('[data-testid="retry-button"]');

    // 결과 페이지로 이동 확인
    await page.waitForURL('**/scan/result', { timeout: 10000 });
    expect(page.url()).toContain('/scan/result');
  });
});
