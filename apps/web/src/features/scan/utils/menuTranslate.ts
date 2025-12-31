/**
 * Menu Translation Utility
 *
 * Translates Korean menu names to English using:
 * 1. Local mapping table (fast, accurate)
 * 2. Gemini API for unmapped items (fallback)
 * 3. Caching for performance
 */

import { nanoid } from 'nanoid';

export interface NormalizedResult {
  original: string;
  normalized: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface TranslatedResult {
  id: string;
  original: string;
  normalized: string;
  translated: string;
  bbox: { x: number; y: number; w: number; h: number };
}

/**
 * Korean to English menu translation mapping (100+ entries)
 * Combines romanization for unique dishes with meaningful translations
 */
const MENU_TRANSLATION_MAP: Record<string, string> = {
  // Stews (찌개)
  김치찌개: 'Kimchi Stew',
  된장찌개: 'Soybean Paste Stew',
  순두부찌개: 'Soft Tofu Stew',
  부대찌개: 'Budae Stew',
  청국장찌개: 'Fermented Soybean Stew',
  동태찌개: 'Pollack Stew',
  고등어찌개: 'Mackerel Stew',
  두부찌개: 'Tofu Stew',
  김치두부찌개: 'Kimchi Tofu Stew',
  해물순두부찌개: 'Seafood Soft Tofu Stew',

  // Soups (국/탕)
  된장국: 'Soybean Paste Soup',
  미역국: 'Seaweed Soup',
  떡국: 'Rice Cake Soup',
  만둣국: 'Dumpling Soup',
  삼계탕: 'Samgyetang (Ginseng Chicken Soup)',
  갈비탕: 'Short Rib Soup',
  설렁탕: 'Seolleongtang (Ox Bone Soup)',
  곰탕: 'Gomtang (Beef Bone Soup)',
  육개장: 'Yukgaejang (Spicy Beef Soup)',
  추어탕: 'Chueo-tang (Loach Soup)',
  해장국: 'Hangover Soup',
  콩나물국: 'Bean Sprout Soup',
  북어국: 'Dried Pollack Soup',
  시래기국: 'Radish Greens Soup',

  // Grilled Dishes (구이)
  불고기: 'Bulgogi',
  삼겹살: 'Samgyeopsal (Pork Belly)',
  갈비: 'Galbi (Grilled Ribs)',
  돼지갈비: 'Pork Ribs',
  소갈비: 'Beef Ribs',
  LA갈비: 'LA Galbi',
  목살: 'Pork Neck',
  항정살: 'Pork Jowl',
  생선구이: 'Grilled Fish',
  고등어구이: 'Grilled Mackerel',
  삼치구이: 'Grilled Spanish Mackerel',
  갈치구이: 'Grilled Hairtail',
  조기구이: 'Grilled Croaker',

  // Rice Dishes (밥)
  비빔밥: 'Bibimbap',
  돌솥비빔밥: 'Stone Pot Bibimbap',
  김치볶음밥: 'Kimchi Fried Rice',
  볶음밥: 'Fried Rice',
  새우볶음밥: 'Shrimp Fried Rice',
  오므라이스: 'Omurice',
  덮밥: 'Rice Bowl',
  제육덮밥: 'Spicy Pork Rice Bowl',
  불고기덮밥: 'Bulgogi Rice Bowl',
  김밥: 'Gimbap (Seaweed Rice Roll)',
  참치김밥: 'Tuna Gimbap',
  치즈김밥: 'Cheese Gimbap',
  누룽지: 'Scorched Rice',

  // Noodles (면)
  냉면: 'Naengmyeon (Cold Noodles)',
  물냉면: 'Mul Naengmyeon (Cold Noodle Soup)',
  비빔냉면: 'Bibim Naengmyeon (Spicy Cold Noodles)',
  칼국수: 'Kalguksu (Knife-Cut Noodles)',
  잔치국수: 'Janchi Guksu (Noodle Soup)',
  막국수: 'Makguksu (Buckwheat Noodles)',
  짜장면: 'Jajangmyeon (Black Bean Noodles)',
  짬뽕: 'Jjamppong (Spicy Seafood Noodles)',
  우동: 'Udon',
  라면: 'Ramyeon',

  // Side Dishes & Banchan (반찬)
  김치: 'Kimchi',
  깍두기: 'Kkakdugi (Radish Kimchi)',
  총각김치: 'Ponytail Radish Kimchi',
  백김치: 'White Kimchi',
  나물: 'Namul (Seasoned Vegetables)',
  시금치나물: 'Seasoned Spinach',
  콩나물: 'Bean Sprouts',
  멸치볶음: 'Stir-Fried Anchovies',
  계란말이: 'Rolled Omelette',
  두부조림: 'Braised Tofu',

  // Pancakes (전)
  김치전: 'Kimchi Pancake',
  파전: 'Pajeon (Green Onion Pancake)',
  해물파전: 'Seafood Pancake',
  부추전: 'Garlic Chive Pancake',
  빈대떡: 'Bindae-tteok (Mung Bean Pancake)',
  감자전: 'Potato Pancake',
  호박전: 'Zucchini Pancake',
  동그랑땡: 'Dong Geu Rang Ttaeng (Pan-Fried Meat Patties)',

  // Street Food
  떡볶이: 'Tteokbokki',
  순대: 'Sundae (Blood Sausage)',
  튀김: 'Twigim (Korean Fried Food)',
  오뎅: 'Odeng (Fish Cake)',
  붕어빵: 'Bungeoppang (Fish-Shaped Pastry)',
  호떡: 'Hotteok (Sweet Pancake)',
  군고구마: 'Roasted Sweet Potato',

  // Stir-Fried Dishes (볶음)
  제육볶음: 'Jeyuk Bokkeum (Spicy Pork Stir-Fry)',
  오징어볶음: 'Ojingeo Bokkeum (Spicy Squid Stir-Fry)',
  낙지볶음: 'Nakji Bokkeum (Spicy Octopus Stir-Fry)',
  고추장불고기: 'Gochujang Bulgogi',

  // Chicken Dishes
  치킨: 'Fried Chicken',
  양념치킨: 'Yang Nyeom Chicken (Sweet & Spicy)',
  후라이드치킨: 'Fried Chicken',
  간장치킨: 'Soy Sauce Chicken',
  닭갈비: 'Dak Galbi (Spicy Chicken)',
  찜닭: 'Jjimdak (Braised Chicken)',
  삼계탕: 'Samgyetang (Ginseng Chicken Soup)',

  // Seafood
  회: 'Hoe (Raw Fish)',
  초밥: 'Sushi',
  회덮밥: 'Hoe Dupbap (Raw Fish Rice Bowl)',
  광어회: 'Flounder Sashimi',
  연어회: 'Salmon Sashimi',
  참치회: 'Tuna Sashimi',

  // Desserts & Drinks
  빙수: 'Bingsu (Shaved Ice Dessert)',
  팥빙수: 'Patbingsu (Red Bean Shaved Ice)',
  커피: 'Coffee',
  녹차: 'Green Tea',
  식혜: 'Sikhye (Sweet Rice Drink)',
  수정과: 'Sujeonggwa (Cinnamon Punch)',
};

/**
 * In-memory cache for translated menu names
 */
const translationCache = new Map<string, string>();

/**
 * Get cached translation if available
 */
function getCachedTranslation(menuName: string): string | null {
  return translationCache.get(menuName) || null;
}

/**
 * Cache a translation result
 */
function cacheTranslation(menuName: string, translation: string): void {
  translationCache.set(menuName, translation);
}

/**
 * Generate unique menu ID
 */
function generateMenuId(): string {
  return `menu-${nanoid(10)}`;
}

/**
 * Translate a single menu name
 * Priority: Cache → Local Map → Gemini API → Fallback to original
 */
async function translateSingle(menuName: string): Promise<string> {
  // Check cache first
  const cached = getCachedTranslation(menuName);
  if (cached) {
    return cached;
  }

  // Check local mapping table
  const mapped = MENU_TRANSLATION_MAP[menuName];
  if (mapped) {
    cacheTranslation(menuName, mapped);
    return mapped;
  }

  // For unmapped items, return the original (Gemini integration can be added later)
  // This keeps the function synchronous for now
  return menuName;
}

/**
 * Main translation function
 *
 * @param normalizedResults - Array of normalized menu results
 * @returns Array of translated results with unique IDs
 */
export async function translateMenuNames(
  normalizedResults: NormalizedResult[] | null | undefined
): Promise<TranslatedResult[]> {
  // Handle null/undefined input
  if (!normalizedResults) {
    return [];
  }

  // Handle empty array
  if (normalizedResults.length === 0) {
    return [];
  }

  // Translate all items
  const translated: TranslatedResult[] = [];

  for (const result of normalizedResults) {
    const translation = await translateSingle(result.normalized);

    translated.push({
      id: generateMenuId(),
      original: result.original,
      normalized: result.normalized,
      translated: translation,
      bbox: { ...result.bbox },
    });
  }

  return translated;
}

/**
 * Clear translation cache (useful for testing)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get translation from local map only (for testing)
 */
export function getLocalTranslation(menuName: string): string | undefined {
  return MENU_TRANSLATION_MAP[menuName];
}
