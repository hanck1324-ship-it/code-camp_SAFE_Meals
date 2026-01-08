/**
 * Token Optimizer 테스트
 *
 * apps/web/src/utils/token-optimizer.ts 유틸리티 테스트
 */

import { test, expect } from '@playwright/test';
import {
  removeDuplicateTokens,
  normalizeIngredients,
  getOptimizedAllergyTokens,
  toStandardCode,
  ALLERGY_SYNONYMS,
  PROTECTED_KEYWORDS,
  _isWordContainedIn,
} from '../src/utils/token-optimizer';

// =============================================================================
// 1. 중복 제거 테스트
// =============================================================================

test.describe('removeDuplicateTokens', () => {
  test('완전 중복 제거 - 대소문자 정규화', () => {
    const input = ['Milk', 'milk', 'MILK'];
    const result = removeDuplicateTokens(input);

    expect(result).toHaveLength(1);
    expect(result).toContain('milk');
  });

  test('동의어 중복 제거 - 한글/영문 동의어만 제거', () => {
    const input = ['milk', 'Milk', 'MILK', '우유'];
    const result = removeDuplicateTokens(input);

    // 동의어 중복 제거: milk와 우유는 동의어이므로 영문만 유지
    expect(result).toHaveLength(1);
    expect(result).toContain('milk');
    expect(result).not.toContain('우유');
  });

  test('다른 구체어는 각각 유지 - shrimp/crab', () => {
    // 핵심 요구사항: ["새우", "게", "shrimp", "crab"] → ["shrimp", "crab"]
    const input = ['새우', '게', 'shrimp', 'crab'];
    const result = removeDuplicateTokens(input);

    // shrimp와 crab은 다른 구체어이므로 둘 다 유지
    expect(result).toContain('shrimp');
    expect(result).toContain('crab');
    // 한글 동의어는 영문이 있으면 제거
    expect(result).not.toContain('새우');
    expect(result).not.toContain('게');
  });

  test('부분 중복 제거 - 긴 토큰에 포함된 짧은 토큰 제거', () => {
    const input = ['cheese', 'cream cheese'];
    const result = removeDuplicateTokens(input);

    // cheese는 cream cheese에 단어로 포함되므로 제거
    // 하지만 cheese는 보호 키워드이므로 유지됨!
    expect(result).toContain('cream cheese');
    expect(result).toContain('cheese'); // 보호 키워드는 유지
  });

  test('부분 중복 제거 - 비보호 키워드는 제거됨', () => {
    const input = ['fried', 'fried shrimp'];
    const result = removeDuplicateTokens(input);

    // fried는 보호 키워드가 아니므로 제거됨
    expect(result).toContain('fried shrimp');
    expect(result).not.toContain('fried');
  });

  test('보호 키워드 예외 - cream은 유지', () => {
    const input = ['cream', 'ice cream'];
    const result = removeDuplicateTokens(input);

    // cream은 알레르기 핵심어이므로 유지
    expect(result).toContain('cream');
    expect(result).toContain('ice cream');
  });

  test('보호 키워드 예외 - fish는 유지', () => {
    const input = ['fish', 'fish sauce'];
    const result = removeDuplicateTokens(input);

    // fish는 알레르기 핵심어이므로 유지
    expect(result).toContain('fish');
    expect(result).toContain('fish sauce');
  });

  test('빈 배열 처리', () => {
    const result = removeDuplicateTokens([]);
    expect(result).toHaveLength(0);
  });

  test('공백 토큰 제거', () => {
    const input = ['milk', '  ', '', 'cheese'];
    const result = removeDuplicateTokens(input);

    expect(result).not.toContain('');
    expect(result).not.toContain('  ');
  });
});

// =============================================================================
// 2. Stemming/Lemmatization 테스트
// =============================================================================

test.describe('normalizeIngredients', () => {
  test('복수형 → 단수형 변환', () => {
    const input = ['eggs', 'nuts', 'shrimps'];
    const result = normalizeIngredients(input);

    expect(result).toContain('egg');
    expect(result).toContain('nut');
    expect(result).toContain('shrimp');
  });

  test('조리법 접두어 제거 - 영문', () => {
    const input = ['fried chicken', 'grilled pork', 'roasted beef'];
    const result = normalizeIngredients(input);

    expect(result).toContain('chicken');
    expect(result).toContain('pork');
    expect(result).toContain('beef');
  });

  test('조리법 접두어 제거 - 한글', () => {
    const input = ['매콤 새우', '튀김 치킨', '양념 갈비'];
    const result = normalizeIngredients(input);

    expect(result).toContain('새우');
    expect(result).toContain('치킨');
    expect(result).toContain('갈비');
  });

  test('연속 접두어 제거 + 복수형 처리', () => {
    const input = ['fresh organic eggs'];
    const result = normalizeIngredients(input);

    // fresh organic eggs → eggs → egg
    expect(result).toContain('egg');
  });

  test('수식어 제거', () => {
    const input = ['fresh milk', 'organic eggs', 'raw fish'];
    const result = normalizeIngredients(input);

    expect(result).toContain('milk');
    expect(result).toContain('egg');
    expect(result).toContain('fish');
  });
});

// =============================================================================
// 3. 우선순위 테스트
// =============================================================================

test.describe('getOptimizedAllergyTokens - 우선순위', () => {
  test('사용자 알레르기에 해당하는 토큰이 상위에 위치', () => {
    const userAllergies = ['shellfish'];
    const menuIngredients = ['pasta', 'garlic', 'shrimp', 'olive oil', 'crab'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // shrimp와 crab은 shellfish 알레르기에 해당하므로 상위에 위치
    const shrimpIndex = result.menu_tokens.indexOf('shrimp');
    const crabIndex = result.menu_tokens.indexOf('crab');
    const pastaIndex = result.menu_tokens.indexOf('pasta');

    expect(shrimpIndex).toBeLessThan(pastaIndex);
    expect(crabIndex).toBeLessThan(pastaIndex);
  });

  test('구체어 유지 - shellfish로 변환되지 않음', () => {
    const userAllergies = ['shellfish'];
    const menuIngredients = ['shrimp', 'crab', 'lobster'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // 구체어가 유지되어야 함 (shellfish로 변환 ❌)
    expect(result.menu_tokens).toContain('shrimp');
    expect(result.menu_tokens).toContain('crab');
    expect(result.menu_tokens).toContain('lobster');
    expect(result.menu_tokens).not.toContain('shellfish');
  });

  test('위험 키워드(alcohol, pork, beef)가 높은 우선순위', () => {
    const userAllergies: string[] = [];
    const menuIngredients = ['rice', 'vegetables', 'pork', 'alcohol'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // pork와 alcohol이 상위에 위치
    const porkIndex = result.menu_tokens.indexOf('pork');
    const alcoholIndex = result.menu_tokens.indexOf('alcohol');
    const riceIndex = result.menu_tokens.indexOf('rice');

    expect(porkIndex).toBeLessThan(riceIndex);
    expect(alcoholIndex).toBeLessThan(riceIndex);
  });
});

// =============================================================================
// 4. 아이템 수 제한 테스트
// =============================================================================

test.describe('getOptimizedAllergyTokens - 아이템 수 제한', () => {
  test('menu_tokens 50개 초과 시 절삭', () => {
    const userAllergies = ['milk'];
    // 80개 재료 생성
    const menuIngredients = Array.from(
      { length: 80 },
      (_, i) => `ingredient${i}`
    );

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    expect(result.menu_tokens.length).toBeLessThanOrEqual(50);
    expect(result.was_truncated).toBe(true);
  });

  test('총 item_count ≤ 60 보장', () => {
    const userAllergies = Array.from({ length: 5 }, (_, i) => `allergy${i}`);
    const menuIngredients = Array.from(
      { length: 100 },
      (_, i) => `ingredient${i}`
    );

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    expect(result.item_count).toBeLessThanOrEqual(60);
  });

  test('user_allergies 10개 초과 시 절삭', () => {
    // 15개 알레르기 생성
    const userAllergies = Array.from({ length: 15 }, (_, i) => `allergy${i}`);
    const menuIngredients = ['milk', 'egg'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    expect(result.user_allergies.length).toBeLessThanOrEqual(10);
    expect(result.was_truncated).toBe(true);
  });

  test('절삭 없을 때 was_truncated = false', () => {
    const userAllergies = ['milk', 'eggs'];
    const menuIngredients = ['cream', 'cheese', 'butter'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    expect(result.was_truncated).toBe(false);
  });
});

// =============================================================================
// 5. 동의어 매핑 테스트
// =============================================================================

test.describe('toStandardCode', () => {
  test('영문 동의어 → 표준 코드', () => {
    expect(toStandardCode('cream')).toBe('milk');
    expect(toStandardCode('cheese')).toBe('milk');
    expect(toStandardCode('butter')).toBe('milk');
    expect(toStandardCode('shrimp')).toBe('shellfish');
    expect(toStandardCode('crab')).toBe('shellfish');
  });

  test('한글 동의어 → 표준 코드', () => {
    expect(toStandardCode('우유')).toBe('milk');
    expect(toStandardCode('크림')).toBe('milk');
    expect(toStandardCode('새우')).toBe('shellfish');
    expect(toStandardCode('게')).toBe('shellfish');
  });

  test('표준 코드 → 그대로 반환', () => {
    expect(toStandardCode('milk')).toBe('milk');
    expect(toStandardCode('eggs')).toBe('eggs');
    expect(toStandardCode('shellfish')).toBe('shellfish');
  });

  test('매칭 안 되면 null 반환', () => {
    expect(toStandardCode('unknown')).toBeNull();
    expect(toStandardCode('random food')).toBeNull();
  });

  test('공백 정규화', () => {
    expect(toStandardCode('soy  sauce')).toBe('soy');
    expect(toStandardCode('  cream  ')).toBe('milk');
  });
});

// =============================================================================
// 6. 통합 테스트
// =============================================================================

test.describe('통합 테스트', () => {
  test('전체 파이프라인 - 일반 케이스', () => {
    const userAllergies = ['milk', '우유', 'dairy', '유제품'];
    const menuIngredients = [
      'cream',
      'Cream',
      'CREAM',
      'cheese',
      'butter',
      'pasta',
      'garlic',
    ];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // 알레르기 중복 제거
    expect(result.user_allergies).toHaveLength(1);
    expect(result.user_allergies).toContain('milk');

    // 메뉴 토큰 중복 제거
    expect(result.menu_tokens.filter((t) => t === 'cream')).toHaveLength(1);

    // item_count 계산
    expect(result.item_count).toBe(
      result.user_allergies.length + result.menu_tokens.length
    );
  });

  test('전체 파이프라인 - 한글/영문 혼합', () => {
    const userAllergies = ['새우', 'shrimp'];
    const menuIngredients = ['매콤 새우', 'fried shrimp', 'crab', '게'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // shellfish 알레르기로 정규화
    expect(result.user_allergies).toContain('shellfish');

    // 구체어 유지
    expect(result.menu_tokens).toContain('shrimp');
    expect(result.menu_tokens).toContain('crab');
  });

  test('전체 파이프라인 - item_count ≤ 60 보장', () => {
    const userAllergies = ['milk', 'eggs', 'peanuts', 'tree_nuts', 'shellfish'];
    const menuIngredients = Array.from({ length: 70 }, (_, i) =>
      i % 2 === 0 ? `ingredient${i}` : `재료${i}`
    );

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    expect(result.item_count).toBeLessThanOrEqual(60);
  });

  test('구체어(shrimp, crab) 유지 확인', () => {
    const userAllergies = ['shellfish'];
    const menuIngredients = ['shrimp', 'crab', 'lobster', 'pasta'];

    const result = getOptimizedAllergyTokens(userAllergies, menuIngredients);

    // 구체어가 유지되어야 함 (shellfish로 변환되면 실패)
    expect(result.menu_tokens).toContain('shrimp');
    expect(result.menu_tokens).toContain('crab');
    expect(result.menu_tokens).toContain('lobster');
    expect(result.menu_tokens).not.toContain('shellfish');
  });
});

// =============================================================================
// 7. 단어 경계 포함 테스트
// =============================================================================

test.describe('isWordContainedIn', () => {
  test('단어 경계로 포함됨', () => {
    expect(_isWordContainedIn('cheese', 'cream cheese')).toBe(true);
    expect(_isWordContainedIn('cream', 'ice cream')).toBe(true);
    expect(_isWordContainedIn('fish', 'raw fish')).toBe(true);
  });

  test('substring이지만 단어 경계 아님', () => {
    expect(_isWordContainedIn('cream', 'screaming')).toBe(false);
    expect(_isWordContainedIn('ice', 'rice')).toBe(false);
  });

  test('같은 문자열은 포함 아님', () => {
    expect(_isWordContainedIn('cheese', 'cheese')).toBe(false);
  });

  test('더 긴 문자열은 포함 아님', () => {
    expect(_isWordContainedIn('cream cheese', 'cheese')).toBe(false);
  });
});

// =============================================================================
// 8. 성능 테스트
// =============================================================================

test.describe('성능 테스트', () => {
  test('처리 시간 < 5ms', () => {
    const userAllergies = ['milk', 'eggs', 'peanuts', 'shellfish', 'wheat'];
    const menuIngredients = Array.from(
      { length: 100 },
      (_, i) => `ingredient${i}`
    );

    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      getOptimizedAllergyTokens(userAllergies, menuIngredients);
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 100;

    console.log(`평균 처리 시간: ${avgTime.toFixed(3)}ms`);
    expect(avgTime).toBeLessThan(5);
  });
});
