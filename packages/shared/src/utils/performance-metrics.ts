/**
 * Performance Metrics 유틸리티
 *
 * 메뉴→알레르기 위험도 흐름의 병목 계측을 위한 공통 유틸리티
 * Web 및 React Native 모두에서 사용 가능
 *
 * 구간 정의:
 * - network: 요청 시작 → 응답 수신 완료
 * - parsing: 응답 수신 → JSON 파싱 완료
 * - mapping: 파싱 완료 → 알레르기 매핑 완료
 * - rendering: 매핑 완료 → UI 표시 완료
 */

// ============================================
// 타입 정의
// ============================================

/**
 * 계측 구간 타입
 */
export type MetricPhase =
  | 'network'
  | 'parsing'
  | 'mapping'
  | 'rendering'
  | 'total';

/**
 * 구간별 계측 결과
 */
export interface PhaseMetric {
  phase: MetricPhase;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * 전체 계측 결과
 */
export interface PerformanceMetrics {
  /** 요청 고유 ID */
  requestId: string;
  /** 타임스탬프 */
  timestamp: string;
  /** 네트워크 응답 크기 (bytes) */
  responseSize: number | null;
  /** 구간별 측정치 (ms) */
  phases: {
    network: number | null;
    parsing: number | null;
    mapping: number | null;
    rendering: number | null;
    total: number | null;
  };
  /** 추가 메타데이터 */
  metadata?: Record<string, unknown>;
}

/**
 * 계측 로그 엔트리
 */
export interface MetricLogEntry {
  requestId: string;
  phase: MetricPhase;
  action: 'start' | 'end';
  time: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 고유 요청 ID 생성
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * 현재 시간 (고정밀) 반환
 * React Native와 Web 모두에서 동작
 */
export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

// ============================================
// PerformanceTracker 클래스
// ============================================

/**
 * 단일 요청에 대한 성능 계측 추적기
 *
 * @example
 * ```ts
 * const tracker = new PerformanceTracker();
 *
 * tracker.start('network');
 * const response = await fetch(url);
 * tracker.end('network', { responseSize: response.headers.get('content-length') });
 *
 * tracker.start('parsing');
 * const data = await response.json();
 * tracker.end('parsing');
 *
 * tracker.start('mapping');
 * const result = mapAllergyData(data);
 * tracker.end('mapping');
 *
 * tracker.start('rendering');
 * // React setState 후 useEffect에서 호출
 * tracker.end('rendering');
 *
 * const metrics = tracker.getMetrics();
 * console.table(tracker.getSummaryTable());
 * ```
 */
export class PerformanceTracker {
  private requestId: string;
  private startTimes: Map<MetricPhase, number> = new Map();
  private endTimes: Map<MetricPhase, number> = new Map();
  private durations: Map<MetricPhase, number> = new Map();
  private responseSize: number | null = null;
  private metadata: Record<string, unknown> = {};
  private logs: MetricLogEntry[] = [];
  private totalStartTime: number | null = null;
  private enableLogging: boolean;

  constructor(requestId?: string, options?: { enableLogging?: boolean }) {
    this.requestId = requestId || generateRequestId();
    this.enableLogging =
      options?.enableLogging ?? process.env.NODE_ENV === 'development';
  }

  /**
   * 구간 시작 기록
   */
  start(phase: MetricPhase): this {
    const time = now();

    // 첫 번째 구간 시작 시 전체 타이머 시작
    if (this.totalStartTime === null) {
      this.totalStartTime = time;
    }

    this.startTimes.set(phase, time);

    this.logs.push({
      requestId: this.requestId,
      phase,
      action: 'start',
      time,
    });

    if (this.enableLogging) {
      console.log(
        `[Metrics:${this.requestId}] ${phase} 시작`,
        `| 경과: ${this.totalStartTime ? (time - this.totalStartTime).toFixed(2) : 0}ms`
      );
    }

    return this;
  }

  /**
   * 구간 종료 기록
   */
  end(
    phase: MetricPhase,
    options?: { metadata?: Record<string, unknown> }
  ): this {
    const time = now();
    const startTime = this.startTimes.get(phase);

    if (startTime === undefined) {
      console.warn(
        `[Metrics:${this.requestId}] ${phase} 시작 시간이 기록되지 않음`
      );
      return this;
    }

    const duration = time - startTime;
    this.endTimes.set(phase, time);
    this.durations.set(phase, duration);

    if (options?.metadata) {
      Object.assign(this.metadata, options.metadata);
    }

    this.logs.push({
      requestId: this.requestId,
      phase,
      action: 'end',
      time,
      metadata: options?.metadata,
    });

    if (this.enableLogging) {
      console.log(
        `[Metrics:${this.requestId}] ${phase} 완료`,
        `| 소요: ${duration.toFixed(2)}ms`,
        `| 총 경과: ${this.totalStartTime ? (time - this.totalStartTime).toFixed(2) : 0}ms`
      );
    }

    return this;
  }

  /**
   * 응답 크기 설정
   */
  setResponseSize(size: number | string | null): this {
    if (size === null) {
      this.responseSize = null;
    } else if (typeof size === 'string') {
      this.responseSize = parseInt(size, 10) || null;
    } else {
      this.responseSize = size;
    }
    return this;
  }

  /**
   * 메타데이터 추가
   */
  addMetadata(data: Record<string, unknown>): this {
    Object.assign(this.metadata, data);
    return this;
  }

  /**
   * 전체 계측 완료 및 결과 반환
   */
  finalize(): PerformanceMetrics {
    // 전체 시간 계산
    const totalEnd = now();
    if (this.totalStartTime !== null) {
      this.durations.set('total', totalEnd - this.totalStartTime);
    }

    return this.getMetrics();
  }

  /**
   * 현재까지의 계측 결과 반환
   */
  getMetrics(): PerformanceMetrics {
    return {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      responseSize: this.responseSize,
      phases: {
        network: this.durations.get('network') ?? null,
        parsing: this.durations.get('parsing') ?? null,
        mapping: this.durations.get('mapping') ?? null,
        rendering: this.durations.get('rendering') ?? null,
        total: this.durations.get('total') ?? null,
      },
      metadata: this.metadata,
    };
  }

  /**
   * 요청 ID 반환
   */
  getRequestId(): string {
    return this.requestId;
  }

  /**
   * 콘솔 테이블용 요약 데이터 반환
   */
  getSummaryTable(): Record<string, string | number> {
    const metrics = this.getMetrics();
    const phases = metrics.phases;

    // 가장 긴 구간 찾기
    const phaseEntries = Object.entries(phases).filter(
      ([key, val]) => key !== 'total' && val !== null
    ) as [MetricPhase, number][];

    const bottleneck =
      phaseEntries.length > 0
        ? phaseEntries.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : 'N/A';

    return {
      'Request ID': this.requestId,
      '네트워크 (ms)': phases.network?.toFixed(2) ?? 'N/A',
      '파싱 (ms)': phases.parsing?.toFixed(2) ?? 'N/A',
      '매핑 (ms)': phases.mapping?.toFixed(2) ?? 'N/A',
      '렌더링 (ms)': phases.rendering?.toFixed(2) ?? 'N/A',
      '총합 (ms)': phases.total?.toFixed(2) ?? 'N/A',
      '응답 크기 (bytes)': this.responseSize ?? 'N/A',
      '병목 구간': bottleneck,
    };
  }

  /**
   * 콘솔에 결과 출력
   */
  printSummary(): void {
    console.log('\n========================================');
    console.log(`📊 Performance Metrics [${this.requestId}]`);
    console.log('========================================');
    console.table(this.getSummaryTable());
    console.log('========================================\n');
  }
}

// ============================================
// MetricsCollector (다중 측정 수집기)
// ============================================

/**
 * 다중 측정 결과를 수집하고 통계를 계산하는 클래스
 *
 * 동일 시나리오 3회 이상 반복 측정 후 평균/분산 계산에 사용
 */
export class MetricsCollector {
  private measurements: PerformanceMetrics[] = [];

  /**
   * 측정 결과 추가
   */
  add(metrics: PerformanceMetrics): this {
    this.measurements.push(metrics);
    return this;
  }

  /**
   * 현재 측정 횟수 반환
   */
  count(): number {
    return this.measurements.length;
  }

  /**
   * 모든 측정 결과 반환
   */
  getAll(): PerformanceMetrics[] {
    return [...this.measurements];
  }

  /**
   * 통계 계산 (평균, 분산, 최소, 최대)
   */
  getStatistics(): {
    count: number;
    phases: Record<
      MetricPhase,
      { avg: number; variance: number; min: number; max: number } | null
    >;
    responseSize: { avg: number; min: number; max: number } | null;
  } {
    const count = this.measurements.length;
    if (count === 0) {
      return {
        count: 0,
        phases: {
          network: null,
          parsing: null,
          mapping: null,
          rendering: null,
          total: null,
        },
        responseSize: null,
      };
    }

    const calculateStats = (values: number[]) => {
      if (values.length === 0) return null;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
        values.length;
      return {
        avg,
        variance,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };

    const phaseStats = (phase: MetricPhase) => {
      const values = this.measurements
        .map((m) => m.phases[phase])
        .filter((v): v is number => v !== null);
      return calculateStats(values);
    };

    const responseSizes = this.measurements
      .map((m) => m.responseSize)
      .filter((v): v is number => v !== null);

    return {
      count,
      phases: {
        network: phaseStats('network'),
        parsing: phaseStats('parsing'),
        mapping: phaseStats('mapping'),
        rendering: phaseStats('rendering'),
        total: phaseStats('total'),
      },
      responseSize: calculateStats(responseSizes),
    };
  }

  /**
   * 통계 테이블 출력
   */
  printStatistics(): void {
    const stats = this.getStatistics();

    console.log('\n========================================');
    console.log(`📈 Performance Statistics (n=${stats.count})`);
    console.log('========================================');

    const tableData: Record<string, Record<string, string>> = {};

    for (const phase of [
      'network',
      'parsing',
      'mapping',
      'rendering',
      'total',
    ] as MetricPhase[]) {
      const s = stats.phases[phase];
      if (s) {
        tableData[phase] = {
          '평균 (ms)': s.avg.toFixed(2),
          분산: s.variance.toFixed(2),
          '최소 (ms)': s.min.toFixed(2),
          '최대 (ms)': s.max.toFixed(2),
        };
      }
    }

    console.table(tableData);

    if (stats.responseSize) {
      console.log(
        `응답 크기 - 평균: ${stats.responseSize.avg.toFixed(0)} bytes, ` +
          `최소: ${stats.responseSize.min} bytes, 최대: ${stats.responseSize.max} bytes`
      );
    }

    // 병목 구간 식별
    const phaseAvgs = Object.entries(stats.phases)
      .filter(([key, val]) => key !== 'total' && val !== null)
      .map(([key, val]) => [key, val!.avg] as [string, number]);

    if (phaseAvgs.length > 0) {
      const bottleneck = phaseAvgs.reduce((a, b) => (a[1] > b[1] ? a : b));
      console.log(
        `\n🔍 병목 구간: ${bottleneck[0]} (평균 ${bottleneck[1].toFixed(2)}ms)`
      );
    }

    console.log('========================================\n');
  }

  /**
   * 측정 결과 초기화
   */
  clear(): void {
    this.measurements = [];
  }
}
