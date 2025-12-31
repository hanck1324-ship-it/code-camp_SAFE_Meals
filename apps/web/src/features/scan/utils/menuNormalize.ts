/**
 * Menu Normalization Utility
 *
 * Standardizes menu names by removing spacing, expanding abbreviations,
 * and deduplicating similar items using Levenshtein distance.
 */

export interface CleanedResult {
  original: string;
  cleansed: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface NormalizedResult {
  original: string;
  normalized: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

/**
 * Korean food abbreviation expansion mapping
 */
const ABBREVIATION_MAP: Record<string, string> = {
  삼겹: '삼겹살',
  김찌: '김치찌개',
  된짱: '된장찌개',
  부찌: '부대찌개',
  순찌: '순두부찌개',
  고기: '고기',
  삼계: '삼계탕',
};

/**
 * Common Korean typo corrections
 */
const TYPO_MAP: Record<string, string> = {
  찌게: '찌개',
  찌깨: '찌개',
  찌계: '찌개',
  짜게: '찌개',
};

/**
 * Remove all spacing in Korean menu names
 * Keeps spacing between numbers and text
 */
function standardizeSpacing(text: string): string {
  // Keep spacing around numbers (e.g., "10 인분" -> "10인분")
  // But remove all other spaces
  let normalized = text.replace(/(\D)\s+(\D)/g, '$1$2');

  // Ensure no extra spaces around numbers
  normalized = normalized.replace(/(\d)\s+(\D)/g, '$1$2');
  normalized = normalized.replace(/(\D)\s+(\d)/g, '$1$2');

  return normalized;
}

/**
 * Expand abbreviations to full menu names
 */
function expandAbbreviations(text: string): string {
  let expanded = text;

  for (const [abbr, full] of Object.entries(ABBREVIATION_MAP)) {
    // Match whole word abbreviations
    const regex = new RegExp(`^${abbr}$|\\s${abbr}$|^${abbr}\\s|\\s${abbr}\\s`, 'g');
    if (regex.test(text)) {
      expanded = text.replace(new RegExp(abbr, 'g'), full);
      break; // Only expand first match
    }
    // Also try direct match for short menus
    if (text === abbr) {
      expanded = full;
      break;
    }
  }

  return expanded;
}

/**
 * Fix common Korean typography errors
 */
function fixTypos(text: string): string {
  let fixed = text;

  for (const [typo, correct] of Object.entries(TYPO_MAP)) {
    fixed = fixed.replace(new RegExp(typo, 'g'), correct);
  }

  return fixed;
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (str1.length === 0 && str2.length === 0) return 100;
  if (str1.length === 0 || str2.length === 0) return 0;

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return ((maxLength - distance) / maxLength) * 100;
}

/**
 * Deduplicate and merge similar menu items
 * Keeps the first occurrence or highest confidence item
 */
function deduplicateAndMerge(
  results: Array<{ normalized: string; confidence: number; [key: string]: any }>
): Array<{ normalized: string; confidence: number; [key: string]: any }> {
  const unique: Array<{
    normalized: string;
    confidence: number;
    [key: string]: any;
  }> = [];
  const SIMILARITY_THRESHOLD = 80; // 80% similarity considered as duplicate

  for (const current of results) {
    let isDuplicate = false;

    for (let i = 0; i < unique.length; i++) {
      const existing = unique[i];

      // Check for exact match (case-insensitive)
      if (
        current.normalized.toLowerCase() === existing.normalized.toLowerCase()
      ) {
        isDuplicate = true;
        // Keep the one with higher confidence
        if (current.confidence > existing.confidence) {
          unique[i] = current;
        }
        break;
      }

      // Check for similarity using Levenshtein distance
      const similarity = calculateSimilarity(
        current.normalized,
        existing.normalized
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        // Keep the one with higher confidence
        if (current.confidence > existing.confidence) {
          unique[i] = current;
        }
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(current);
    }
  }

  return unique;
}

/**
 * Main normalization function
 *
 * @param cleanedResults - Array of cleansed OCR results
 * @returns Array of normalized results with deduplicated menu names
 */
export function normalizeMenuNames(
  cleanedResults: CleanedResult[] | null | undefined
): NormalizedResult[] {
  // Handle null/undefined input
  if (!cleanedResults) {
    return [];
  }

  // Handle empty array
  if (cleanedResults.length === 0) {
    return [];
  }

  // Step 1: Apply normalization to each item
  const normalized = cleanedResults.map((result) => {
    let text = result.cleansed;

    // Remove spacing
    text = standardizeSpacing(text);

    // Fix typos
    text = fixTypos(text);

    // Expand abbreviations
    text = expandAbbreviations(text);

    return {
      original: result.original,
      normalized: text,
      confidence: result.confidence,
      bbox: { ...result.bbox },
    };
  });

  // Step 2: Deduplicate and merge similar items
  const deduplicated = deduplicateAndMerge(normalized);

  return deduplicated as NormalizedResult[];
}
