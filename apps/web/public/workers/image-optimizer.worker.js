/**
 * Image Optimizer Web Worker
 *
 * 백그라운드 스레드에서 이미지 최적화를 수행하여 메인 스레드 블로킹 방지
 *
 * 메시지 형식:
 * - 입력: { type: 'optimize', file: File, options: {...} }
 * - 출력: { type: 'success', result: {...} } | { type: 'error', error: string }
 */

self.addEventListener('message', async (event) => {
  const { type, file, options } = event.data;

  if (type !== 'optimize') {
    self.postMessage({ type: 'error', error: 'Unknown message type' });
    return;
  }

  try {
    const startTime = performance.now();

    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85,
      mimeType = 'image/jpeg',
    } = options || {};

    const originalSize = file.size;

    // 1. 이미지 로드
    const img = await createImageBitmap(file);
    const originalDimensions = { width: img.width, height: img.height };

    // 2. 리사이징 비율 계산
    const widthScale = maxWidth / img.width;
    const heightScale = maxHeight / img.height;
    const scale = Math.min(1, widthScale, heightScale);

    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    // 3. OffscreenCanvas로 리사이징 (WebWorker 환경)
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D context를 생성할 수 없습니다.');
    }

    // 고품질 리사이징 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 이미지 그리기
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // 4. Blob 생성
    const blob = await canvas.convertToBlob({
      type: mimeType,
      quality: quality,
    });

    const optimizedSize = blob.size;
    const compressionRatio = 1 - optimizedSize / originalSize;
    const processingTime = performance.now() - startTime;

    // 5. 결과 반환
    self.postMessage({
      type: 'success',
      result: {
        blob,
        originalSize,
        optimizedSize,
        compressionRatio,
        originalDimensions,
        optimizedDimensions: { width: targetWidth, height: targetHeight },
        processingTime,
      },
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message || 'Image optimization failed',
    });
  }
});
