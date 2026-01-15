/**
 * OCR 결과 캐싱 시스템
 *
 * 목적:
 * - 동일한 이미지의 반복 스캔 시 OCR 비용 절감
 * - 응답 시간 단축 (500ms → 0ms)
 * - 사용자 경험 개선
 *
 * 전략:
 * - 이미지 해시를 키로 사용 (SHA-256)
 * - IndexedDB에 저장 (LocalStorage보다 용량 큼)
 * - TTL 기반 자동 만료 (기본 24시간)
 */

interface OCRCacheEntry {
  /** 이미지 해시 (SHA-256) */
  hash: string;
  /** OCR 결과 텍스트 */
  text: string;
  /** 생성 시간 (Unix timestamp) */
  createdAt: number;
  /** 만료 시간 (Unix timestamp) */
  expiresAt: number;
  /** 이미지 크기 (bytes) */
  imageSize: number;
  /** OCR 처리 시간 (ms) */
  processingTime?: number;
}

const DB_NAME = 'safemeals-ocr-cache';
const STORE_NAME = 'ocr-results';
const DB_VERSION = 1;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * IndexedDB 초기화
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object Store 생성
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * 이미지 Blob을 SHA-256 해시로 변환
 */
async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * OCR 결과를 캐시에 저장
 */
export async function cacheOCRResult(
  blob: Blob,
  text: string,
  processingTime?: number,
  ttl: number = DEFAULT_TTL_MS
): Promise<void> {
  try {
    const hash = await hashBlob(blob);
    const now = Date.now();

    const entry: OCRCacheEntry = {
      hash,
      text,
      createdAt: now,
      expiresAt: now + ttl,
      imageSize: blob.size,
      processingTime,
    };

    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`[OCRCache] ✅ 캐시 저장 완료 - Hash: ${hash.slice(0, 8)}...`);
  } catch (error) {
    console.warn('[OCRCache] 캐시 저장 실패 (무시):', error);
  }
}

/**
 * 캐시에서 OCR 결과 조회
 */
export async function getCachedOCRResult(blob: Blob): Promise<string | null> {
  try {
    const hash = await hashBlob(blob);
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const entry = await new Promise<OCRCacheEntry | undefined>(
      (resolve, reject) => {
        const request = store.get(hash);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    if (!entry) {
      console.log(`[OCRCache] ❌ 캐시 미스 - Hash: ${hash.slice(0, 8)}...`);
      return null;
    }

    // 만료 확인
    const now = Date.now();
    if (now > entry.expiresAt) {
      console.log(`[OCRCache] ⏰ 캐시 만료 - Hash: ${hash.slice(0, 8)}...`);
      // 만료된 캐시 삭제
      await deleteCacheEntry(hash);
      return null;
    }

    console.log(`[OCRCache] ✅ 캐시 히트! - Hash: ${hash.slice(0, 8)}...`);
    console.log(`  - 생성: ${new Date(entry.createdAt).toLocaleString()}`);
    console.log(`  - 만료: ${new Date(entry.expiresAt).toLocaleString()}`);
    console.log(`  - 이미지 크기: ${(entry.imageSize / 1024).toFixed(1)} KB`);
    if (entry.processingTime) {
      console.log(`  - 원본 처리 시간: ${entry.processingTime.toFixed(1)}ms`);
    }

    return entry.text;
  } catch (error) {
    console.warn('[OCRCache] 캐시 조회 실패 (무시):', error);
    return null;
  }
}

/**
 * 캐시 엔트리 삭제
 */
async function deleteCacheEntry(hash: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(hash);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('[OCRCache] 캐시 삭제 실패 (무시):', error);
  }
}

/**
 * 만료된 캐시 정리
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('expiresAt');

    const now = Date.now();
    let deletedCount = 0;

    const request = index.openCursor();

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const entry = cursor.value as OCRCacheEntry;

          if (entry.expiresAt < now) {
            cursor.delete();
            deletedCount++;
          }

          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    if (deletedCount > 0) {
      console.log(`[OCRCache] 🧹 만료된 캐시 ${deletedCount}개 정리 완료`);
    }

    return deletedCount;
  } catch (error) {
    console.warn('[OCRCache] 캐시 정리 실패 (무시):', error);
    return 0;
  }
}

/**
 * 전체 캐시 삭제
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[OCRCache] 🗑️ 전체 캐시 삭제 완료');
  } catch (error) {
    console.warn('[OCRCache] 전체 캐시 삭제 실패 (무시):', error);
  }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const entries = await new Promise<OCRCacheEntry[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const totalSize = entries.reduce((sum, entry) => sum + entry.imageSize, 0);
    const timestamps = entries.map((e) => e.createdAt).sort((a, b) => a - b);

    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry: timestamps.length > 0 ? new Date(timestamps[0]) : null,
      newestEntry:
        timestamps.length > 0
          ? new Date(timestamps[timestamps.length - 1])
          : null,
    };
  } catch (error) {
    console.warn('[OCRCache] 캐시 통계 조회 실패:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}

/**
 * 페이지 로드 시 만료된 캐시 자동 정리
 */
if (typeof window !== 'undefined') {
  // 페이지 로드 시 한 번만 실행
  cleanupExpiredCache().catch(() => {
    // 에러 무시 (캐시는 optional)
  });
}
