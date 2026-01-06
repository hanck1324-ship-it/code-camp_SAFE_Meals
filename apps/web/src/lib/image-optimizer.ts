/**
 * 이미지 최적화 유틸리티
 *
 * AI 처리 전 이미지 크기를 줄여 속도와 비용 개선
 */

/**
 * Base64 이미지 크기 조정
 */
export async function resizeBase64Image(
  base64: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // 비율 유지하며 크기 계산
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Canvas로 리사이즈
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 압축 (더 작은 파일 크기)
      const resized = canvas.toDataURL('image/jpeg', quality);
      resolve(resized);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = base64;
  });
}

/**
 * 이미지 크기 확인 (KB 단위)
 */
export function getBase64SizeKB(base64: string): number {
  const base64Data = base64.includes('base64,')
    ? base64.split('base64,')[1]
    : base64;

  // Base64는 원본의 약 133% 크기
  const sizeInBytes = (base64Data.length * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}

/**
 * 자동 최적화 (500KB 이상이면 압축)
 */
export async function optimizeImageForAI(base64: string): Promise<{
  optimized: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}> {
  const originalSize = getBase64SizeKB(base64);

  // 500KB 이하면 그대로 사용
  if (originalSize <= 500) {
    return {
      optimized: base64,
      originalSize,
      optimizedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // 압축 수행
  const optimized = await resizeBase64Image(base64, 1024, 1024, 0.85);
  const optimizedSize = getBase64SizeKB(optimized);

  return {
    optimized,
    originalSize,
    optimizedSize,
    compressionRatio: originalSize / optimizedSize,
  };
}
