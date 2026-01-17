/**
 * Google Vision OCR 유틸리티
 *
 * 서버 API를 통해 Google Cloud Vision API를 호출하여 이미지에서 텍스트를 추출합니다.
 * API 키는 서버에서만 사용되어 클라이언트에 노출되지 않습니다.
 *
 * 사용처:
 * - 메뉴 스캔 시 이미지에서 텍스트 추출
 * - 추출된 텍스트로 1차 빠른 판정 (performQuickAnalysis)
 * - Gemini 상세 분석과 병렬 처리
 */

// ============================================
// 타입 정의
// ============================================

/** OCR 결과 */
export interface OcrResult {
  /** 추출된 전체 텍스트 */
  text: string;
  /** 텍스트 품질 신뢰도 */
  confidence: 'low' | 'medium' | 'high';
  /** 감지된 언어 코드 (예: 'ko', 'en', 'ja') */
  detectedLanguage: string | null;
  /** 원본 응답 데이터 (디버깅용) */
  rawResponse?: unknown;
  /** 처리 시간 (ms) */
  processingTimeMs: number;
}

/** OCR API 응답 */
interface OcrApiResponse {
  text: string;
  confidence: 'low' | 'medium' | 'high';
  detectedLanguage: string | null;
  processingTimeMs: number;
  error?: string;
}

// ============================================
// Google Vision OCR 함수
// ============================================

/**
 * 서버 API를 통해 이미지에서 텍스트 추출
 *
 * @param base64Image - Base64 인코딩된 이미지 데이터 (data:image/... 헤더 포함 가능)
 * @returns OCR 결과 (텍스트, 신뢰도, 언어)
 */
export async function extractTextFromImage(
  base64Image: string
): Promise<OcrResult> {
  const startTime = Date.now();

  console.log(`📝 [OCR] 서버 API 호출 시작`);

  try {
    // 서버 API 호출 (API 키는 서버에서 처리)
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });

    const data: OcrApiResponse = await response.json();

    if (!response.ok || data.error) {
      console.error(`❌ [OCR] API 호출 실패: ${data.error}`);
      throw new Error(data.error || 'OCR 처리 실패');
    }

    const processingTimeMs = Date.now() - startTime;

    console.log(`✅ [OCR] 완료 (${processingTimeMs}ms)`);
    console.log(`   - 텍스트 길이: ${data.text.length}자`);
    console.log(`   - 감지된 언어: ${data.detectedLanguage || '알 수 없음'}`);
    console.log(`   - 신뢰도: ${data.confidence}`);
    if (data.text.length > 0) {
      console.log(
        `   - 미리보기: ${data.text.substring(0, 100).replace(/\n/g, ' ')}...`
      );
    }

    return {
      text: data.text,
      confidence: data.confidence,
      detectedLanguage: data.detectedLanguage,
      processingTimeMs,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`❌ [OCR] 예외 발생 (${processingTimeMs}ms):`, error);

    // API 에러는 상위로 전파하여 ocrFailed 플래그가 설정되도록 함
    throw error;
  }
}

/**
 * OCR 결과에서 메뉴 관련 텍스트만 추출 (선택적 후처리)
 *
 * @param ocrText - 원본 OCR 텍스트
 * @returns 정제된 텍스트
 */
export function cleanMenuText(ocrText: string): string {
  if (!ocrText) return '';

  // 기본 정리
  let cleaned = ocrText
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .trim();

  // 빈 줄 정리 (연속된 빈 줄 → 한 줄)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}
