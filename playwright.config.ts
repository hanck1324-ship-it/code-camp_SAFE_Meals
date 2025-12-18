import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* 병렬 실행 비활성화 (테스트 안정성을 위해) */
  fullyParallel: false,

  /* CI에서 실패한 테스트 재시도 비활성화 */
  forbidOnly: !!process.env.CI,

  /* 재시도 비활성화 */
  retries: 0,

  /* 워커 수 */
  workers: 1,

  /* 리포터 설정 */
  reporter: 'html',

  /* 모든 테스트에 적용되는 공통 설정 */
  use: {
    /* 액션 수행 전 대기 시간 */
    actionTimeout: 0,

    /* 베이스 URL - 테스트에서 page.goto('/')로 사용 가능 */
    baseURL: 'http://localhost:3000',

    /* 실패한 테스트의 스크린샷 수집 */
    screenshot: 'only-on-failure',

    /* 실패한 테스트의 비디오 수집 */
    video: 'retain-on-failure',

    /* 실패한 테스트의 트레이스 수집 */
    trace: 'on-first-retry',
  },

  /* 테스트 프로젝트 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 테스트 전 개발 서버 실행 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
