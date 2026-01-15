/**
 * Playwright Global Setup - 테스트 형식
 * 두 테스트 계정의 로그인 상태를 저장
 * setup 프로젝트로 실행됨
 */
import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// playwright/.auth 디렉토리 경로
const authDir = path.join(process.cwd(), 'playwright', '.auth');

// 디렉토리 생성
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

setup('스캔 기록 있는 계정 인증 상태 저장', async ({ page, context }) => {
  const withScansEmail = process.env.TEST_USER_WITH_SCANS_EMAIL;
  const withScansPassword = process.env.TEST_USER_WITH_SCANS_PASSWORD;

  if (!withScansEmail || !withScansPassword) {
    console.warn('⚠️ TEST_USER_WITH_SCANS 환경변수가 설정되지 않았습니다.');
    return;
  }

  await page.goto('/auth/login');
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  
  await page.fill('[data-testid="email-input"]', withScansEmail);
  await page.fill('[data-testid="password-input"]', withScansPassword);
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL(/\/dashboard/);
  
  // Storage State 저장
  await context.storageState({
    path: path.join(authDir, 'with-scans.json'),
  });
  
  console.log('✅ 스캔 기록 있는 계정 로그인 상태 저장 완료');
});

setup('스캔 기록 없는 계정 인증 상태 저장', async ({ browser }) => {
  const withoutScansEmail = process.env.TEST_USER_WITHOUT_SCANS_EMAIL;
  const withoutScansPassword = process.env.TEST_USER_WITHOUT_SCANS_PASSWORD;

  if (!withoutScansEmail || !withoutScansPassword) {
    console.warn('⚠️ TEST_USER_WITHOUT_SCANS 환경변수가 설정되지 않았습니다. 스킵합니다.');
    // 환경변수가 없으면 스킵 (실패하지 않음)
    return;
  }

  // 새 컨텍스트 생성
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/auth/login');
  await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });
  
  await page.fill('[data-testid="email-input"]', withoutScansEmail);
  await page.fill('[data-testid="password-input"]', withoutScansPassword);
  await page.click('[data-testid="login-button"]');
  
  await page.waitForURL(/\/dashboard/);
  
  // Storage State 저장
  await context.storageState({
    path: path.join(authDir, 'without-scans.json'),
  });
  
  console.log('✅ 스캔 기록 없는 계정 로그인 상태 저장 완료');

  await context.close();
});
