'use client';

/**
 * Performance Metrics 유틸리티
 *
 * 메뉴→알레르기 위험도 흐름의 병목 계측을 위한 유틸리티
 *
 * 구간 정의 (세분화됨):
 * - upload: 요청 바디(이미지) 업로드 시간
 * - ttfb: Time To First Byte (서버 처리 시간)
 * - download: 응답 다운로드 시간
 * - network: 전체 네트워크 시간 (upload + ttfb + download)
 * - parsing: 응답 수신 → JSON 파싱 완료
 * - mapping: 파싱 완료 → 알레르기 매핑 완료
 * - rendering: 매핑 완료 → UI 표시 완료
 *
 * Server-Timing 헤더 파싱:
 * - 서버에서 Server-Timing 헤더를 보내면 자동으로 파싱하여 메타데이터에 저장
 * - 예: Server-Timing: ocr;dur=8000, llm;dur=12000, post;dur=500
 */

// ============================================
// 타입 정의
// ============================================

/**
 * 계측 구간 타입 (세분화됨)
 */
export type MetricPhase =
  | 'upload' // 요청 업로드
  | 'ttfb' // Time To First Byte (서버 처리)
  | 'download' // 응답 다운로드
  | 'network' // 전체 네트워크 (기존 호환)
  | 'parsing'
  | 'mapping'
  | 'rendering'
  | 'total';

/**
 * 네트워크 세부 구간
 */
export interface NetworkBreakdown {
  upload: number | null;
  ttfb: number | null;
  download: number | null;
}

/**
 * 서버 타이밍 정보
 */
export interface ServerTimingEntry {
  name: string;
  duration: number;
  description?: string;
}

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
  /** 요청 바디 크기 (bytes) */
  requestSize: number | null;
  /** 구간별 측정치 (ms) */
  phases: {
    upload: number | null;
    ttfb: number | null;
    download: number | null;
    network: number | null;
    parsing: number | null;
    mapping: number | null;
    rendering: number | null;
    total: number | null;
  };
  /** 서버 타이밍 정보 */
  serverTiming: ServerTimingEntry[];
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
 */
export function now(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/**
 * Server-Timing 헤더 파싱
 * 예: "ocr;dur=8000, llm;dur=12000;desc=GPT-4, post;dur=500"
 */
export function parseServerTiming(
  headerValue: string | null
): ServerTimingEntry[] {
  if (!headerValue) return [];

  const entries: ServerTimingEntry[] = [];

  // 쉼표로 분리
  const parts = headerValue.split(',').map((s) => s.trim());

  for (const part of parts) {
    // 세미콜론으로 분리
    const segments = part.split(';').map((s) => s.trim());
    const name = segments[0];
    let duration = 0;
    let description: string | undefined;

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.startsWith('dur=')) {
        duration = parseFloat(segment.substring(4)) || 0;
      } else if (segment.startsWith('desc=')) {
        description = segment.substring(5);
      }
    }

    if (name) {
      entries.push({ name, duration, description });
    }
  }

  return entries;
}

// ============================================
// PerformanceTracker 클래스
// ============================================

/**
 * 단일 요청에 대한 성능 계측 추적기
 *
 * 네트워크 세분화:
 * - upload: 요청 바디 전송 완료까지
 * - ttfb: 서버 처리 시간 (첫 바이트 수신까지)
 * - download: 응답 다운로드
 *
 * @example
 * ```ts
 * const tracker = new PerformanceTracker();
 *
 * // 세분화된 네트워크 계측
 * tracker.start('upload');
 * // ... fetch 요청 ...
 * tracker.end('upload');
 * tracker.start('ttfb');
 * // ... 첫 응답 수신 ...
 * tracker.end('ttfb');
 * tracker.start('download');
 * const data = await response.json();
 * tracker.end('download');
 *
 * // 또는 기존 방식 (한 번에)
 * tracker.start('network');
 * const response = await fetch(url);
 * tracker.end('network');
 * ```
 */
export class PerformanceTracker {
  private requestId: string;
  private startTimes: Map<MetricPhase, number> = new Map();
  private endTimes: Map<MetricPhase, number> = new Map();
  private durations: Map<MetricPhase, number> = new Map();
  private responseSize: number | null = null;
  private requestSize: number | null = null;
  private serverTiming: ServerTimingEntry[] = [];
  private metadata: Record<string, unknown> = {};
  private logs: MetricLogEntry[] = [];
  private totalStartTime: number | null = null;
  private hasPrintedSummary: boolean = false; // 중복 출력 방지

  constructor(requestId?: string) {
    this.requestId = requestId || generateRequestId();
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

    if (process.env.NODE_ENV === 'development') {
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

    if (process.env.NODE_ENV === 'development') {
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
   * 요청 크기 설정 (이미지 등)
   */
  setRequestSize(size: number | string | null): this {
    if (size === null) {
      this.requestSize = null;
    } else if (typeof size === 'string') {
      this.requestSize = parseInt(size, 10) || null;
    } else {
      this.requestSize = size;
    }
    return this;
  }

  /**
   * Server-Timing 헤더 설정
   */
  setServerTiming(headerValue: string | null): this {
    this.serverTiming = parseServerTiming(headerValue);
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
      requestSize: this.requestSize,
      phases: {
        upload: this.durations.get('upload') ?? null,
        ttfb: this.durations.get('ttfb') ?? null,
        download: this.durations.get('download') ?? null,
        network: this.durations.get('network') ?? null,
        parsing: this.durations.get('parsing') ?? null,
        mapping: this.durations.get('mapping') ?? null,
        rendering: this.durations.get('rendering') ?? null,
        total: this.durations.get('total') ?? null,
      },
      serverTiming: this.serverTiming,
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
   * 콘솔 테이블용 요약 데이터 반환 (세분화 포함)
   */
  getSummaryTable(): Record<string, string | number> {
    const metrics = this.getMetrics();
    const phases = metrics.phases;

    // 가장 긴 구간 찾기 (network 하위 구간 제외)
    const mainPhases = ['network', 'parsing', 'mapping', 'rendering'] as const;
    const phaseEntries = mainPhases
      .map((key) => [key, phases[key]] as [string, number | null])
      .filter(([, val]) => val !== null) as [string, number][];

    const bottleneck =
      phaseEntries.length > 0
        ? phaseEntries.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
        : 'N/A';

    const result: Record<string, string | number> = {
      'Request ID': this.requestId,
    };

    // 네트워크 세분화가 있으면 표시
    if (
      phases.upload !== null ||
      phases.ttfb !== null ||
      phases.download !== null
    ) {
      result['┌ 업로드 (ms)'] = phases.upload?.toFixed(2) ?? 'N/A';
      result['├ TTFB (ms)'] = phases.ttfb?.toFixed(2) ?? 'N/A';
      result['└ 다운로드 (ms)'] = phases.download?.toFixed(2) ?? 'N/A';
    }

    result['네트워크 총합 (ms)'] = phases.network?.toFixed(2) ?? 'N/A';
    result['파싱 (ms)'] = phases.parsing?.toFixed(2) ?? 'N/A';
    result['매핑 (ms)'] = phases.mapping?.toFixed(2) ?? 'N/A';
    result['렌더링 (ms)'] = phases.rendering?.toFixed(2) ?? 'N/A';
    result['총합 (ms)'] = phases.total?.toFixed(2) ?? 'N/A';
    result['요청 크기 (bytes)'] = this.requestSize ?? 'N/A';
    result['응답 크기 (bytes)'] = this.responseSize ?? 'N/A';
    result['병목 구간'] = bottleneck;

    // Server-Timing 정보가 있으면 추가
    if (this.serverTiming.length > 0) {
      for (const st of this.serverTiming) {
        result[`서버:${st.name} (ms)`] = st.duration.toFixed(2);
      }
    }

    return result;
  }

  /**
   * 콘솔에 결과 출력 (중복 방지)
   */
  printSummary(): void {
    // 이미 출력한 경우 스킵
    if (this.hasPrintedSummary) {
      return;
    }
    this.hasPrintedSummary = true;

    console.log('\n========================================');
    console.log(`📊 Performance Metrics [${this.requestId}]`);
    console.log('========================================');
    console.table(this.getSummaryTable());

    // Server-Timing이 있으면 서버 처리 시간 상세 출력
    if (this.serverTiming.length > 0) {
      const serverTotal = this.serverTiming.reduce(
        (sum, st) => sum + st.duration,
        0
      );
      console.log(`\n🖥️ 서버 처리 시간 상세 (총 ${serverTotal.toFixed(2)}ms):`);
      for (const st of this.serverTiming) {
        const desc = st.description ? ` (${st.description})` : '';
        console.log(`   - ${st.name}: ${st.duration.toFixed(2)}ms${desc}`);
      }
    }

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
          upload: null,
          ttfb: null,
          download: null,
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
        upload: phaseStats('upload'),
        ttfb: phaseStats('ttfb'),
        download: phaseStats('download'),
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

// ============================================
// 전역 컬렉터 (개발용)
// ============================================

/**
 * 전역 메트릭스 컬렉터
 * 개발 중 콘솔에서 접근 가능: window.__metricsCollector
 */
let globalCollector: MetricsCollector | null = null;

export function getGlobalCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();

    // 브라우저 환경에서 전역 접근 가능하게 설정
    if (typeof window !== 'undefined') {
      (window as any).__metricsCollector = globalCollector;
    }
  }
  return globalCollector;
}

// ============================================
// React Hook용 헬퍼
// ============================================

/**
 * 렌더링 완료 시점 측정을 위한 콜백 생성
 * React의 useEffect에서 사용
 *
 * @example
 * useEffect(() => {
 *   if (analysisResult) {
 *     tracker.end('rendering');
 *     tracker.finalize();
 *     tracker.printSummary();
 *   }
 * }, [analysisResult]);
 */
export function createRenderCompleteCallback(
  tracker: PerformanceTracker,
  options?: { collectGlobal?: boolean }
): () => void {
  return () => {
    tracker.end('rendering');
    const metrics = tracker.finalize();
    tracker.printSummary();

    if (options?.collectGlobal) {
      getGlobalCollector().add(metrics);
    }
  };
}
