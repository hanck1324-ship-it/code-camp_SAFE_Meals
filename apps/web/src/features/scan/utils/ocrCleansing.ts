/**
 * OCR Text Cleansing Utility
 *
 * Removes noise, fixes Korean OCR errors, and normalizes price formatting
 * from raw OCR text results.
 */

export interface OcrResult {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface CleanedResult {
  original: string;
  cleansed: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

/**
 * Korean OCR error correction mapping table
 * Maps commonly misrecognized Korean characters to their correct forms
 */
const KOREAN_FIX_MAP: Record<string, string> = {
  // Single consonants often misread as menu item starts
  'ㄱ': '김',
  'ㄴ': '나',
  'ㄷ': '된',
  'ㄹ': '라',
  'ㅁ': '면',
  'ㅂ': '밥',
  'ㅅ': '수',
  'ㅇ': '오',
  'ㅈ': '전',
  'ㅊ': '참',
  'ㅋ': '큰',
  'ㅌ': '탕',
  'ㅍ': '피',
  'ㅎ': '해',

  // Common typos
  '찌게': '찌개',
  '찌깨': '찌개',
  '찌계': '찌개',
  '국밥': '국밥',
  '굽밥': '국밥',
};

/**
 * Remove special characters and noise from text
 */
function removeNoise(text: string): string {
  // Remove special characters (but keep Korean characters, numbers, and common punctuation)
  let cleaned = text.replace(/[#$%&*@!~^+=<>]/g, '');

  // Normalize whitespace: multiple spaces/tabs/newlines -> single space
  cleaned = cleaned.replace(/[\s\t\n\r]+/g, ' ');

  // Trim leading/trailing spaces
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Fix Korean OCR errors using pattern matching
 */
function fixKoreanErrors(text: string): string {
  let fixed = text;

  // Apply mapping table
  for (const [error, correct] of Object.entries(KOREAN_FIX_MAP)) {
    // Replace at word boundaries or start of string
    const regex = new RegExp(`(^|\\s)${error}`, 'g');
    fixed = fixed.replace(regex, `$1${correct}`);

    // Also replace direct matches for typos like "찌게"
    if (error.length > 1) {
      fixed = fixed.replace(new RegExp(error, 'g'), correct);
    }
  }

  return fixed;
}

/**
 * Normalize price formatting
 */
function normalizePrice(text: string): string {
  let normalized = text;

  // Remove commas from numbers: "10,000원" -> "10000원"
  normalized = normalized.replace(/(\d),(\d)/g, '$1$2');

  // Convert "k" notation: "10k" -> "10000"
  normalized = normalized.replace(/(\d+)k/gi, (match, num) => {
    return (parseInt(num) * 1000).toString();
  });

  // Convert "만원" notation: "1만원" -> "10000원"
  normalized = normalized.replace(/(\d+)만원/g, (match, num) => {
    return (parseInt(num) * 10000).toString() + '원';
  });

  // Extract numbers from price descriptions: "가격: 5000원" -> "5000원"
  // But keep the "원" character
  const priceMatch = normalized.match(/(\d+)\s*원/);
  if (priceMatch && normalized.includes('가격') || normalized.includes('price')) {
    normalized = priceMatch[0];
  }

  return normalized;
}

/**
 * Main cleansing function
 *
 * @param ocrResults - Array of OCR results with text, confidence, and bbox
 * @returns Array of cleansed results with original and cleansed text
 */
export function cleanseOcrText(ocrResults: OcrResult[] | null | undefined): CleanedResult[] {
  // Handle null/undefined input
  if (!ocrResults) {
    return [];
  }

  // Handle empty array
  if (ocrResults.length === 0) {
    return [];
  }

  return ocrResults.map((result) => {
    const original = result.text;

    // Step 1: Remove noise and special characters
    let cleansed = removeNoise(original);

    // Step 2: Fix Korean OCR errors
    cleansed = fixKoreanErrors(cleansed);

    // Step 3: Normalize price formatting
    cleansed = normalizePrice(cleansed);

    return {
      original,
      cleansed,
      confidence: result.confidence,
      bbox: { ...result.bbox }, // Copy bbox to avoid mutation
    };
  });
}
