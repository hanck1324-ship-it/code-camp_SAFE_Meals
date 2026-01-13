/**
 * WebWorker를 사용한 이미지 최적화 래퍼
 *
 * 장점:
 * - 메인 스레드 블로킹 방지
 * - 대용량 이미지 처리 시 UI 반응성 유지
 * - 백그라운드에서 병렬 처리 가능
 */

import type { ImageOptimizeOptions, ImageOptimizeResult } from './image-optimizer';

let worker: Worker | null = null;
let workerInitPromise: Promise<Worker> | null = null;

/**
 * WebWorker 초기화 (싱글톤 패턴)
 */
function getWorker(): Promise<Worker> {
  if (worker) {
    return Promise.resolve(worker);
  }

  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = new Promise((resolve, reject) => {
    try {
      const workerInstance = new Worker('/workers/image-optimizer.worker.js');

      workerInstance.onerror = (error) => {
        console.error('[ImageOptimizerWorker] Worker error:', error);
        reject(error);
      };

      worker = workerInstance;
      resolve(workerInstance);
    } catch (error) {
      console.error('[ImageOptimizerWorker] Failed to create worker:', error);
      reject(error);
    }
  });

  return workerInitPromise;
}

/**
 * WebWorker를 사용한 이미지 최적화
 *
 * @param file 원본 이미지 파일
 * @param options 최적화 옵션
 * @returns 최적화된 이미지와 메타데이터
 */
export async function optimizeImageWithWorker(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<ImageOptimizeResult> {
  try {
    const workerInstance = await getWorker();

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        workerInstance.removeEventListener('message', handleMessage);

        if (event.data.type === 'success') {
          const result = event.data.result;

          console.log(`[ImageOptimizerWorker] 최적화 완료:`);
          console.log(`  - 원본 크기: ${(result.originalSize / 1024).toFixed(1)} KB`);
          console.log(
            `  - 최적화 후: ${(result.optimizedSize / 1024).toFixed(1)} KB`
          );
          console.log(`  - 압축률: ${(result.compressionRatio * 100).toFixed(1)}%`);
          console.log(
            `  - 원본 해상도: ${result.originalDimensions.width}x${result.originalDimensions.height}`
          );
          console.log(
            `  - 최적화 해상도: ${result.optimizedDimensions.width}x${result.optimizedDimensions.height}`
          );
          console.log(`  - 처리 시간: ${result.processingTime.toFixed(1)}ms`);
          console.log(`  - 🔧 WebWorker 사용 (백그라운드 처리)`);

          resolve(result);
        } else if (event.data.type === 'error') {
          reject(new Error(event.data.error));
        }
      };

      workerInstance.addEventListener('message', handleMessage);

      // Worker로 메시지 전송
      workerInstance.postMessage({
        type: 'optimize',
        file,
        options,
      });
    });
  } catch (error) {
    console.error('[ImageOptimizerWorker] Worker 사용 실패, fallback to main thread');
    // Worker 실패 시 메인 스레드에서 처리
    const { optimizeImage } = await import('./image-optimizer');
    return optimizeImage(file, options);
  }
}

/**
 * WebWorker 종료
 * 메모리 정리가 필요할 때 호출
 */
export function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
    workerInitPromise = null;
    console.log('[ImageOptimizerWorker] Worker terminated');
  }
}
