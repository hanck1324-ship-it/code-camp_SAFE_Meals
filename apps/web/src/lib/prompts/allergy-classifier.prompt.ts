/**
 * 알레르기 판별기 프롬프트
 *
 * AI 출력 최적화를 위한 "사고 금지 판별기" 프롬프트
 * - LLM에게 "생각하지 말고 분류만 하게" 강제
 * - 설명/분석/추론 금지
 * - 단일 문자(S/D) 출력으로 토큰 최소화
 *
 * @see 36prompts.403.ai-output-streaming-optimization.txt
 */

/**
 * 빠른 알레르기/식단 분류 프롬프트
 *
 * 1차 판정: S(SAFE) 또는 D(DANGER) 2분류
 * CAUTION(C)은 2차 상세 분석에서만 사용 (교차오염/may_contain 정보 필요)
 */
export const ALLERGY_CLASSIFIER_PROMPT = `You are a food safety classifier for allergies AND dietary restrictions.

DECISION RULES (strictly follow):
- D: 사용자 알레르기와 직접 매칭 토큰이 1개라도 있으면
- D: 사용자 식단 제한 위반 토큰이 있으면 (e.g., meat for vegetarian, pork for halal)
- S: 직접 매칭이 하나도 없고 식단 위반도 없으면

DIET RESTRICTION RULES:
- vegetarian: D if meat/poultry/fish/seafood tokens found
- vegan: D if any animal product tokens found (meat/dairy/eggs/honey)
- lacto_vegetarian: D if meat/poultry/fish/seafood/eggs tokens found
- ovo_vegetarian: D if meat/poultry/fish/seafood/dairy tokens found
- pesco_vegetarian: D if meat/poultry tokens found
- flexitarian: D if meat/poultry/fish/seafood tokens found
- halal: D if pork/alcohol tokens found
- kosher: D if pork/shellfish tokens found
- buddhist_vegetarian: D if meat/poultry/fish/seafood/garlic/onion tokens found
- gluten_free: D if wheat/gluten/flour tokens found
- pork_free: D if pork tokens found
- alcohol_free: D if alcohol tokens found
- garlic_onion_free: D if garlic/onion tokens found

**주의**: 1차 판정은 2분류(S/D)만 사용.
CAUTION(C)은 2차 상세 분석에서만 사용 (교차오염/may_contain 정보 필요)

OUTPUT RULES:
- Output ONLY one character: S or D
- S = SAFE, D = DANGER
- NO explanation, NO reasoning, NO additional text

User allergies: {user_allergies}
User diets: {user_diets}
Menu ingredients: {menu_tokens}

Classification:`;

/**
 * 프롬프트 변수 치환 함수
 */
export function buildAllergyClassifierPrompt(
  userAllergies: string[],
  menuTokens: string[],
  userDiets: string[] = []
): string {
  return ALLERGY_CLASSIFIER_PROMPT.replace(
    '{user_allergies}',
    userAllergies.join(', ') || 'None'
  )
    .replace('{user_diets}', userDiets.join(', ') || 'None')
    .replace('{menu_tokens}', menuTokens.join(', ') || 'None');
}

/**
 * 안전 상태 타입 (2분류)
 */
export type QuickSafetyStatus = 'SAFE' | 'DANGER';

/**
 * S/D → SAFE/DANGER 매핑
 *
 * ⚠️ CRITICAL (CR-1): fallback은 반드시 DANGER
 * 알레르기 도메인에서 "false SAFE"는 사고로 이어짐
 */
export const STATUS_MAP: Record<string, QuickSafetyStatus> = {
  S: 'SAFE',
  D: 'DANGER',
} as const;

/**
 * AI 응답 파싱 함수
 *
 * ⚠️ 치명적 안전 규칙: fallback은 반드시 DANGER
 * - 빈 문자열, 잘못된 문자, 예외 발생 시 모두 DANGER 반환
 * - 알레르기 도메인에서 "모르면 위험으로 판정"이 원칙
 *
 * @param raw - AI 응답 원문
 * @returns 'SAFE' | 'DANGER'
 */
export function parseStatus(raw: string): QuickSafetyStatus {
  const normalized = raw?.trim()?.toUpperCase() || '';
  const match = normalized.match(/[SD]/);

  if (!match) {
    // ⚠️ 보수적 안전: 판정 실패 시 DANGER
    console.warn('⚠️ [AllergyClassifier] 판정 실패, DANGER로 처리:', raw);
    return 'DANGER';
  }

  return match[0] === 'S' ? 'SAFE' : 'DANGER';
}

/**
 * Gemini 모델 설정
 *
 * text/x.enum + responseSchema로 enum 출력 강제
 * logit_bias는 Gemini API 공식 미지원이므로 사용 안 함
 */
export const ALLERGY_CLASSIFIER_CONFIG = {
  /**
   * 필수 생성 설정
   */
  generationConfig: {
    maxOutputTokens: 3, // S/D + 여유 (1개는 잘림 위험)
    temperature: 0, // 결정론적 출력 (일관성)
    topP: 1, // nucleus sampling 비활성화
    topK: 1, // greedy decoding
    stopSequences: ['\n'], // 줄바꿈에서만 중단 (공백 제외 - 빈 응답 위험)
    responseMimeType: 'text/x.enum', // enum 출력 전용 MIME 타입
    responseSchema: {
      type: 'string',
      enum: ['S', 'D'], // 2분류로 단순화
    },
  },

  /**
   * thinkingConfig (Gemini 2.0+ 지원 시)
   * "생각" 기능이 있는 모델에서 thinking budget 최소화
   */
  thinkingConfig: {
    thinkingBudget: 0, // 분류 태스크에는 thinking 불필요
  },
} as const;

/**
 * 빠른 분류용 모델 추천
 */
export const RECOMMENDED_MODELS = {
  /** 빠른 판별용 (1단계) - 권장 */
  fast: 'gemini-2.5-flash-lite',
  /** 상세 분석용 (2단계) */
  detailed: 'gemini-3-flash-preview',
} as const;
