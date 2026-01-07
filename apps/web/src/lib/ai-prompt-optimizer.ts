/**
 * AI 프롬프트 최적화 유틸리티
 *
 * AI 비용과 속도를 개선하기 위한 프롬프트 최적화
 */

export function buildOptimizedPrompt(
  allergyDescriptions: string[],
  dietType: string,
  language: string
): string {
  // 간결한 프롬프트 - 토큰 수 약 60% 감소
  return `Analyze this menu image for food safety.

User Info:
- Allergies: ${allergyDescriptions.join(', ') || 'None'}
- Diet: ${dietType}
- Language: ${language}

Task:
1. Identify all menu items
2. Check for allergens: ${allergyDescriptions.join(', ') || 'None'}
3. Assess safety: DANGER (contains allergen), CAUTION (might contain), SAFE (none)

Output JSON:
{
  "overall_status": "SAFE|CAUTION|DANGER",
  "results": [{
    "id": "1",
    "original_name": "name in image",
    "translated_name": "translated to ${language}",
    "safety_status": "SAFE|CAUTION|DANGER",
    "reason": "specific reason in ${language}",
    "ingredients": ["list"]
  }]
}

Rules:
- Be conservative (if unsure → CAUTION)
- Return ONLY valid JSON (no markdown)
- Use ${language} for all text`;
}

/**
 * 상세 프롬프트 (높은 정확도 필요시)
 */
export function buildDetailedPrompt(
  allergyDescriptions: string[],
  dietType: string,
  language: string
): string {
  const allergyCodeToLabel: Record<string, string> = {
    eggs: 'Eggs (계란)',
    milk: 'Milk/Dairy (우유/유제품)',
    peanuts: 'Peanuts (땅콩)',
    tree_nuts: 'Tree Nuts (견과류)',
    fish: 'Fish (생선)',
    shellfish: 'Shellfish (갑각류/조개류)',
    wheat: 'Wheat/Gluten (밀/글루텐)',
    soy: 'Soy (대두)',
    sesame: 'Sesame (참깨)',
    pork: 'Pork (돼지고기)',
    beef: 'Beef (소고기)',
    chicken: 'Chicken (닭고기)',
    lamb: 'Lamb (양고기)',
    buckwheat: 'Buckwheat (메밀)',
    peach: 'Peach (복숭아)',
    tomato: 'Tomato (토마토)',
    sulfites: 'Sulfites (아황산염)',
    mustard: 'Mustard (겨자)',
    celery: 'Celery (셀러리)',
    lupin: 'Lupin (루핀)',
    mollusks: 'Mollusks (연체류)',
  };

  return `
You are a food safety expert. Analyze this menu and assess allergen risks.

User Context:
- Allergies: ${allergyDescriptions.join(', ') || 'None'}
- Diet: ${dietType}
- Language: ${language}

Task:
1. Identify menu items
2. Extract ingredients
3. Assess safety:
   - DANGER: Definitely contains allergen
   - CAUTION: Might contain or cross-contamination risk
   - SAFE: No allergen detected

Output JSON format:
{
  "overall_status": "SAFE" | "CAUTION" | "DANGER",
  "results": [
    {
      "id": "1",
      "original_name": "menu name in image",
      "translated_name": "translated to ${language}",
      "description": "brief description",
      "safety_status": "SAFE" | "CAUTION" | "DANGER",
      "reason": "specific reason in ${language}",
      "ingredients": ["detected", "ingredients"],
      "allergy_risk": {
        "status": "SAFE" | "CAUTION" | "DANGER",
        "matched_allergens": []
      }
    }
  ]
}

Rules:
- Be strict and conservative
- If uncertain, use CAUTION
- Return ONLY valid JSON (no markdown)
- Translate to ${language}
  `;
}

/**
 * 프롬프트 모드 선택
 */
export type PromptMode = 'fast' | 'accurate';

export function getPrompt(
  mode: PromptMode,
  allergyDescriptions: string[],
  dietType: string,
  language: string
): string {
  if (mode === 'fast') {
    return buildOptimizedPrompt(allergyDescriptions, dietType, language);
  }
  return buildDetailedPrompt(allergyDescriptions, dietType, language);
}
