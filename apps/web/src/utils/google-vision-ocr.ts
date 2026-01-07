/**
 * Google Vision OCR 유틸리티
 *
 * Google Cloud Vision API를 사용하여 이미지에서 텍스트를 추출합니다.
 * REST API 직접 호출 방식으로 구현 (서버리스 환경 호환)
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

/** Vision API 응답 구조 */
interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      locale?: string;
      description: string;
      boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
      pages: Array<{
        confidence?: number;
        property?: {
          detectedLanguages?: Array<{
            languageCode: string;
            confidence: number;
          }>;
        };
      }>;
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

// ============================================
// Google Vision OCR 함수
// ============================================

/**
 * Google Vision API를 사용하여 이미지에서 텍스트 추출
 *
 * @param base64Image - Base64 인코딩된 이미지 데이터 (data:image/... 헤더 포함 가능)
 * @returns OCR 결과 (텍스트, 신뢰도, 언어)
 */
export async function extractTextFromImage(
  base64Image: string
): Promise<OcrResult> {
  const startTime = Date.now();

  // API 키 확인
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.error('❌ [OCR] NEXT_PUBLIC_GOOGLE_VISION_API_KEY가 설정되지 않음');
    throw new Error('Google Vision API 키가 설정되지 않았습니다.');
  }

  // Base64 헤더 제거 (data:image/jpeg;base64, 형태인 경우)
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  console.log(
    `📝 [OCR] Google Vision API 호출 시작 (이미지 크기: ${(base64Data.length / 1024).toFixed(1)} KB)`
  );

  try {
    // Google Vision API REST 호출
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ['ko', 'en', 'ja', 'zh', 'th', 'vi'],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ [OCR] API 호출 실패: ${response.status} - ${errorText}`
      );
      throw new Error(`Google Vision API 호출 실패: ${response.status}`);
    }

    const data: VisionApiResponse = await response.json();
    const processingTimeMs = Date.now() - startTime;

    // 에러 체크
    if (data.responses[0]?.error) {
      const error = data.responses[0].error;
      console.error(`❌ [OCR] API 에러: ${error.code} - ${error.message}`);
      throw new Error(`Vision API 에러: ${error.message}`);
    }

    // 텍스트 추출
    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
    const textAnnotations = data.responses[0]?.textAnnotations;

    // 전체 텍스트 (fullTextAnnotation 우선, 없으면 첫 번째 textAnnotation)
    const text =
      fullTextAnnotation?.text || textAnnotations?.[0]?.description || '';

    // 언어 감지
    const detectedLanguage =
      fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]
        ?.languageCode ||
      textAnnotations?.[0]?.locale ||
      null;

    // 신뢰도 계산
    const pageConfidence = fullTextAnnotation?.pages?.[0]?.confidence;
    const confidence = calculateConfidence(text, pageConfidence);

    console.log(`✅ [OCR] 완료 (${processingTimeMs}ms)`);
    console.log(`   - 텍스트 길이: ${text.length}자`);
    console.log(`   - 감지된 언어: ${detectedLanguage || '알 수 없음'}`);
    console.log(`   - 신뢰도: ${confidence}`);
    if (text.length > 0) {
      console.log(
        `   - 미리보기: ${text.substring(0, 100).replace(/\n/g, ' ')}...`
      );
    }

    return {
      text,
      confidence,
      detectedLanguage,
      processingTimeMs,
      rawResponse: data,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`❌ [OCR] 예외 발생 (${processingTimeMs}ms):`, error);

    // API 에러는 상위로 전파하여 ocrFailed 플래그가 설정되도록 함
    throw error;
  }
}

/**
 * OCR 신뢰도 계산
 *
 * @param text - 추출된 텍스트
 * @param pageConfidence - Vision API의 페이지 신뢰도 (0~1)
 * @returns 신뢰도 등급
 */
function calculateConfidence(
  text: string,
  pageConfidence?: number
): 'low' | 'medium' | 'high' {
  // 텍스트가 너무 짧으면 low
  if (text.length < 10) {
    return 'low';
  }

  // Vision API가 신뢰도를 제공한 경우
  if (pageConfidence !== undefined) {
    if (pageConfidence >= 0.9) return 'high';
    if (pageConfidence >= 0.7) return 'medium';
    return 'low';
  }

  // 휴리스틱: 텍스트 길이와 품질로 추정
  // - 메뉴는 보통 여러 줄, 가격, 메뉴명 포함
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const hasNumbers = /\d/.test(text);
  const hasKorean = /[가-힣]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  // 여러 줄 + 숫자(가격) + 한글/영어 → high
  if (lines.length >= 5 && hasNumbers && (hasKorean || hasEnglish)) {
    return 'high';
  }

  // 어느 정도 내용이 있으면 medium
  if (lines.length >= 2 && text.length >= 50) {
    return 'medium';
  }

  return 'low';
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
