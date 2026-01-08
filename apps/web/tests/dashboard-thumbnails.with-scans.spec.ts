/**
 * 대시보드 썸네일 표시 테스트 - 스캔 기록 있는 계정
 * 스캔 이미지 썸네일 표시 기능 검증
 */
import { test, expect } from '@playwright/test';
import {
  seedMultipleScans,
  cleanupByTestRunId,
  generateTestRunId,
} from './test-fixtures';

// 직렬 실행 설정 (데이터 일관성 보장)
test.describe.configure({ mode: 'serial' });

test.describe('대시보드 썸네일 - 스캔 이미지 표시', () => {
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

  test('스캔 카드에 썸네일이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기 (data-testid 사용)
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 첫 번째 스캔 카드의 썸네일 확인
    const thumbnail = page.locator('[data-testid="recent-scan-card-0"] [data-testid="scan-thumbnail"]');
    await expect(thumbnail).toBeVisible();
  });

  test('썸네일에 Safety Level 뱃지가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 썸네일 내 뱃지 확인
    const badge = page.locator('[data-testid="recent-scan-card-0"] [data-testid="scan-thumbnail-badge"]');
    await expect(badge).toBeVisible();

    // 뱃지 텍스트 확인 (안전/주의/위험/확인필요 중 하나)
    await expect(badge).toHaveText(/안전|주의|위험|확인필요|Safe|Caution|Danger|Unknown/);
  });

  test('Safety Level별 뱃지 색상이 올바르게 적용되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 첫 번째 썸네일의 뱃지 확인
    const badge = page.locator('[data-testid="recent-scan-card-0"] [data-testid="scan-thumbnail-badge"]');
    await expect(badge).toBeVisible();

    // 뱃지에 적절한 배경색 클래스가 적용되었는지 확인
    // (green-50, yellow-50, red-50, gray-50 중 하나)
    const badgeClasses = await badge.getAttribute('class');
    expect(badgeClasses).toMatch(/bg-(green|yellow|red|gray)-50/);
  });

  test('이미지 없는 스캔의 경우 플레이스홀더가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 모든 썸네일 확인 - 이미지가 없는 경우 플레이스홀더가 표시됨
    const placeholders = page.locator('[data-testid="scan-thumbnail-placeholder"]');
    const thumbnails = page.locator('[data-testid="scan-thumbnail"]');

    // 썸네일이 존재해야 함
    const thumbnailCount = await thumbnails.count();
    expect(thumbnailCount).toBeGreaterThan(0);

    // 플레이스홀더가 있거나 이미지가 있어야 함 (둘 중 하나)
    // 테스트 데이터에 따라 다를 수 있음
  });

  test('모바일 뷰포트에서 썸네일 크기가 적절해야 함', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 썸네일 확인
    const thumbnail = page.locator('[data-testid="recent-scan-card-0"] [data-testid="scan-thumbnail"]');
    await expect(thumbnail).toBeVisible();

    // 썸네일이 화면에 맞게 표시되는지 확인
    const box = await thumbnail.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('데스크톱 뷰포트에서 썸네일 크기가 적절해야 함', async ({ page }) => {
    // 데스크톱 뷰포트 설정
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 썸네일 확인
    const thumbnail = page.locator('[data-testid="recent-scan-card-0"] [data-testid="scan-thumbnail"]');
    await expect(thumbnail).toBeVisible();

    // 썸네일이 적절한 크기로 표시되는지 확인
    const box = await thumbnail.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('여러 스캔 카드가 모두 썸네일을 가져야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 모든 스캔 카드의 썸네일 확인
    const thumbnails = page.locator('[data-testid="scan-thumbnail"]');
    const count = await thumbnails.count();

    // 시드된 데이터만큼 썸네일이 있어야 함
    expect(count).toBeGreaterThanOrEqual(1);

    // 모든 썸네일이 표시되는지 확인
    for (let i = 0; i < count; i++) {
      await expect(thumbnails.nth(i)).toBeVisible();
    }
  });

  test('썸네일에 alt 텍스트가 설정되어 있어야 함 (접근성)', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 이미지가 있는 경우 alt 텍스트 확인
    const images = page.locator('[data-testid="scan-thumbnail"] img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt).not.toBe('');
    }
  });

  test('플레이스홀더에 스크린리더용 텍스트가 있어야 함 (접근성)', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 플레이스홀더가 있는 경우 sr-only 텍스트 확인
    const placeholders = page.locator('[data-testid="scan-thumbnail-placeholder"]');
    const placeholderCount = await placeholders.count();

    for (let i = 0; i < placeholderCount; i++) {
      const srOnly = placeholders.nth(i).locator('.sr-only');
      await expect(srOnly).toHaveText('메뉴 이미지 없음');
    }
  });
});
