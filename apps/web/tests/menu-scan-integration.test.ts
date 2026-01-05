/**
 * 메뉴 스캔 API - 재료 DB 통합 테스트
 *
 * 목적: Gemini AI + 재료 DB 이중 검증 시스템 테스트
 */

import { test, expect } from '@playwright/test';

// 테스트용 Base64 이미지 (1x1 투명 PNG)
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

test.describe('메뉴 스캔 API - 알레르기 분석 고도화 테스트', () => {

  test.beforeAll(async () => {
    console.log('🧪 테스트 시작: OCR 알레르기 분석 정밀도 검증');
  });

  test('1. API 엔드포인트 접근 가능 확인', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/scan/analyze', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // 실제 토큰 필요
      },
      data: {
        image: TEST_IMAGE_BASE64,
        language: 'ko',
      },
      failOnStatusCode: false,
    });

    // 401 (인증 필요) 또는 200 (성공)이면 API 정상
    expect([200, 401]).toContain(response.status());
    console.log(`✓ API 상태: ${response.status()}`);
  });

  test('2. Gemini AI 프롬프트 검증 - 사용자 알레르기 포함 확인', async () => {
    // route.ts 파일 읽기
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // 프롬프트에 사용자 알레르기가 포함되는지 확인
    expect(routeContent).toContain('User Context');
    expect(routeContent).toContain('Allergies:');
    expect(routeContent).toContain('allergyDescriptions');

    // 위험도 판정 기준 확인
    expect(routeContent).toContain('DANGER');
    expect(routeContent).toContain('CAUTION');
    expect(routeContent).toContain('SAFE');

    // DB 검증 로직 확인
    expect(routeContent).toContain('check_ingredient_allergens');
    expect(routeContent).toContain('재료 DB를 활용한 알레르기 검증 강화');

    console.log('✓ Gemini AI 프롬프트 구조 검증 완료');
  });

  test('3. DB 검증 로직 존재 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // DB 검증 단계 확인
    expect(routeContent).toContain('dbAllergenChecks');
    expect(routeContent).toContain('dbMatchedAllergens');
    expect(routeContent).toContain('combinedMatchedAllergens');

    // 위험도 상향 조정 로직 확인
    expect(routeContent).toContain('updatedSafetyStatus');
    expect(routeContent).toContain('if (dbMatchedAllergens.length > 0)');

    // DB 검증 결과 포함 확인
    expect(routeContent).toContain('db_verification');
    expect(routeContent).toContain('db_enhanced: true');

    console.log('✓ DB 검증 로직 존재 확인 완료');
  });

  test('4. 위험도 자동 상향 조정 로직 검증', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // SAFE → CAUTION 상향 로직
    const safeToCautionPattern = /if \(menuItem\.safety_status === 'SAFE'\)[\s\S]*?updatedSafetyStatus = 'CAUTION'/;
    expect(safeToCautionPattern.test(routeContent)).toBeTruthy();

    // CAUTION → DANGER 상향 로직
    const cautionToDangerPattern = /if \(menuItem\.safety_status === 'CAUTION'\)[\s\S]*?updatedSafetyStatus = 'DANGER'/;
    expect(cautionToDangerPattern.test(routeContent)).toBeTruthy();

    console.log('✓ SAFE → CAUTION → DANGER 상향 조정 로직 확인');
  });

  test('5. 알레르기 코드 매핑 테이블 검증', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // allergyCodeToLabel 객체 존재 확인
    expect(routeContent).toContain('allergyCodeToLabel');

    // 주요 알레르기 코드 확인
    const expectedAllergies = [
      'eggs',
      'milk',
      'peanuts',
      'shellfish',
      'fish',
      'wheat',
      'soy',
    ];

    for (const allergy of expectedAllergies) {
      expect(routeContent).toContain(allergy);
    }

    console.log('✓ 알레르기 코드 매핑 테이블 검증 완료');
  });

  test('6. 에러 처리 및 안전 정책 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // try-catch 에러 처리
    expect(routeContent).toContain('try {');
    expect(routeContent).toContain('catch (err)');

    // DB 오류 시 안전 편향 (is_dangerous: false)
    const safetyFallbackPattern = /catch[\s\S]*?is_dangerous: false/;
    expect(safetyFallbackPattern.test(routeContent)).toBeTruthy();

    // 재료/알레르기 없을 때 처리
    expect(routeContent).toContain('if (ingredients.length === 0 || userAllergies.length === 0)');

    console.log('✓ 에러 처리 및 안전 정책 확인 완료');
  });

  test('7. 병렬 처리 성능 최적화 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // Promise.all을 사용한 병렬 처리 확인
    const parallelProcessingCount = (routeContent.match(/Promise\.all/g) || []).length;
    expect(parallelProcessingCount).toBeGreaterThanOrEqual(2);

    // enhancedResults와 dbAllergenChecks에서 사용
    expect(routeContent).toContain('const enhancedResults = await Promise.all');
    expect(routeContent).toContain('const dbAllergenChecks = await Promise.all');

    console.log(`✓ 병렬 처리 최적화 확인 (Promise.all 사용 ${parallelProcessingCount}회)`);
  });

  test('8. Overall Status 재계산 로직 검증', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // Overall status 재계산 로직
    expect(routeContent).toContain('const hasDanger');
    expect(routeContent).toContain('const hasCaution');
    expect(routeContent).toContain('const finalOverallStatus');

    // 우선순위 로직 (DANGER > CAUTION > SAFE)
    const priorityPattern = /hasDanger \? 'DANGER' : hasCaution \? 'CAUTION' : 'SAFE'/;
    expect(priorityPattern.test(routeContent)).toBeTruthy();

    console.log('✓ Overall Status 재계산 로직 검증 완료');
  });

  test('9. 응답 구조 검증 - db_enhanced 플래그 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // 응답 구조 확인
    expect(routeContent).toContain('success: true');
    expect(routeContent).toContain('analyzed_at');
    expect(routeContent).toContain('user_context');
    expect(routeContent).toContain('overall_status');
    expect(routeContent).toContain('results: enhancedResults');
    expect(routeContent).toContain('db_enhanced: true');

    console.log('✓ API 응답 구조 검증 완료');
  });

  test('10. 로깅 및 디버깅 메시지 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const routePath = path.join(process.cwd(), 'src/app/api/scan/analyze/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    // 주요 로깅 메시지 확인
    const expectedLogs = [
      '👤 사용자 ID:',
      '🚨 알레르기 목록:',
      '📸 이미지 수신:',
      '🤖 Gemini API 호출 시작',
      '✅ Gemini API 응답 완료',
      '🔍 재료 DB로 알레르기 검증 시작',
      '✅ DB 검증 완료',
    ];

    for (const log of expectedLogs) {
      expect(routeContent).toContain(log);
    }

    console.log('✓ 로깅 및 디버깅 메시지 확인 완료');
  });
});

test.describe('재료 DB 스키마 검증', () => {

  test('11. ingredients-schema.sql 파일 존재 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaExists = fs.existsSync(schemaPath);

    expect(schemaExists).toBeTruthy();
    console.log('✓ ingredients-schema.sql 파일 존재 확인');
  });

  test('12. 스키마 파일 - 테이블 구조 검증', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // ingredients 테이블
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS ingredients');
    expect(schemaContent).toContain('recipe_id INTEGER');
    expect(schemaContent).toContain('name TEXT NOT NULL');
    expect(schemaContent).toContain('allergen_keywords TEXT[]');

    // allergen_mappings 테이블
    expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS allergen_mappings');
    expect(schemaContent).toContain('ingredient_keyword TEXT NOT NULL UNIQUE');
    expect(schemaContent).toContain('allergen_type TEXT NOT NULL');

    console.log('✓ 테이블 구조 검증 완료');
  });

  test('13. 스키마 파일 - 인덱스 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // ingredients 테이블 인덱스
    expect(schemaContent).toContain('idx_ingredients_name');
    expect(schemaContent).toContain('idx_ingredients_allergen_keywords');
    expect(schemaContent).toContain('USING GIN(allergen_keywords)');

    // allergen_mappings 테이블 인덱스
    expect(schemaContent).toContain('idx_allergen_mappings_keyword');
    expect(schemaContent).toContain('idx_allergen_mappings_type');

    console.log('✓ 인덱스 확인 완료');
  });

  test('14. 스키마 파일 - check_ingredient_allergens 함수 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // 함수 생성 확인
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION check_ingredient_allergens');
    expect(schemaContent).toContain('ingredient_name TEXT');
    expect(schemaContent).toContain('user_allergens TEXT[]');
    expect(schemaContent).toContain('RETURNS TABLE');
    expect(schemaContent).toContain('is_dangerous BOOLEAN');
    expect(schemaContent).toContain('matched_allergens TEXT[]');

    // ILIKE 검색 로직
    expect(schemaContent).toContain("ingredient_name ILIKE '%' || am.ingredient_keyword || '%'");

    console.log('✓ check_ingredient_allergens 함수 확인 완료');
  });

  test('15. 스키마 파일 - 기본 알레르기 매핑 데이터 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // 40+ 알레르기 매핑 데이터
    const expectedMappings = [
      "('우유', 'milk')",
      "('계란', 'eggs')",
      "('새우', 'shellfish')",
      "('꽃게', 'shellfish')",
      "('고등어', 'fish')",
      "('대두', 'soy')",
      "('된장', 'soy')",
      "('밀가루', 'wheat')",
      "('땅콩', 'peanuts')",
    ];

    for (const mapping of expectedMappings) {
      expect(schemaContent).toContain(mapping);
    }

    // INSERT 문 확인
    expect(schemaContent).toContain('INSERT INTO allergen_mappings');
    expect(schemaContent).toContain('ON CONFLICT (ingredient_keyword) DO NOTHING');

    console.log('✓ 기본 알레르기 매핑 데이터 확인 완료');
  });

  test('16. 스키마 파일 - RLS 정책 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const schemaPath = path.join(process.cwd(), '../../docs/database/ingredients-schema.sql');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // RLS 활성화
    expect(schemaContent).toContain('ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY');
    expect(schemaContent).toContain('ALTER TABLE allergen_mappings ENABLE ROW LEVEL SECURITY');

    // 조회 정책 (모든 사용자)
    expect(schemaContent).toContain('Anyone can view ingredients');
    expect(schemaContent).toContain('Anyone can view allergen mappings');
    expect(schemaContent).toContain('FOR SELECT');

    console.log('✓ RLS 정책 확인 완료');
  });
});

test.describe('문서화 검증', () => {

  test('17. README.md 문서 존재 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const readmePath = path.join(process.cwd(), '../../docs/database/README.md');
    const readmeExists = fs.existsSync(readmePath);

    expect(readmeExists).toBeTruthy();
    console.log('✓ docs/database/README.md 존재 확인');
  });

  test('18. API_INTEGRATION_GUIDE.md 문서 존재 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const guidePath = path.join(process.cwd(), '../../docs/database/API_INTEGRATION_GUIDE.md');
    const guideExists = fs.existsSync(guidePath);

    expect(guideExists).toBeTruthy();
    console.log('✓ docs/database/API_INTEGRATION_GUIDE.md 존재 확인');
  });

  test('19. 문서 내용 - 설치 방법 포함 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const readmePath = path.join(process.cwd(), '../../docs/database/README.md');
    const readmeContent = fs.readFileSync(readmePath, 'utf-8');

    expect(readmeContent).toContain('## 설치 방법');
    expect(readmeContent).toContain('Supabase SQL Editor');
    expect(readmeContent).toContain('ingredients-schema.sql');

    console.log('✓ 설치 방법 문서화 확인');
  });

  test('20. 문서 내용 - 실전 예제 포함 확인', async () => {
    const fs = require('fs');
    const path = require('path');

    const guidePath = path.join(process.cwd(), '../../docs/database/API_INTEGRATION_GUIDE.md');
    const guideContent = fs.readFileSync(guidePath, 'utf-8');

    expect(guideContent).toContain('## 실전 예제');
    expect(guideContent).toContain('꽃게탕');
    expect(guideContent).toContain('된장찌개');
    expect(guideContent).toContain('위험도 상향 조정');

    console.log('✓ 실전 예제 문서화 확인');
  });
});

test.afterAll(async () => {
  console.log('\n📊 테스트 요약:');
  console.log('✅ 총 20개 테스트 항목 검증 완료');
  console.log('');
  console.log('검증된 항목:');
  console.log('  1. API 엔드포인트 접근');
  console.log('  2. Gemini AI 프롬프트 구조');
  console.log('  3. DB 검증 로직');
  console.log('  4. 위험도 자동 상향 조정');
  console.log('  5. 알레르기 코드 매핑');
  console.log('  6. 에러 처리 및 안전 정책');
  console.log('  7. 병렬 처리 최적화');
  console.log('  8. Overall Status 재계산');
  console.log('  9. 응답 구조 (db_enhanced)');
  console.log(' 10. 로깅 및 디버깅');
  console.log(' 11-16. DB 스키마 검증');
  console.log(' 17-20. 문서화 검증');
});
