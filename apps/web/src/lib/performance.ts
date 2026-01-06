/**
 * 성능 측정 유틸리티
 *
 * 사용 예시:
 * const perf = new PerformanceMonitor('스캔 분석');
 * perf.start('이미지 처리');
 * // ... 작업
 * perf.end('이미지 처리');
 * perf.log();
 */

export class PerformanceMonitor {
  private name: string;
  private startTime: number;
  private timings: Map<string, { start: number; end?: number; duration?: number }>;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
    this.timings = new Map();
  }

  /**
   * 특정 작업 측정 시작
   */
  start(label: string) {
    this.timings.set(label, {
      start: Date.now(),
    });
  }

  /**
   * 특정 작업 측정 종료
   */
  end(label: string) {
    const timing = this.timings.get(label);
    if (!timing) {
      console.warn(`⚠️ ${label}: 측정이 시작되지 않았습니다.`);
      return;
    }

    const end = Date.now();
    const duration = end - timing.start;
    this.timings.set(label, {
      ...timing,
      end,
      duration,
    });
  }

  /**
   * 전체 소요 시간 (초)
   */
  getTotalTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 특정 작업의 소요 시간 (밀리초)
   */
  getDuration(label: string): number | undefined {
    return this.timings.get(label)?.duration;
  }

  /**
   * 모든 측정 결과 출력
   */
  log() {
    console.log(`\n📊 [${this.name}] 성능 분석`);
    console.log('━'.repeat(60));

    let totalMeasured = 0;

    this.timings.forEach((timing, label) => {
      if (timing.duration !== undefined) {
        const seconds = (timing.duration / 1000).toFixed(3);
        const percentage = ((timing.duration / (Date.now() - this.startTime)) * 100).toFixed(1);
        console.log(`  ${label.padEnd(30)} ${seconds}s (${percentage}%)`);
        totalMeasured += timing.duration;
      }
    });

    console.log('━'.repeat(60));
    console.log(`  ${'전체 소요 시간'.padEnd(30)} ${this.getTotalTime().toFixed(3)}s`);
    console.log('');
  }

  /**
   * JSON 형태로 결과 반환
   */
  getResults() {
    const results: Record<string, number> = {};

    this.timings.forEach((timing, label) => {
      if (timing.duration !== undefined) {
        results[label] = timing.duration;
      }
    });

    return {
      name: this.name,
      totalTime: Date.now() - this.startTime,
      timings: results,
    };
  }
}

/**
 * 간단한 타이머 헬퍼
 */
export function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = ((Date.now() - start) / 1000).toFixed(3);
      console.log(`⏱️  ${label}: ${duration}s`);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
