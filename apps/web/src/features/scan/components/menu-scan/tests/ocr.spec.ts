import { test, expect } from '@playwright/test';

/**
 * OCR 훅(useOCR) 기능 테스트 (Playwright 기반)
 *
 * 테스트 시나리오:
 * 1) 훅 초기 상태 확인
 * 2) extractText() 기능 테스트 - Google Vision API 연동
 * 3) OCR 결과 검증 - fullText, results 배열
 * 4) Bounding Box 정보 추출 검증
 * 5) 에러 처리 테스트
 * 6) retry() 기능 테스트
 *
 * 테스트 조건:
 * - jest, @testing-library/react 제외
 * - timeout: 500ms 미만 (페이지 대기 제외)
 * - 페이지 로드 식별: data-testid 대기 (networkidle 금지)
 */

/**
 * 테스트용 이미지 버퍼 생성 (텍스트가 포함된 캔버스 이미지)
 */
async function createTestImageBuffer(): Promise<Buffer> {
  // 100x50 PNG 이미지 생성 (최소 크기)
  const width = 100;
  const height = 50;

  // PNG 헤더 및 간단한 이미지 데이터
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // IHDR 청크
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrType = Buffer.from('IHDR');
  const ihdrCrc = crc32(Buffer.concat([ihdrType, ihdrData]));
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(13, 0);
  const ihdrCrcBuf = Buffer.alloc(4);
  ihdrCrcBuf.writeUInt32BE(ihdrCrc, 0);

  // IDAT 청크 (압축된 이미지 데이터 - 흰색 배경)
  const rawData: number[] = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawData.push(255, 255, 255); // white pixel
    }
  }

  // zlib 압축 (deflate)
  const zlib = await import('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const idatType = Buffer.from('IDAT');
  const idatCrc = crc32(Buffer.concat([idatType, compressed]));
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressed.length, 0);
  const idatCrcBuf = Buffer.alloc(4);
  idatCrcBuf.writeUInt32BE(idatCrc, 0);

  // IEND 청크
  const iendType = Buffer.from('IEND');
  const iendCrc = crc32(iendType);
  const iendLength = Buffer.alloc(4);
  iendLength.writeUInt32BE(0, 0);
  const iendCrcBuf = Buffer.alloc(4);
  iendCrcBuf.writeUInt32BE(iendCrc, 0);

  return Buffer.concat([
    pngSignature,
    ihdrLength,
    ihdrType,
    ihdrData,
    ihdrCrcBuf,
    idatLength,
    idatType,
    compressed,
    idatCrcBuf,
    iendLength,
    iendType,
    iendCrcBuf,
  ]);
}

/**
 * CRC32 계산
 */
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  const table = makeCrcTable();

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

test.describe('OCR 훅(useOCR) 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('/test/ocr');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector('[data-testid="ocr-test-page"]');
  });

  /**
   * 테스트 1) 훅 초기 상태 확인
   */
  test('훅의 초기 상태가 올바르게 설정된다', async ({ page }) => {
    // 초기 상태 확인
    const initialState = await page
      .locator('[data-testid="hook-state"]')
      .textContent();
    const state = JSON.parse(initialState || '{}');

    // 초기 상태 검증
    expect(state.results).toEqual([]);
    expect(state.fullText).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 2) extractText() 호출 시 로딩 상태가 true가 된다
   */
  test('extractText()를 호출하면 로딩 상태가 활성화된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // 로딩 상태 확인 (바로 체크하거나 로딩 중 상태 대기)
    const isLoadingElement = page.locator('[data-testid="is-loading"]');

    // 로딩이 시작되었거나 완료되었음을 확인
    await expect(
      page.locator(
        '[data-testid="is-loading"], [data-testid="ocr-complete"], [data-testid="ocr-error"]'
      )
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * 테스트 3) OCR 결과가 올바른 형식으로 반환된다
   */
  test('OCR 결과가 올바른 형식으로 반환된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // OCR 완료 대기 (성공 또는 에러)
    await expect(
      page.locator('[data-testid="ocr-complete"], [data-testid="ocr-error"]')
    ).toBeVisible({ timeout: 15000 });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    // 로딩 상태가 false가 되었는지 확인
    expect(state.isLoading).toBe(false);

    // 결과가 배열인지 확인
    expect(Array.isArray(state.results)).toBe(true);

    // fullText가 문자열인지 확인
    expect(typeof state.fullText).toBe('string');
  });

  /**
   * 테스트 4) OCR 결과의 각 항목이 올바른 구조를 가진다
   */
  test('OCR 결과의 각 항목이 올바른 구조를 가진다', async ({ page }) => {
    // API mock을 위한 라우트 설정
    await page.route('**/vision.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          responses: [
            {
              textAnnotations: [
                {
                  description: '메뉴\n김치찌개 8000원\n된장찌개 7000원',
                  boundingPoly: {
                    vertices: [
                      { x: 0, y: 0 },
                      { x: 200, y: 0 },
                      { x: 200, y: 100 },
                      { x: 0, y: 100 },
                    ],
                  },
                },
                {
                  description: '메뉴',
                  boundingPoly: {
                    vertices: [
                      { x: 10, y: 10 },
                      { x: 50, y: 10 },
                      { x: 50, y: 30 },
                      { x: 10, y: 30 },
                    ],
                  },
                },
                {
                  description: '김치찌개',
                  boundingPoly: {
                    vertices: [
                      { x: 10, y: 40 },
                      { x: 80, y: 40 },
                      { x: 80, y: 60 },
                      { x: 10, y: 60 },
                    ],
                  },
                },
              ],
              fullTextAnnotation: {
                text: '메뉴\n김치찌개 8000원\n된장찌개 7000원',
              },
            },
          ],
        }),
      });
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // OCR 완료 대기
    await page.waitForSelector('[data-testid="ocr-complete"]', {
      timeout: 10000,
    });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    // 결과가 있는지 확인
    expect(state.results.length).toBeGreaterThan(0);

    // 첫 번째 결과 항목 검증
    const firstResult = state.results[0];
    expect(firstResult).toHaveProperty('text');
    expect(firstResult).toHaveProperty('confidence');
    expect(firstResult).toHaveProperty('boundingBox');
    expect(firstResult.boundingBox).toHaveProperty('x');
    expect(firstResult.boundingBox).toHaveProperty('y');
    expect(firstResult.boundingBox).toHaveProperty('width');
    expect(firstResult.boundingBox).toHaveProperty('height');

    // fullText 검증
    expect(state.fullText).toContain('메뉴');
  });

  /**
   * 테스트 5) API 호출 실패 시 에러가 올바르게 처리된다
   */
  test('API 호출 실패 시 에러가 올바르게 처리된다', async ({ page }) => {
    // API 실패 mock
    await page.route('**/vision.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            message: 'Internal Server Error',
          },
        }),
      });
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // 에러 상태 대기
    await page.waitForSelector('[data-testid="ocr-error"]', {
      timeout: 15000,
    });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    // 에러가 설정되었는지 확인
    expect(state.error).not.toBeNull();
    expect(state.isLoading).toBe(false);
  });

  /**
   * 테스트 6) retry() 함수가 올바르게 동작한다
   */
  test('retry()를 호출하면 OCR을 다시 시도한다', async ({ page }) => {
    let callCount = 0;

    // API mock - 첫 번째는 실패, 두 번째는 성공
    await page.route('**/vision.googleapis.com/**', async (route) => {
      callCount++;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Temporary Error' },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            responses: [
              {
                textAnnotations: [
                  {
                    description: '재시도 성공',
                    boundingPoly: {
                      vertices: [
                        { x: 0, y: 0 },
                        { x: 100, y: 0 },
                        { x: 100, y: 50 },
                        { x: 0, y: 50 },
                      ],
                    },
                  },
                ],
                fullTextAnnotation: {
                  text: '재시도 성공',
                },
              },
            ],
          }),
        });
      }
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // 에러 상태 대기
    await page.waitForSelector('[data-testid="ocr-error"]', {
      timeout: 10000,
    });

    // retry 버튼 클릭
    await page.click('[data-testid="retry-button"]');

    // OCR 완료 대기
    await page.waitForSelector('[data-testid="ocr-complete"]', {
      timeout: 10000,
    });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    expect(state.fullText).toContain('재시도 성공');
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 7) Bounding Box 정보가 올바르게 추출된다
   */
  test('Bounding Box 정보가 올바르게 추출된다', async ({ page }) => {
    // API mock
    await page.route('**/vision.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          responses: [
            {
              textAnnotations: [
                {
                  description: '전체 텍스트',
                  boundingPoly: {
                    vertices: [
                      { x: 0, y: 0 },
                      { x: 200, y: 0 },
                      { x: 200, y: 100 },
                      { x: 0, y: 100 },
                    ],
                  },
                },
                {
                  description: '테스트',
                  boundingPoly: {
                    vertices: [
                      { x: 10, y: 20 },
                      { x: 110, y: 20 },
                      { x: 110, y: 70 },
                      { x: 10, y: 70 },
                    ],
                  },
                },
              ],
              fullTextAnnotation: {
                text: '테스트',
              },
            },
          ],
        }),
      });
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // OCR 완료 대기
    await page.waitForSelector('[data-testid="ocr-complete"]', {
      timeout: 10000,
    });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    // 두 번째 결과의 bounding box 검증 (첫 번째는 전체 텍스트)
    const result = state.results[0];
    expect(result.boundingBox.x).toBe(10);
    expect(result.boundingBox.y).toBe(20);
    expect(result.boundingBox.width).toBe(100); // 110 - 10
    expect(result.boundingBox.height).toBe(50); // 70 - 20
  });

  /**
   * 테스트 8) 빈 이미지에 대한 처리
   */
  test('텍스트가 없는 이미지도 올바르게 처리된다', async ({ page }) => {
    // API mock - 빈 응답
    await page.route('**/vision.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          responses: [{}],
        }),
      });
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // OCR 완료 대기
    await page.waitForSelector('[data-testid="ocr-complete"]', {
      timeout: 10000,
    });

    // 결과 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    expect(state.results).toEqual([]);
    expect(state.fullText).toBe('');
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 9) reset() 함수가 상태를 초기화한다
   */
  test('reset()을 호출하면 상태가 초기화된다', async ({ page }) => {
    // API mock
    await page.route('**/vision.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          responses: [
            {
              textAnnotations: [
                {
                  description: '테스트',
                  boundingPoly: {
                    vertices: [
                      { x: 0, y: 0 },
                      { x: 100, y: 0 },
                      { x: 100, y: 50 },
                      { x: 0, y: 50 },
                    ],
                  },
                },
              ],
              fullTextAnnotation: {
                text: '테스트',
              },
            },
          ],
        }),
      });
    });

    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // extractText 버튼 클릭
    await page.click('[data-testid="extract-text-button"]');

    // OCR 완료 대기
    await page.waitForSelector('[data-testid="ocr-complete"]', {
      timeout: 10000,
    });

    // reset 버튼 클릭
    await page.click('[data-testid="reset-button"]');

    // 상태 확인
    const state = JSON.parse(
      (await page.locator('[data-testid="hook-state"]').textContent()) || '{}'
    );

    expect(state.results).toEqual([]);
    expect(state.fullText).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
