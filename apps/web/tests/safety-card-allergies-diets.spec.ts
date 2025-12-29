import { test, expect } from '@playwright/test';

/**
 * 알레르기 및 식단 정보 저장 기능 테스트 (Playwright 기반)
 *
 * 테스트 시나리오:
 * 1) 성공 시나리오
 *    - 알레르기 정보 저장 성공
 *    - 식단 정보 저장 성공
 *    - 알레르기 + 식단 정보 동시 저장 성공
 *    - 저장 후 성공 메시지 표시
 *    - 저장 후 페이지 이동
 *
 * 2) 실패 시나리오
 *    - 유효하지 않은 allergy_code 처리
 *    - 유효하지 않은 diet_code 처리
 *    - 네트워크 에러 처리
 *
 * 테스트 조건:
 * - jest, @testing-library/react 제외
 * - timeout: 500ms 미만
 * - 페이지 로드 식별: data-testid 대기 (networkidle 금지)
 */

// 테스트용 계정 정보 (환경변수에서 가져옴)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// 유효한 알레르기 코드 (docs/schema.md 참조)
const VALID_ALLERGY_CODES = ['eggs', 'milk', 'peanuts', 'wheat', 'shrimp'];

// 유효한 식단 코드 (docs/schema.md 참조)
const VALID_DIET_CODES = ['vegetarian', 'vegan', 'halal', 'gluten_free'];

test.describe('알레르기 및 식단 정보 저장 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 먼저 수행
    await page.goto('/auth/login');
    await page.waitForSelector('[data-testid="login-page-container"]');

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('[data-testid="login-submit-button"]');

    // 대시보드로 리다이렉트 대기
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 프로필 설정 > 알레르기/식단 편집 페이지로 이동
    await page.goto('/profile/settings/allergies-diets');

    // 페이지 로드 완료 대기 (data-testid 기반)
    await page.waitForSelector(
      '[data-testid="allergies-diets-page-container"]'
    );
  });

  /**
   * 성공 시나리오 테스트
   */
  test.describe('성공 시나리오', () => {
    /**
     * 테스트 1) 알레르기 정보만 저장
     */
    test('알레르기 정보만 저장할 수 있다', async ({ page }) => {
      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-eggs"]');
      await page.click('[data-testid="allergy-checkbox-milk"]');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('알레르기 및 식단 정보가 저장되었습니다.');

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    /**
     * 테스트 2) 식단 정보만 저장
     */
    test('식단 정보만 저장할 수 있다', async ({ page }) => {
      // 식단 체크박스 선택
      await page.click('[data-testid="diet-checkbox-vegetarian"]');
      await page.click('[data-testid="diet-checkbox-vegan"]');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('알레르기 및 식단 정보가 저장되었습니다.');

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    /**
     * 테스트 3) 알레르기 + 식단 정보 동시 저장
     */
    test('알레르기와 식단 정보를 동시에 저장할 수 있다', async ({ page }) => {
      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-peanuts"]');
      await page.click('[data-testid="allergy-checkbox-shrimp"]');

      // 식단 체크박스 선택
      await page.click('[data-testid="diet-checkbox-halal"]');
      await page.click('[data-testid="diet-checkbox-gluten_free"]');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toContainText('알레르기 및 식단 정보가 저장되었습니다.');

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    /**
     * 테스트 4) severity 옵션 포함 저장
     */
    test('severity 옵션을 포함하여 알레르기 정보를 저장할 수 있다', async ({
      page,
    }) => {
      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-eggs"]');

      // 체크박스 선택 후 severity 셀렉트가 나타나길 대기
      await page.waitForSelector('[data-testid="allergy-severity-eggs"]');

      // severity 선택
      await page.selectOption(
        '[data-testid="allergy-severity-eggs"]',
        'severe'
      );

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    /**
     * 테스트 5) notes 포함 저장
     */
    test('notes를 포함하여 알레르기 정보를 저장할 수 있다', async ({
      page,
    }) => {
      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-milk"]');

      // 체크박스 선택 후 notes 입력 필드가 나타나길 대기
      await page.waitForSelector('[data-testid="allergy-notes-milk"]');

      // notes 입력
      await page.fill('[data-testid="allergy-notes-milk"]', '유제품 전체');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });

    /**
     * 테스트 6) 빈 배열 저장 (모든 정보 삭제)
     */
    test('모든 알레르기/식단 정보를 삭제할 수 있다', async ({ page }) => {
      // 아무것도 선택하지 않고 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();

      // 페이지 이동 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });
    });
  });

  /**
   * 실패 시나리오 테스트
   */
  test.describe('실패 시나리오', () => {
    /**
     * 테스트 7) 유효하지 않은 allergy_code 처리
     */
    test('유효하지 않은 allergy_code 입력 시 에러가 표시된다', async ({
      page,
    }) => {
      // JavaScript를 통해 유효하지 않은 allergy_code로 제출 시도
      await page.evaluate(() => {
        // 페이지에 노출된 submit 함수를 직접 호출
        const event = new CustomEvent('test-invalid-allergy', {
          detail: { allergy_code: 'invalid_allergy_code' },
        });
        window.dispatchEvent(event);
      });

      // 에러 메시지 표시 확인
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        '유효하지 않은 알레르기'
      );
    });

    /**
     * 테스트 8) 유효하지 않은 diet_code 처리
     */
    test('유효하지 않은 diet_code 입력 시 에러가 표시된다', async ({
      page,
    }) => {
      // JavaScript를 통해 유효하지 않은 diet_code로 제출 시도
      await page.evaluate(() => {
        const event = new CustomEvent('test-invalid-diet', {
          detail: { diet_code: 'invalid_diet_code' },
        });
        window.dispatchEvent(event);
      });

      // 에러 메시지 표시 확인
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        '유효하지 않은'
      );
    });

    /**
     * 테스트 9) 네트워크 에러 처리
     */
    test('네트워크 에러 시 에러 메시지가 표시된다', async ({ page }) => {
      // 네트워크 에러 시뮬레이션
      await page.route('**/rest/v1/user_allergies**', (route) => {
        route.abort('failed');
      });
      await page.route('**/rest/v1/user_diets**', (route) => {
        route.abort('failed');
      });

      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-eggs"]');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 에러 메시지 표시 확인
      await page.waitForSelector('[data-testid="error-message"]', {
        timeout: 5000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        '저장에 실패했습니다'
      );
    });
  });

  /**
   * 검증 테스트
   */
  test.describe('검증 테스트', () => {
    /**
     * 테스트 10) Supabase에 실제 저장되었는지 확인
     */
    test('저장된 데이터가 Supabase에 실제로 저장된다', async ({ page }) => {
      // 먼저 모든 선택을 해제 (이전 테스트 영향 제거)
      const wheatCheckbox = page.locator(
        '[data-testid="allergy-checkbox-wheat"]'
      );

      // wheat가 이미 체크되어 있으면 해제
      if (await wheatCheckbox.isChecked()) {
        await wheatCheckbox.click();
        await page.click('[data-testid="allergies-diets-submit-button"]');
        await page.waitForURL(/\/profile/, { timeout: 5000 });
        await page.goto('/profile/settings/allergies-diets');
        await page.waitForSelector(
          '[data-testid="allergies-diets-page-container"]'
        );
      }

      // 알레르기 체크박스 선택
      await page.click('[data-testid="allergy-checkbox-wheat"]');

      // 저장 버튼 클릭
      await page.click('[data-testid="allergies-diets-submit-button"]');

      // 성공 메시지 확인
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();

      // 페이지 이동 후 다시 돌아와서 데이터 확인
      await page.waitForURL(/\/profile/, { timeout: 5000 });

      // 다시 설정 페이지로 이동
      await page.goto('/profile/settings/allergies-diets');
      await page.waitForSelector(
        '[data-testid="allergies-diets-page-container"]'
      );

      // 이전에 저장한 wheat 알레르기가 체크되어 있는지 확인
      await expect(
        page.locator('[data-testid="allergy-checkbox-wheat"]')
      ).toBeChecked();
    });

    /**
     * 테스트 11) 기존 데이터가 삭제되고 새 데이터만 남았는지 확인
     */
    test('기존 데이터가 삭제되고 새 데이터만 저장된다', async ({ page }) => {
      // 먼저 모든 선택을 해제하고 빈 상태로 저장 (초기화)
      const eggsCheckbox = page.locator(
        '[data-testid="allergy-checkbox-eggs"]'
      );
      const milkCheckbox = page.locator(
        '[data-testid="allergy-checkbox-milk"]'
      );
      const peanutsCheckbox = page.locator(
        '[data-testid="allergy-checkbox-peanuts"]'
      );

      // 기존에 체크된 것들 해제
      if (await eggsCheckbox.isChecked()) await eggsCheckbox.click();
      if (await milkCheckbox.isChecked()) await milkCheckbox.click();
      if (await peanutsCheckbox.isChecked()) await peanutsCheckbox.click();

      // 초기화 저장
      await page.click('[data-testid="allergies-diets-submit-button"]');
      await page.waitForURL(/\/profile/, { timeout: 5000 });

      // 다시 설정 페이지로 이동
      await page.goto('/profile/settings/allergies-diets');
      await page.waitForSelector(
        '[data-testid="allergies-diets-page-container"]'
      );

      // 첫 번째 저장: eggs, milk
      await page.click('[data-testid="allergy-checkbox-eggs"]');
      await page.click('[data-testid="allergy-checkbox-milk"]');
      await page.click('[data-testid="allergies-diets-submit-button"]');
      await page.waitForURL(/\/profile/, { timeout: 5000 });

      // 다시 설정 페이지로 이동
      await page.goto('/profile/settings/allergies-diets');
      await page.waitForSelector(
        '[data-testid="allergies-diets-page-container"]'
      );

      // eggs, milk가 체크되어 있는지 확인
      await expect(
        page.locator('[data-testid="allergy-checkbox-eggs"]')
      ).toBeChecked();
      await expect(
        page.locator('[data-testid="allergy-checkbox-milk"]')
      ).toBeChecked();

      // 두 번째 저장: peanuts만 (eggs, milk 해제)
      await page.click('[data-testid="allergy-checkbox-eggs"]'); // 해제
      await page.click('[data-testid="allergy-checkbox-milk"]'); // 해제
      await page.click('[data-testid="allergy-checkbox-peanuts"]');
      await page.click('[data-testid="allergies-diets-submit-button"]');
      await page.waitForURL(/\/profile/, { timeout: 5000 });

      // 다시 설정 페이지로 이동
      await page.goto('/profile/settings/allergies-diets');
      await page.waitForSelector(
        '[data-testid="allergies-diets-page-container"]'
      );

      // peanuts만 체크되어 있고, eggs, milk는 체크 해제되어 있는지 확인
      await expect(
        page.locator('[data-testid="allergy-checkbox-peanuts"]')
      ).toBeChecked();
      await expect(
        page.locator('[data-testid="allergy-checkbox-eggs"]')
      ).not.toBeChecked();
      await expect(
        page.locator('[data-testid="allergy-checkbox-milk"]')
      ).not.toBeChecked();
    });
  });
});
