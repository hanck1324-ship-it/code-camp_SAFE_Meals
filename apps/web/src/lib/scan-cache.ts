/**
 * 스캔 결과 캐싱 시스템
 *
 * 동일한 이미지를 재분석하지 않도록 캐싱
 */

/**
 * 간단한 해시 함수 (브라우저 호환)
 * djb2 알고리즘 사용
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 이미지 해시 생성 (빠른 비교용)
 */
export function getImageHash(base64: string): string {
  const base64Data = base64.includes('base64,')
    ? base64.split('base64,')[1]
    : base64;

  // 긴 문자열은 샘플링하여 해시 생성 (성능 최적화)
  const sampleSize = Math.min(base64Data.length, 10000);
  const step = Math.floor(base64Data.length / sampleSize);
  let sample = '';

  for (let i = 0; i < base64Data.length; i += step) {
    sample += base64Data[i];
    if (sample.length >= sampleSize) break;
  }

  return simpleHash(sample + base64Data.length);
}

/**
 * 캐시 키 생성 (이미지 + 사용자 알레르기)
 */
export function getCacheKey(
  imageHash: string,
  allergies: string[],
  diets: string[]
): string {
  const userContext = [...allergies, ...diets].sort().join(',');
  const contextHash = simpleHash(userContext);
  return `${imageHash}_${contextHash}`;
}

/**
 * 메모리 캐시 (간단한 LRU)
 */
class ScanCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize = 100;
  private ttl = 1000 * 60 * 30; // 30분

  set(key: string, data: any) {
    // 크기 제한
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // TTL 체크
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}

export const scanCache = new ScanCache();
