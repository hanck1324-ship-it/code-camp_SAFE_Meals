/**
 * 이미지 최적화 유틸리티
 *
 * 목적:
 * - OCR 처리 시간 단축 (500ms → 300ms)
 * - 네트워크 전송 크기 감소
 * - 메모리 사용량 최적화
 */

export interface ImageOptimizeOptions {
  /** 최대 너비 (기본값: 1920px) */
  maxWidth?: number;
  /** 최대 높이 (기본값: 1920px) */
  maxHeight?: number;
  /** JPEG 품질 (0.0 ~ 1.0, 기본값: 0.85) */
  quality?: number;
  /** 출력 포맷 (기본값: 'image/jpeg') */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ImageOptimizeResult {
  /** 최적화된 이미지 Blob */
  blob: Blob;
  /** 원본 크기 (bytes) */
  originalSize: number;
  /** 최적화 후 크기 (bytes) */
  optimizedSize: number;
  /** 압축률 (0.0 ~ 1.0) */
  compressionRatio: number;
  /** 원본 해상도 */
  originalDimensions: { width: number; height: number };
  /** 최적화 후 해상도 */
  optimizedDimensions: { width: number; height: number };
  /** 처리 시간 (ms) */
  processingTime: number;
}

/**
 * 이미지 리사이징 및 최적화
 *
 * @param file 원본 이미지 파일
 * @param options 최적화 옵션
 * @returns 최적화된 이미지와 메타데이터
 *
 * @example
 * const result = await optimizeImage(imageFile, { maxWidth: 1920, quality: 0.85 });
 * console.log(`압축률: ${(result.compressionRatio * 100).toFixed(1)}%`);
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<ImageOptimizeResult> {
  const startTime = performance.now();

  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // 1. 이미지 로드
  const img = await createImageBitmap(file);
  const originalDimensions = { width: img.width, height: img.height };

  // 2. 리사이징 비율 계산
  const widthScale = maxWidth / img.width;
  const heightScale = maxHeight / img.height;
  const scale = Math.min(1, widthScale, heightScale); // 1보다 크면 원본 크기 유지

  const targetWidth = Math.round(img.width * scale);
  const targetHeight = Math.round(img.height * scale);

  // 3. Canvas로 리사이징
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

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
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Blob 생성 실패'));
        }
      },
      mimeType,
      quality
    );
  });

  const optimizedSize = blob.size;
  const compressionRatio = 1 - optimizedSize / originalSize;
  const processingTime = performance.now() - startTime;

  console.log(`[ImageOptimizer] 최적화 완료:`);
  console.log(`  - 원본 크기: ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`  - 최적화 후: ${(optimizedSize / 1024).toFixed(1)} KB`);
  console.log(`  - 압축률: ${(compressionRatio * 100).toFixed(1)}%`);
  console.log(`  - 원본 해상도: ${originalDimensions.width}x${originalDimensions.height}`);
  console.log(`  - 최적화 해상도: ${targetWidth}x${targetHeight}`);
  console.log(`  - 처리 시간: ${processingTime.toFixed(1)}ms`);

  return {
    blob,
    originalSize,
    optimizedSize,
    compressionRatio,
    originalDimensions,
    optimizedDimensions: { width: targetWidth, height: targetHeight },
    processingTime,
  };
}

/**
 * 이미지 파일을 Base64로 변환
 *
 * @param blob 이미지 Blob
 * @returns Base64 문자열 (data:image/jpeg;base64,... 형식)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 이미지 최적화 + Base64 변환 (통합 함수)
 *
 * @param file 원본 이미지 파일
 * @param options 최적화 옵션
 * @returns Base64 문자열과 메타데이터
 */
export async function optimizeImageToBase64(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<ImageOptimizeResult & { base64: string }> {
  const result = await optimizeImage(file, options);
  const base64 = await blobToBase64(result.blob);

  return {
    ...result,
    base64,
  };
}
