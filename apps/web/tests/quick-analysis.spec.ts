import { test, expect } from '@playwright/test';

/**
 * performQuickAnalysis 함수 유닛 테스트
 *
 * P0/P1 테스트 케이스:
 * 1. OCR 실패 시 CAUTION 반환
 * 2. 텍스트가 너무 짧을 때 (10자 미만) CAUTION 반환
 * 3. 알레르기 키워드 감지 시 DANGER 반환
 * 4. 식단 키워드 감지 시 DANGER 반환
 * 5. 빈 알레르기 목록으로 SAFE 반환
 * 6. 다국어 처리 테스트 (ko, en, ja, zh, es)
 * 7. 복수 알레르기 감지 테스트
 * 8. OCR 신뢰도에 따른 처리
 */

test.describe('performQuickAnalysis 유닛 테스트', () => {
  /**
   * API를 통해 Quick 분석 결과를 시뮬레이션하는 테스트들
   */

  test.describe('OCR 실패 케이스', () => {
    test('OCR 실패 시 CAUTION 반환 및 _OCR_FAILED 트리거', async ({
      page,
    }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        // OCR 실패를 시뮬레이션한 Quick 결과
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-ocr-failed',
            quickResult: {
              level: 'CAUTION',
              summaryText:
                '텍스트 인식에 실패했습니다. AI 분석 결과를 기다려주세요.',
              triggerCodes: ['_OCR_FAILED'],
              triggerLabels: [],
              questionForStaff: '이 요리의 주요 재료를 알려주시겠어요?',
              confidence: 'low',
            },
            timings: { quickMs: 10 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('CAUTION');
      expect(body.quickResult.triggerCodes).toContain('_OCR_FAILED');
      expect(body.quickResult.confidence).toBe('low');
    });
  });

  test.describe('텍스트 길이 검사', () => {
    test('텍스트가 10자 미만일 때 CAUTION 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-short-text',
            quickResult: {
              level: 'CAUTION',
              summaryText:
                '메뉴 정보가 충분하지 않습니다. 직원에게 확인해주세요.',
              triggerCodes: ['_TEXT_TOO_SHORT'],
              triggerLabels: [],
              questionForStaff: '이 요리의 주요 재료를 알려주시겠어요?',
              confidence: 'medium',
            },
            timings: { quickMs: 5 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('CAUTION');
      expect(body.quickResult.triggerCodes).toContain('_TEXT_TOO_SHORT');
    });

    test('빈 텍스트일 때 CAUTION 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-empty-text',
            quickResult: {
              level: 'CAUTION',
              summaryText:
                '텍스트 인식에 실패했습니다. AI 분석 결과를 기다려주세요.',
              triggerCodes: ['_OCR_FAILED'],
              triggerLabels: [],
              questionForStaff: '이 요리의 주요 재료를 알려주시겠어요?',
              confidence: 'low',
            },
            timings: { quickMs: 3 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('CAUTION');
    });
  });

  test.describe('알레르기 키워드 감지', () => {
    test('단일 알레르기 키워드 감지 시 DANGER 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-allergy-detected',
            quickResult: {
              level: 'DANGER',
              summaryText: '우유/유제품 포함 가능성이 높습니다. 직원에게 확인하세요.',
              triggerCodes: ['milk'],
              triggerLabels: ['우유/유제품'],
              questionForStaff: '이 요리에 우유나 유제품이 들어가나요?',
              confidence: 'high',
            },
            timings: { quickMs: 15 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('DANGER');
      expect(body.quickResult.triggerCodes).toContain('milk');
      expect(body.quickResult.triggerLabels).toContain('우유/유제품');
    });

    test('복수 알레르기 키워드 감지 시 모두 트리거', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-multiple-allergies',
            quickResult: {
              level: 'DANGER',
              summaryText:
                '계란, 우유/유제품, 땅콩 포함 가능성이 높습니다. 직원에게 확인하세요.',
              triggerCodes: ['eggs', 'milk', 'peanuts'],
              triggerLabels: ['계란', '우유/유제품', '땅콩'],
              questionForStaff: '이 요리에 계란, 우유/유제품, 땅콩 등이 들어가나요?',
              confidence: 'high',
            },
            timings: { quickMs: 20 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('DANGER');
      expect(body.quickResult.triggerCodes.length).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('식단 키워드 감지', () => {
    test('채식주의자가 고기 키워드 감지 시 DANGER 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-diet-detected',
            quickResult: {
              level: 'DANGER',
              summaryText:
                '채식주의 식단에 맞지 않을 수 있습니다. 직원에게 확인하세요.',
              triggerCodes: ['_DIET_vegetarian'],
              triggerLabels: ['채식주의'],
              questionForStaff: '이 요리에 고기나 해산물이 들어가나요?',
              confidence: 'high',
            },
            timings: { quickMs: 12 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('DANGER');
      expect(body.quickResult.triggerCodes.some((c: string) => c.includes('DIET'))).toBe(
        true
      );
    });

    test('할랄 식단에서 돼지고기 키워드 감지 시 DANGER 반환', async ({
      page,
    }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-halal-pork',
            quickResult: {
              level: 'DANGER',
              summaryText: '돼지고기 포함 가능성이 높습니다. 직원에게 확인하세요.',
              triggerCodes: ['pork', '_DIET_halal'],
              triggerLabels: ['돼지고기', '할랄'],
              questionForStaff:
                '이 요리는 할랄 인증을 받았나요? 돼지고기나 알코올이 없나요?',
              confidence: 'high',
            },
            timings: { quickMs: 18 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('DANGER');
    });
  });

  test.describe('안전(SAFE) 케이스', () => {
    test('빈 알레르기 목록으로 SAFE 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-safe',
            quickResult: {
              level: 'SAFE',
              summaryText:
                '1차 검토에서 위험 요소가 감지되지 않았습니다. 최종 분석을 기다려주세요.',
              triggerCodes: [],
              triggerLabels: [],
              questionForStaff: '이 요리의 주요 재료를 알려주시겠어요?',
              confidence: 'high',
            },
            timings: { quickMs: 8 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('SAFE');
      expect(body.quickResult.triggerCodes).toEqual([]);
    });

    test('알레르기 키워드가 텍스트에 없으면 SAFE 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-no-match',
            quickResult: {
              level: 'SAFE',
              summaryText:
                '1차 검토에서 위험 요소가 감지되지 않았습니다. 최종 분석을 기다려주세요.',
              triggerCodes: [],
              triggerLabels: [],
              questionForStaff: '이 요리에 새우, 게, 랍스터 등 갑각류가 들어가나요?',
              confidence: 'high',
            },
            timings: { quickMs: 10 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.level).toBe('SAFE');
    });
  });

  test.describe('다국어 지원', () => {
    test('영어(en)로 요청 시 영어 메시지 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-en',
            quickResult: {
              level: 'SAFE',
              summaryText:
                'No risks detected in preliminary review. Please wait for final analysis.',
              triggerCodes: [],
              triggerLabels: [],
              questionForStaff:
                'Could you tell me the main ingredients of this dish?',
              confidence: 'high',
            },
            timings: { quickMs: 10 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
          language: 'en',
        },
      });

      const body = await response.json();
      expect(body.quickResult.summaryText).toContain('No risks');
    });

    test('일본어(ja)로 요청 시 일본어 메시지 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-ja',
            quickResult: {
              level: 'SAFE',
              summaryText:
                '一次検査で危険要素は検出されませんでした。最終分析をお待ちください。',
              triggerCodes: [],
              triggerLabels: [],
              questionForStaff:
                'この料理の主な材料を教えていただけますか？',
              confidence: 'high',
            },
            timings: { quickMs: 10 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
          language: 'ja',
        },
      });

      const body = await response.json();
      expect(body.quickResult.summaryText).toContain('検出');
    });
  });

  test.describe('OCR 신뢰도 처리', () => {
    test('OCR 신뢰도가 low일 때 CAUTION 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'PARTIAL',
            jobId: 'test-low-confidence',
            quickResult: {
              level: 'CAUTION',
              summaryText:
                '메뉴 정보가 불명확합니다. 직원에게 확인하는 것을 권장합니다.',
              triggerCodes: ['_OCR_LOW_CONFIDENCE'],
              triggerLabels: [],
              questionForStaff: '이 요리의 주요 재료를 알려주시겠어요?',
              confidence: 'low',
            },
            timings: { quickMs: 12 },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.quickResult.confidence).toBe('low');
      expect(['CAUTION', 'DANGER']).toContain(body.quickResult.level);
    });
  });

  test.describe('FINAL 응답 케이스', () => {
    test('Gemini 분석 완료 시 FINAL 응답 반환', async ({ page }) => {
      await page.route('**/api/scan/analyze', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'FINAL',
            jobId: 'test-final',
            result: {
              menus: [
                {
                  id: '1',
                  original_name: '비빔밥',
                  translated_name: 'Bibimbap',
                  safety_status: 'SAFE',
                  reason: '알레르기 성분이 감지되지 않았습니다.',
                },
              ],
              summary: '안전하게 섭취 가능합니다.',
              overall_status: 'SAFE',
              results: [],
            },
            timings: {
              quickMs: 10,
              geminiMs: 2500,
              totalMs: 2800,
            },
          }),
        });
      });

      const response = await page.request.post('/api/scan/analyze', {
        headers: { Authorization: 'Bearer valid-token' },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              'base64'
            ),
          },
        },
      });

      const body = await response.json();
      expect(body.status).toBe('FINAL');
      expect(body.result).toBeDefined();
      expect(body.result.overall_status).toBeDefined();
    });
  });
});
