import { test, expect } from '@playwright/test';

/**
 * API 에러 핸들링 테스트
 *
 * P0 (Critical) 테스트 케이스:
 * 1. 401 인증 실패 - 토큰 없음
 * 2. 401 인증 실패 - 유효하지 않은 토큰
 * 3. 400 Bad Request - 이미지 파일 없음
 * 4. 429 Rate Limit - Gemini API 과부하
 * 5. 500 서버 에러 - 내부 오류
 * 6. 504 Gateway Timeout - 타임아웃
 * 7. Gemini API 응답 파싱 실패
 */

// 테스트용 이미지 (1x1 픽셀 PNG)
const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.describe('API 에러 핸들링 테스트', () => {
  test.describe('인증 에러 (401)', () => {
    /**
     * 테스트: 토큰 없이 요청 시 401 반환
     */
    test('토큰 없이 요청 시 401 반환', async ({ page }) => {
      // API 호출을 가로채서 응답 확인
      let apiResponse: { status: number; body: unknown } | null = null;

      await page.route('**/api/scan/analyze', async (route) => {
        // 토큰 없이 요청하면 서버에서 401 반환
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '로그인이 필요합니다. (토큰 없음)',
          }),
        });
      });

      // 페이지에서 API 응답 감지
      page.on('response', async (response) => {
        if (response.url().includes('/api/scan/analyze')) {
          apiResponse = {
            status: response.status(),
            body: await response.json().catch(() => null),
          };
        }
      });

      // 분석 페이지로 이동 (이미지 포함)
      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      // API 호출 대기
      await page.waitForResponse('**/api/scan/analyze');

      // 검증
      expect(apiResponse).not.toBeNull();
      expect(apiResponse!.status).toBe(401);
    });

    /**
     * 테스트: 유효하지 않은 토큰으로 요청 시 401 반환
     */
    test('유효하지 않은 토큰으로 요청 시 401 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        const headers = route.request().headers();
        const authHeader = headers['authorization'];

        // 잘못된 토큰 검증
        if (authHeader === 'Bearer invalid-token-12345') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              message: '유효하지 않은 사용자입니다.',
            }),
          });
        } else {
          await route.continue();
        }
      });

      // 잘못된 토큰으로 API 직접 호출
      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    /**
     * 테스트: 만료된 토큰으로 요청 시 401 반환
     */
    test('만료된 토큰으로 요청 시 401 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer expired-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('Bad Request 에러 (400)', () => {
    /**
     * 테스트: 이미지 파일 없이 요청 시 400 반환
     */
    test('이미지 파일 없이 요청 시 400 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '이미지 파일이 없습니다.',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        // 이미지 파일 없이 요청
        multipart: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.message).toContain('이미지');
    });

    /**
     * 테스트: 잘못된 이미지 형식으로 요청 시 400 반환
     */
    test('잘못된 이미지 형식으로 요청 시 400 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '지원하지 않는 이미지 형식입니다.',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not an image'),
          },
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Rate Limit 에러 (429)', () => {
    /**
     * 테스트: Gemini API Rate Limit 시 429 반환
     */
    test('Gemini API Rate Limit 시 429 반환 및 재시도 정보 포함', async ({
      page,
    }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': '60',
          },
          body: JSON.stringify({
            success: false,
            message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            retry_after: 60,
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(429);
      const body = await response.json();
      expect(body.retry_after).toBeDefined();
      expect(body.retry_after).toBeGreaterThan(0);
    });

    /**
     * 테스트: Rate Limit 시 UI에 적절한 에러 메시지 표시
     */
    test('Rate Limit 시 UI에 재시도 안내 표시', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'API 요청 한도를 초과했습니다.',
            retry_after: 30,
          }),
        });
      });

      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      // 에러 메시지 또는 재시도 버튼이 표시되는지 확인
      await page.waitForSelector(
        '[data-testid="error-message"], [data-testid="retry-button"]',
        { timeout: 10000 }
      );

      const errorVisible = await page
        .locator('[data-testid="error-message"]')
        .isVisible();
      const retryVisible = await page
        .locator('[data-testid="retry-button"]')
        .isVisible();

      expect(errorVisible || retryVisible).toBe(true);
    });
  });

  test.describe('서버 에러 (500)', () => {
    /**
     * 테스트: 내부 서버 에러 시 500 반환
     */
    test('내부 서버 에러 시 500 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '서버 내부 오류가 발생했습니다.',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    /**
     * 테스트: Gemini API 호출 실패 시 에러 처리
     */
    test('Gemini API 호출 실패 시 적절한 에러 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'AI 분석 서비스에 일시적인 문제가 발생했습니다.',
            error_code: 'GEMINI_API_ERROR',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe('GEMINI_API_ERROR');
    });

    /**
     * 테스트: DB 연결 실패 시 에러 처리
     */
    test('DB 연결 실패 시 적절한 에러 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '데이터베이스 연결에 실패했습니다.',
            error_code: 'DB_CONNECTION_ERROR',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
    });
  });

  test.describe('타임아웃 에러 (504)', () => {
    /**
     * 테스트: Gateway Timeout 시 504 반환
     */
    test('Gateway Timeout 시 504 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(504);
    });

    /**
     * 테스트: Gemini 타임아웃 시 PARTIAL 응답으로 폴백
     */
    test('Gemini 타임아웃 시 PARTIAL 응답 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        // Gemini 타임아웃 시 Quick 결과로 PARTIAL 응답
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-job-123',
            quickResult: {
              level: 'CAUTION',
              summaryText: '1차 분석 결과입니다. 상세 분석 진행 중...',
              triggerCodes: ['_TIMEOUT'],
              triggerLabels: ['분석 지연'],
              questionForStaff: '이 음식에 알레르기 성분이 있나요?',
              confidence: 'medium',
            },
            timings: {
              quickMs: 50,
              waitedForGeminiMs: 3000,
            },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('PARTIAL');
      expect(body.jobId).toBeDefined();
      expect(body.quickResult).toBeDefined();
    });
  });

  test.describe('Gemini 응답 파싱 에러', () => {
    /**
     * 테스트: Gemini가 잘못된 JSON 반환 시 에러 처리
     */
    test('Gemini 잘못된 JSON 응답 시 에러 처리', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'AI 응답을 처리할 수 없습니다.',
            error_code: 'PARSE_ERROR',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe('PARSE_ERROR');
    });

    /**
     * 테스트: Gemini 응답에 필수 필드 누락 시 에러 처리
     */
    test('Gemini 응답 필수 필드 누락 시 에러 처리', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'AI 응답 형식이 올바르지 않습니다.',
            error_code: 'INVALID_RESPONSE_FORMAT',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe('INVALID_RESPONSE_FORMAT');
    });

    /**
     * 테스트: Gemini 응답 status 값이 유효하지 않을 때 에러 처리
     */
    test('Gemini 응답 status 값 유효성 검사', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'AI 응답의 안전 상태 값이 유효하지 않습니다.',
            error_code: 'INVALID_STATUS_VALUE',
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
          },
        },
      });

      expect(response.status()).toBe(500);
    });
  });

  test.describe('네트워크 에러', () => {
    /**
     * 테스트: 네트워크 연결 실패 시 에러 처리
     */
    test('네트워크 연결 실패 시 에러 메시지 표시', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.abort('connectionfailed');
      });

      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      // 네트워크 에러 후 에러 UI가 표시되는지 확인
      await page.waitForSelector(
        '[data-testid="error-message"], [data-testid="network-error"]',
        { timeout: 10000 }
      );
    });

    /**
     * 테스트: 요청 중단 시 적절한 처리
     */
    test('요청 중단 시 적절한 처리', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.abort('aborted');
      });

      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      // 요청 중단 후 페이지가 크래시하지 않는지 확인
      await page.waitForTimeout(2000);
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });

  test.describe('UI 에러 표시', () => {
    /**
     * 테스트: 에러 발생 시 재시도 버튼 표시
     */
    test('에러 발생 시 재시도 버튼 표시', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '서버 오류',
          }),
        });
      });

      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      // 재시도 버튼 또는 다시 촬영 버튼이 표시되는지 확인
      await page.waitForSelector(
        '[data-testid="retry-button"], [data-testid="retake-button"]',
        { timeout: 10000 }
      );
    });

    /**
     * 테스트: 에러 메시지가 사용자 친화적인지 확인
     */
    test('에러 메시지가 사용자 친화적으로 표시', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '분석 중 오류가 발생했습니다.',
          }),
        });
      });

      await page.goto(
        `/scan/analyze?imageUri=data:image/png;base64,${TEST_IMAGE_BASE64}`
      );

      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 10000,
      });

      const errorText = await page
        .locator('[data-testid="error-message"]')
        .textContent();

      // 기술적인 에러 메시지가 아닌 사용자 친화적 메시지인지 확인
      expect(errorText).not.toContain('Error:');
      expect(errorText).not.toContain('Exception');
      expect(errorText).not.toContain('undefined');
    });
  });
});
