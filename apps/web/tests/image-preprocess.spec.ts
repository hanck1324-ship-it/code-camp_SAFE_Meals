import { test, expect } from '@playwright/test';

/**
 * 이미지 전처리 훅(useImagePreprocess) 기능 테스트 (Playwright 기반)
 *
 * 테스트 시나리오:
 * 1) 훅 초기 상태 확인
 * 2) 이미지 처리(processImage) 기능 테스트
 * 3) 이미지 회전(rotate) 기능 테스트 - EXIF 기반 자동 회전 및 수동 90도 회전
 * 4) 이미지 크롭(crop) 기능 테스트 - 자동 경계 감지 및 수동 영역 선택
 * 5) 대비 보정(adjustContrast) 기능 테스트 - 명암 조정, 선명도 향상, OCR 최적화
 * 6) 결과 반환 테스트 - Blob, Base64, 원본 보존
 *
 * 테스트 조건:
 * - jest, @testing-library/react 제외
 * - timeout: 500ms 미만 (페이지 대기 제외)
 * - 페이지 로드 식별: data-testid 대기 (networkidle 금지)
 */

test.describe('이미지 전처리 훅(useImagePreprocess) 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('/test/image-preprocess');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector('[data-testid="image-preprocess-test-page"]');
  });

  /**
   * 테스트 1) 훅 초기 상태 확인
   */
  test('훅의 초기 상태가 올바르게 설정된다', async ({ page }) => {
    // 초기 상태 확인
    const initialState = await page.locator('[data-testid="hook-state"]').textContent();
    const state = JSON.parse(initialState || '{}');

    // 초기 상태 검증
    expect(state.preprocessedImage).toBeNull();
    expect(state.base64).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 2) 이미지 선택 후 processImage 기능 테스트
   */
  test('processImage()를 호출하면 이미지가 처리된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // processImage 버튼 클릭
    await page.click('[data-testid="process-image-button"]');

    // 처리 완료 대기
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 결과 확인
    const state = JSON.parse(await page.locator('[data-testid="hook-state"]').textContent() || '{}');

    expect(state.preprocessedImage).not.toBeNull();
    expect(state.base64).not.toBeNull();
    expect(state.base64).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 3) 이미지 회전 기능 테스트 - 수동 90도 회전
   */
  test('rotate()를 호출하면 이미지가 90도 회전한다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // 먼저 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 원본 이미지 크기 확인
    const originalDimensions = JSON.parse(
      await page.locator('[data-testid="image-dimensions"]').textContent() || '{}'
    );

    // 90도 회전 버튼 클릭
    await page.click('[data-testid="rotate-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 회전 후 크기 확인 (width와 height가 바뀌어야 함)
    const rotatedDimensions = JSON.parse(
      await page.locator('[data-testid="image-dimensions"]').textContent() || '{}'
    );

    expect(rotatedDimensions.width).toBe(originalDimensions.height);
    expect(rotatedDimensions.height).toBe(originalDimensions.width);
  });

  /**
   * 테스트 4) 이미지 크롭 기능 테스트 - 수동 영역 선택
   */
  test('crop()을 호출하면 이미지가 지정된 영역으로 잘린다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(200, 200),
    });

    // 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 크롭 영역 설정 (50, 50, 100, 100)
    await page.fill('[data-testid="crop-x"]', '50');
    await page.fill('[data-testid="crop-y"]', '50');
    await page.fill('[data-testid="crop-width"]', '100');
    await page.fill('[data-testid="crop-height"]', '100');

    // 크롭 버튼 클릭
    await page.click('[data-testid="crop-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 크롭 후 크기 확인
    const croppedDimensions = JSON.parse(
      await page.locator('[data-testid="image-dimensions"]').textContent() || '{}'
    );

    expect(croppedDimensions.width).toBe(100);
    expect(croppedDimensions.height).toBe(100);
  });

  /**
   * 테스트 5) 대비 보정 기능 테스트
   */
  test('adjustContrast()를 호출하면 대비가 조정된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 원본 Base64 저장
    const originalState = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );
    const originalBase64 = originalState.base64;

    // 대비 조정 버튼 클릭 (contrast: 1.5)
    await page.fill('[data-testid="contrast-value"]', '1.5');
    await page.click('[data-testid="adjust-contrast-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 조정 후 Base64 확인 (변경되어야 함)
    const adjustedState = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );

    expect(adjustedState.base64).not.toBe(originalBase64);
    expect(adjustedState.preprocessedImage).not.toBeNull();
  });

  /**
   * 테스트 6) 원본 이미지 보존 테스트
   */
  test('전처리 후에도 원본 이미지가 보존된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 회전 적용
    await page.click('[data-testid="rotate-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 원본 이미지 유지 확인
    const originalPreserved = await page.locator('[data-testid="original-preserved"]').textContent();
    expect(originalPreserved).toBe('true');
  });

  /**
   * 테스트 7) 에러 처리 테스트 - 잘못된 파일 형식
   */
  test('잘못된 파일을 처리하면 에러가 발생한다', async ({ page }) => {
    // 잘못된 파일 업로드 (텍스트 파일)
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid file content'),
    });

    // processImage 버튼 클릭
    await page.click('[data-testid="process-image-button"]');

    // 에러 메시지 확인
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 5000 });

    const state = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );

    expect(state.error).not.toBeNull();
    expect(state.isProcessing).toBe(false);
  });

  /**
   * 테스트 8) 자동 경계 감지(autoCrop) 기능 테스트
   */
  test('autoCrop()을 호출하면 자동으로 메뉴판 영역이 감지된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(300, 300),
    });

    // 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 자동 크롭 버튼 클릭
    await page.click('[data-testid="auto-crop-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 자동 크롭 결과 확인 (크기가 변경되어야 함 또는 유지)
    const state = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );

    expect(state.preprocessedImage).not.toBeNull();
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 9) OCR 최적화 기능 테스트
   */
  test('optimizeForOCR()를 호출하면 OCR 인식률 향상을 위해 최적화된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // 이미지 처리
    await page.click('[data-testid="process-image-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // OCR 최적화 버튼 클릭
    await page.click('[data-testid="optimize-ocr-button"]');
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 최적화 적용 확인
    const state = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );

    expect(state.preprocessedImage).not.toBeNull();
    expect(state.base64).not.toBeNull();
    expect(state.error).toBeNull();
  });

  /**
   * 테스트 10) isProcessing 상태 테스트
   */
  test('처리 중에는 isProcessing이 true가 된다', async ({ page }) => {
    // 테스트 이미지 파일 업로드
    const fileInput = page.locator('[data-testid="image-input"]');
    await fileInput.setInputFiles({
      name: 'test-menu.png',
      mimeType: 'image/png',
      buffer: await createTestImageBuffer(),
    });

    // processImage 버튼 클릭
    await page.click('[data-testid="process-image-button"]');

    // 처리 중 상태 확인
    const processingIndicator = page.locator('[data-testid="is-processing"]');
    await expect(processingIndicator).toBeVisible({ timeout: 1000 });

    // 처리 완료 대기
    await page.waitForSelector('[data-testid="processing-complete"]', { timeout: 5000 });

    // 처리 완료 후 isProcessing이 false가 되어야 함
    const state = JSON.parse(
      await page.locator('[data-testid="hook-state"]').textContent() || '{}'
    );
    expect(state.isProcessing).toBe(false);
  });
});

/**
 * 테스트용 이미지 버퍼 생성 (PNG 형식)
 */
async function createTestImageBuffer(width: number = 100, height: number = 100): Promise<Buffer> {
  // 간단한 PNG 이미지 생성 (1x1 픽셀 빨간 이미지를 width x height로 확장)
  // PNG 헤더 + IHDR + IDAT + IEND
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0); // width
  ihdrData.writeUInt32BE(height, 4); // height
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createPNGChunk('IHDR', ihdrData);

  // IDAT chunk (최소한의 이미지 데이터)
  // 간단히 하기 위해 zlib 압축된 데이터 대신 미리 만들어진 작은 이미지 데이터 사용
  // 실제로는 각 행마다 필터 바이트(0)를 포함한 RGB 데이터가 필요
  const scanlineSize = 1 + width * 3; // 필터 바이트 + RGB
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineSize;
    rawData[offset] = 0; // 필터: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = offset + 1 + x * 3;
      rawData[pixelOffset] = 255; // R
      rawData[pixelOffset + 1] = 255; // G
      rawData[pixelOffset + 2] = 255; // B
    }
  }

  // zlib 압축 (deflate)
  const zlib = await import('zlib');
  const compressedData = zlib.deflateSync(rawData);

  const idatChunk = createPNGChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createPNGChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * PNG 청크 생성 헬퍼
 */
function createPNGChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc32 = calculateCRC32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * CRC32 계산
 */
function calculateCRC32(data: Buffer): number {
  let crc = 0xffffffff;
  const table = getCRC32Table();

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * CRC32 테이블 생성
 */
function getCRC32Table(): number[] {
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
