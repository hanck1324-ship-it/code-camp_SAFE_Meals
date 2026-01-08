/**
 * 최근 스캔 섹션 테스트 - 스캔 기록 없는 계정
 * authenticated-without-scans 프로젝트에서 실행
 */
import { test, expect } from '@playwright/test';

// 직렬 실행 설정
test.describe.configure({ mode: 'serial' });

test.describe('최근 스캔 섹션 - 빈 상태 케이스', () => {
  test('스캔 기록이 없을 때 빈 상태 UI가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기 (data-testid 사용)
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 빈 상태 UI 확인
    const emptySection = page.locator('[data-testid="recent-scans-empty"]');
    await expect(emptySection).toBeVisible();
  });

  test('빈 상태에서 "아직 스캔한 메뉴가 없습니다" 메시지가 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 빈 상태 메시지 확인
    const emptyMessage = page.getByText('아직 스캔한 메뉴가 없습니다');
    await expect(emptyMessage).toBeVisible();
  });

  test('빈 상태에서 스캔 시작 유도 버튼이 표시되어야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 스캔 시작 버튼 확인
    const scanButton = page.getByText('메뉴 스캔하기');
    await expect(scanButton).toBeVisible();
  });

  test('스캔 시작 버튼 클릭 시 스캔 페이지로 이동해야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 스캔 시작 버튼 클릭
    const scanButton = page.getByText('메뉴 스캔하기');
    await scanButton.click();

    // 스캔 페이지로 이동 확인
    await expect(page).toHaveURL(/\/scan/);
  });

  test('빈 상태에서 스캔 카드가 표시되지 않아야 함', async ({ page }) => {
    await page.goto('/dashboard');

    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="recent-scans-section"]');

    // 스캔 카드가 없어야 함
    const cards = page.locator('[data-testid^="recent-scan-card-"]');
    await expect(cards).toHaveCount(0);
  });
});
