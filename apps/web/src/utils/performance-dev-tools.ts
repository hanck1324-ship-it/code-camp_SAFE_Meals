'use client';

/**
 * Performance Metrics 개발자 도구
 *
 * 브라우저 콘솔에서 사용 가능한 계측 유틸리티
 *
 * 사용법:
 * 1. 콘솔에서 window.__devMetrics 접근
 * 2. 통계 확인: __devMetrics.printStats()
 * 3. 모든 측정값 보기: __devMetrics.getAll()
 * 4. 측정값 초기화: __devMetrics.clear()
 * 5. 병목 분석: __devMetrics.analyzeBottleneck()
 */

import {
  getGlobalCollector,
  type PerformanceMetrics,
  type MetricPhase,
} from './performance-metrics';

// ============================================
// 개발자 도구 인터페이스
// ============================================

interface DevMetricsInterface {
  /** 모든 측정값 조회 */
  getAll(): PerformanceMetrics[];
  /** 측정 횟수 */
  count(): number;
  /** 통계 출력 */
  printStats(): void;
  /** 측정값 초기화 */
  clear(): void;
  /** 병목 분석 */
  analyzeBottleneck(): void;
  /** CSV 형식으로 내보내기 */
  exportCSV(): string;
  /** 특정 요청 ID로 조회 */
  find(requestId: string): PerformanceMetrics | undefined;
  /** 최근 N개 측정값 조회 */
  recent(n?: number): PerformanceMetrics[];
}

// ============================================
// 개발자 도구 구현
// ============================================

const devMetrics: DevMetricsInterface = {
  getAll() {
    return getGlobalCollector().getAll();
  },

  count() {
    return getGlobalCollector().count();
  },

  printStats() {
    getGlobalCollector().printStatistics();
  },

  clear() {
    getGlobalCollector().clear();
    console.log('✅ 모든 측정값이 초기화되었습니다.');
  },

  analyzeBottleneck() {
    const stats = getGlobalCollector().getStatistics();

    if (stats.count === 0) {
      console.log('📊 측정된 데이터가 없습니다.');
      return;
    }

    console.log('\n========================================');
    console.log('🔍 병목 분석 결과');
    console.log('========================================');

    // 구간별 평균 시간 계산
    const phaseData: Array<{ phase: string; avg: number; percentage: number }> =
      [];
    const total = stats.phases.total?.avg || 0;

    for (const phase of [
      'network',
      'parsing',
      'mapping',
      'rendering',
    ] as MetricPhase[]) {
      const phaseStats = stats.phases[phase];
      if (phaseStats) {
        const percentage = total > 0 ? (phaseStats.avg / total) * 100 : 0;
        phaseData.push({
          phase,
          avg: phaseStats.avg,
          percentage,
        });
      }
    }

    // 비율 높은 순으로 정렬
    phaseData.sort((a, b) => b.percentage - a.percentage);

    console.table(
      phaseData.map(({ phase, avg, percentage }) => ({
        구간: phase,
        '평균 (ms)': avg.toFixed(2),
        '비율 (%)': percentage.toFixed(1),
        상태:
          percentage > 50 ? '🔴 병목' : percentage > 30 ? '🟡 주의' : '🟢 양호',
      }))
    );

    // 병목 구간 판정 및 권장사항
    const bottleneck = phaseData[0];
    if (bottleneck) {
      console.log('\n📌 주요 병목 구간:', bottleneck.phase);
      console.log(`   - 평균 소요 시간: ${bottleneck.avg.toFixed(2)}ms`);
      console.log(`   - 전체 대비 비율: ${bottleneck.percentage.toFixed(1)}%`);

      // 권장사항 출력
      console.log('\n💡 권장사항:');
      switch (bottleneck.phase) {
        case 'network':
          console.log('   - 응답 크기 축소 (이미지 압축, 페이지네이션)');
          console.log('   - CDN 활용');
          console.log('   - HTTP/2 또는 HTTP/3 적용');
          console.log('   - 응답 압축 (gzip/brotli) 확인');
          break;
        case 'parsing':
          console.log('   - JSON 구조 단순화');
          console.log('   - 불필요한 필드 제거');
          console.log('   - 스트리밍 파서 고려');
          break;
        case 'mapping':
          console.log('   - 알레르기 매핑 로직 최적화');
          console.log('   - 사전 계산된 매핑 테이블 사용');
          console.log('   - Web Worker 활용 검토');
          break;
        case 'rendering':
          console.log('   - FlatList/가상화 리스트 사용');
          console.log('   - React.memo로 불필요한 리렌더 방지');
          console.log('   - 이미지 lazy loading 적용');
          console.log('   - 스켈레톤 UI 활용');
          break;
      }
    }

    console.log('========================================\n');
  },

  exportCSV() {
    const measurements = getGlobalCollector().getAll();

    if (measurements.length === 0) {
      console.log('📊 내보낼 데이터가 없습니다.');
      return '';
    }

    const headers = [
      'Request ID',
      'Timestamp',
      'Network (ms)',
      'Parsing (ms)',
      'Mapping (ms)',
      'Rendering (ms)',
      'Total (ms)',
      'Response Size (bytes)',
    ];

    const rows = measurements.map((m) => [
      m.requestId,
      m.timestamp,
      m.phases.network?.toFixed(2) ?? '',
      m.phases.parsing?.toFixed(2) ?? '',
      m.phases.mapping?.toFixed(2) ?? '',
      m.phases.rendering?.toFixed(2) ?? '',
      m.phases.total?.toFixed(2) ?? '',
      m.responseSize?.toString() ?? '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    console.log('📥 CSV 데이터 생성 완료. 복사하여 사용하세요:');
    console.log(csv);

    return csv;
  },

  find(requestId: string) {
    return getGlobalCollector()
      .getAll()
      .find((m) => m.requestId === requestId);
  },

  recent(n = 5) {
    const all = getGlobalCollector().getAll();
    return all.slice(-n);
  },
};

// ============================================
// 전역 등록
// ============================================

/**
 * 개발 모드에서만 전역 객체에 등록
 */
export function registerDevMetrics(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).__devMetrics = devMetrics;

    console.log(
      '%c📊 Performance Metrics Dev Tools 활성화',
      'color: #4CAF50; font-weight: bold;'
    );
    console.log(
      '%c  사용법: window.__devMetrics.printStats()',
      'color: #9E9E9E;'
    );
    console.log(
      '%c  병목 분석: window.__devMetrics.analyzeBottleneck()',
      'color: #9E9E9E;'
    );
  }
}

export { devMetrics };
