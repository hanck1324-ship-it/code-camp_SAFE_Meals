/**
 * 최근 스캔 섹션 테스트 - 스캔 기록 있는 계정
 * authenticated-with-scans 프로젝트에서 실행
 */
import { test, expect } from '@playwright/test';
import {
  seedMultipleScans,
  cleanupByTestRunId,
  generateTestRunId,
} from './test-fixtures';

// 직렬 실행 설정 (데이터 일관성 보장)
test.describe.configure({ mode: 'serial' });

test.describe('최근 스캔 섹션 - 데이터 있는 케이스', () => {
  const testRunId = generateTestRunId();
  let seedScanIds: string[] = [];

  // 테스트 전: 시드 데이터 삽입
  test.beforeAll(async () => {
    const userId = process.env.TEST_USER_WITH_SCANS_ID;
    if (!userId) {
      throw new Error('TEST_USER_WITH_SCANS_ID 환경변수가 필요합니다.');
    }

    // 3건의 스캔 데이터 시드
    seedScanIds = await seedMultipleScans(userId, testRunId, 3);
  });

  // 테스트 후: 시드 데이터 정리
  test.afterAll(async () => {
    await cleanupByTestRunId(testRunId);
  });

  test('대시보드에 최근 스캔 섹션이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기 (data-testid 사용)
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 최근 스캔 섹션 확인
    const section = page.locator('[data-testid="recent-scans-section"]');
    await expect(section).toBeVisible();
  });

  test('최근 스캔 카드가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 첫 번째 스캔 카드 확인
    const firstCard = page.locator('[data-testid="recent-scan-card-0"]');
    await expect(firstCard).toBeVisible();
  });

  test('스캔 카드에 메뉴명이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 테스트 식별자가 포함된 메뉴명 확인
    const menuName = page.getByText(new RegExp(`Test Menu Item.*\\[${testRunId}\\]`));
    await expect(menuName.first()).toBeVisible();
  });

  test('1:N 관계 - 여러 결과가 있을 때 "외 N개" 형식으로 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // "외 N개" 형식 확인 (시드 데이터에서 여러 결과가 있는 스캔)
    const multiResultText = page.getByText(/외 \d+개/);
    await expect(multiResultText.first()).toBeVisible();
  });

  test('스캔 카드에 안전 등급 뱃지가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 안전 등급 뱃지 확인 (안전, 주의, 위험, 확인필요 중 하나)
    const safetyBadge = page.locator('[data-testid="recent-scan-card-0"]').getByText(/안전|주의|위험|확인필요|Safe|Caution|Danger|Unknown/);
    await expect(safetyBadge).toBeVisible();
  });

  test('스캔 카드에 상대 시간이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 상대 시간 표시 확인 (방금 전, N분 전, N시간 전 등)
    const timeText = page.locator('[data-testid="recent-scan-card-0"]').getByText(/방금 전|분 전|시간 전|일 전|just now|min ago|hours ago|days ago|\d{4}\.\d{2}\.\d{2}/);
    await expect(timeText).toBeVisible();
  });

  test('최대 3건의 스캔이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 스캔 카드 개수 확인 (최대 3개)
    const cards = page.locator('[data-testid^="recent-scan-card-"]');
    const count = await cards.count();
    expect(count).toBeLessThanOrEqual(3);
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('최근 스캔 섹션 - 에러 시나리오', () => {
  test('네트워크 에러 시 에러 UI가 표시되어야 함', async ({ page }) => {
    // Supabase API 요청 차단
    await page.route('**/rest/v1/scan_history*', (route) => route.abort());

    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 에러 상태 UI 확인
    const errorSection = page.locator('[data-testid="recent-scans-error"]');
    await expect(errorSection).toBeVisible();

    // 재시도 버튼 확인
    const retryButton = page.getByText(/다시 시도/);
    await expect(retryButton).toBeVisible();
  });
});
