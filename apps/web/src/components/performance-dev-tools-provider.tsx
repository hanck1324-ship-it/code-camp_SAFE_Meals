'use client';

import { useEffect } from 'react';

import { registerDevMetrics } from '@/utils/performance-dev-tools';

/**
 * 개발 모드에서만 Performance Metrics 개발 도구를 등록하는 컴포넌트
 *
 * 사용 후 브라우저 콘솔에서:
 * - window.__devMetrics.printStats() - 통계 출력
 * - window.__devMetrics.analyzeBottleneck() - 병목 분석
 * - window.__devMetrics.exportCSV() - CSV 내보내기
 * - window.__metricsCollector - 전역 메트릭스 컬렉터 직접 접근
 */
export function PerformanceDevToolsProvider() {
  useEffect(() => {
    registerDevMetrics();
  }, []);

  return null;
}
