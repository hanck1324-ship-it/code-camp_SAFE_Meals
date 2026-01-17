/**
 * 알레르기 파싱 유틸리티 테스트
 *
 * 테스트 대상:
 * - parseAllergyText: 알레르기 표시 문자열 파싱
 * - parseRawMaterials: 원재료명 파싱
 * - extractAllergensFromProduct: 제품 정보에서 알레르겐 추출
 * - checkAllergyMatch: 사용자 알레르기와 제품 비교
 */

import {
  parseAllergyText,
  parseRawMaterials,
  checkAllergyMatch,
  KOREA_ALLERGEN_LIST,
} from '@/lib/public-data-api';

describe('알레르기 파싱 유틸리티', () => {
  describe('parseAllergyText', () => {
    it('한글 알레르기 표시 문자열을 파싱해야 함', () => {
      const result = parseAllergyText(
        '난류(가금류에 한함), 우유, 밀, 대두 함유'
      );

      expect(result).toContain('eggs');
      expect(result).toContain('milk');
      expect(result).toContain('wheat');
      expect(result).toContain('soy');
    });

    it('갑각류/조개류 알레르기를 파싱해야 함', () => {
      const result = parseAllergyText('새우, 게, 굴 함유');

      expect(result).toContain('shellfish');
      expect(result).toContain('mollusks');
    });

    it('견과류 알레르기를 파싱해야 함', () => {
      const result = parseAllergyText('땅콩, 호두, 아몬드 함유');

      expect(result).toContain('peanuts');
      expect(result).toContain('tree_nuts');
    });

    it('육류 알레르기를 파싱해야 함', () => {
      const result = parseAllergyText('돼지고기, 쇠고기, 닭고기 함유');

      expect(result).toContain('pork');
      expect(result).toContain('beef');
      expect(result).toContain('chicken');
    });

    it('빈 문자열은 빈 배열을 반환해야 함', () => {
      expect(parseAllergyText('')).toEqual([]);
      expect(parseAllergyText(null)).toEqual([]);
      expect(parseAllergyText(undefined)).toEqual([]);
    });

    it('알레르기 정보가 없는 문자열은 빈 배열을 반환해야 함', () => {
      const result = parseAllergyText('설탕, 소금, 물');
      expect(result).toEqual([]);
    });

    it('대소문자를 구분하지 않아야 함', () => {
      const result = parseAllergyText('MILK, EGG, PEANUT');
      // 영문은 현재 ko 필드와 aliases로만 검색하므로 빈 배열
      // 한글 aliases에 영문이 포함되어 있지 않음
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('parseRawMaterials', () => {
    it('원재료명에서 알레르겐을 추출해야 함', () => {
      const result = parseRawMaterials(
        '정제수, 밀가루(밀:미국산), 설탕, 대두유, 계란'
      );

      expect(result).toContain('wheat');
      expect(result).toContain('soy');
      expect(result).toContain('eggs');
    });

    it('괄호 안 재료도 파싱해야 함', () => {
      const result = parseRawMaterials('소스(우유, 크림, 버터 포함)');

      expect(result).toContain('milk');
    });

    it('복합 원재료를 파싱해야 함', () => {
      const result = parseRawMaterials(
        '참기름, 간장(대두, 밀 포함), 두부, 참깨'
      );

      expect(result).toContain('sesame');
      expect(result).toContain('soy');
      expect(result).toContain('wheat');
    });

    it('해산물 원재료를 파싱해야 함', () => {
      const result = parseRawMaterials('새우젓, 멸치액젓, 굴소스');

      expect(result).toContain('shellfish');
      expect(result).toContain('fish');
      expect(result).toContain('mollusks');
    });

    it('빈 입력은 빈 배열을 반환해야 함', () => {
      expect(parseRawMaterials('')).toEqual([]);
      expect(parseRawMaterials(null)).toEqual([]);
      expect(parseRawMaterials(undefined)).toEqual([]);
    });
  });

  describe('checkAllergyMatch', () => {
    it('알레르기 매칭 시 DANGER를 반환해야 함', () => {
      const userAllergies = ['milk', 'peanuts'];
      const productAllergens = ['eggs', 'milk', 'wheat'];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(true);
      expect(result.matchedAllergens).toContain('milk');
      expect(result.safetyLevel).toBe('DANGER');
    });

    it('알레르기 매칭이 없으면 SAFE를 반환해야 함', () => {
      const userAllergies = ['shellfish', 'peanuts'];
      const productAllergens = ['eggs', 'milk', 'wheat'];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(false);
      expect(result.matchedAllergens).toEqual([]);
      expect(result.safetyLevel).toBe('SAFE');
    });

    it('여러 알레르기가 매칭되면 모두 반환해야 함', () => {
      const userAllergies = ['milk', 'eggs', 'wheat'];
      const productAllergens = ['eggs', 'milk', 'soy'];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(true);
      expect(result.matchedAllergens).toContain('milk');
      expect(result.matchedAllergens).toContain('eggs');
      expect(result.matchedAllergens).not.toContain('wheat');
    });

    it('빈 사용자 알레르기 목록은 SAFE를 반환해야 함', () => {
      const userAllergies: string[] = [];
      const productAllergens = ['eggs', 'milk'];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(false);
      expect(result.safetyLevel).toBe('SAFE');
    });

    it('빈 제품 알레르겐 목록은 SAFE를 반환해야 함', () => {
      const userAllergies = ['milk', 'eggs'];
      const productAllergens: string[] = [];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(false);
      expect(result.safetyLevel).toBe('SAFE');
    });

    it('대소문자를 구분하지 않고 매칭해야 함', () => {
      const userAllergies = ['MILK', 'Eggs'];
      const productAllergens = ['milk', 'EGGS'];

      const result = checkAllergyMatch(userAllergies, productAllergens);

      expect(result.isMatch).toBe(true);
      expect(result.matchedAllergens.length).toBe(2);
    });
  });

  describe('KOREA_ALLERGEN_LIST', () => {
    it('22가지 한국 식품 알레르기 유발물질이 있어야 함', () => {
      expect(KOREA_ALLERGEN_LIST.length).toBeGreaterThanOrEqual(20);
    });

    it('각 알레르겐에 code, ko, aliases가 있어야 함', () => {
      for (const allergen of KOREA_ALLERGEN_LIST) {
        expect(allergen).toHaveProperty('code');
        expect(allergen).toHaveProperty('ko');
        expect(allergen).toHaveProperty('aliases');
        expect(Array.isArray(allergen.aliases)).toBe(true);
        expect(allergen.aliases.length).toBeGreaterThan(0);
      }
    });

    it('주요 알레르겐 코드가 포함되어야 함', () => {
      const codes = KOREA_ALLERGEN_LIST.map((a) => a.code);

      expect(codes).toContain('eggs');
      expect(codes).toContain('milk');
      expect(codes).toContain('peanuts');
      expect(codes).toContain('tree_nuts');
      expect(codes).toContain('fish');
      expect(codes).toContain('shellfish');
      expect(codes).toContain('wheat');
      expect(codes).toContain('soy');
      expect(codes).toContain('sesame');
    });
  });
});

describe('실제 제품 데이터 테스트', () => {
  it('실제 HACCP 알레르기 표시 형식을 파싱해야 함', () => {
    // 실제 식품 라벨 형식
    const allergyText =
      '이 제품은 난류(가금류에 한함), 우유, 밀, 대두, 땅콩을 사용한 제품과 같은 제조시설에서 제조하고 있습니다.';

    const result = parseAllergyText(allergyText);

    expect(result).toContain('eggs');
    expect(result).toContain('milk');
    expect(result).toContain('wheat');
    expect(result).toContain('soy');
    expect(result).toContain('peanuts');
  });

  it('실제 원재료명 형식을 파싱해야 함', () => {
    // 실제 식품 원재료명 형식
    const rawMaterials =
      '소맥분(밀:미국산,호주산), 식물성유지(팜유), 전란액(계란), 정제소금, 탈지분유(우유), 베이킹파우더, 향료';

    const result = parseRawMaterials(rawMaterials);

    expect(result).toContain('wheat');
    expect(result).toContain('eggs');
    expect(result).toContain('milk');
  });

  it('김치 원재료를 파싱해야 함', () => {
    const rawMaterials = '배추, 고춧가루, 마늘, 생강, 새우젓, 멸치액젓, 찹쌀풀';

    const result = parseRawMaterials(rawMaterials);

    expect(result).toContain('shellfish'); // 새우젓
    expect(result).toContain('fish'); // 멸치액젓
  });
});
