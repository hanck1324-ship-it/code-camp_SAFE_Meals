import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * OCR 결과 인터페이스
 */
export interface OCRResult {
  text: string;
  confidence: number;
  source: 'tesseract' | 'gemini' | 'google-vision' | 'hybrid';
}

/**
 * OCR 전략 타입
 */
export type OCRStrategy = 'tesseract' | 'google-vision' | 'hybrid' | 'gemini-only' | 'race';

/**
 * Tesseract.js를 사용한 OCR 처리
 * @param base64Image - Base64 인코딩된 이미지 데이터
 * @param language - OCR 언어 (기본값: 'kor+eng')
 * @returns OCR 결과
 */
export async function extractTextWithTesseract(
  base64Image: string,
  language: string = 'kor+eng'
): Promise<OCRResult> {
  try {
    console.log('🔍 Tesseract OCR 시작...');
    const startTime = Date.now();

    // Base64 헤더 제거
    const imageData = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    // Tesseract.js로 텍스트 추출
    const result = await Tesseract.recognize(
      `data:image/jpeg;base64,${imageData}`,
      language,
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`  진행률: ${(m.progress * 100).toFixed(1)}%`);
          }
        },
      }
    );

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Tesseract OCR 완료 (${elapsedTime}초)`);
    console.log(`  추출된 텍스트 길이: ${result.data.text.length} 자`);
    console.log(`  신뢰도: ${(result.data.confidence).toFixed(2)}%`);

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      source: 'tesseract',
    };
  } catch (error) {
    console.error('❌ Tesseract OCR 실패:', error);
    throw error;
  }
}

/**
 * Google Cloud Vision API를 사용한 OCR 처리 (가장 정확함)
 * @param base64Image - Base64 인코딩된 이미지 데이터
 * @returns OCR 결과
 */
export async function extractTextWithGoogleVision(
  base64Image: string
): Promise<OCRResult> {
  try {
    console.log('🔍 Google Cloud Vision OCR 시작...');
    const startTime = Date.now();

    // Google Cloud Vision API 키가 없으면 에러
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_CLOUD_VISION_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    // Base64 헤더 제거
    const imageData = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    // Google Cloud Vision API 호출
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
                content: imageData,
              },
              features: [
                {
                  type: 'TEXT_DETECTION', // 또는 'DOCUMENT_TEXT_DETECTION'
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ['ko', 'en'], // 한글과 영어 우선
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Vision API 오류: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const textAnnotations = data.responses[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      throw new Error('텍스트를 찾을 수 없습니다.');
    }

    // 첫 번째 항목이 전체 텍스트
    const extractedText = textAnnotations[0].description;

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Google Cloud Vision OCR 완료 (${elapsedTime}초)`);
    console.log(`  추출된 텍스트 길이: ${extractedText.length} 자`);

    return {
      text: extractedText,
      confidence: 95, // Google Vision은 매우 높은 정확도
      source: 'google-vision',
    };
  } catch (error) {
    console.error('❌ Google Cloud Vision OCR 실패:', error);
    throw error;
  }
}

/**
 * Gemini Vision API를 사용한 OCR 처리 (폴백용)
 * @param base64Image - Base64 인코딩된 이미지 데이터
 * @returns OCR 결과
 */
export async function extractTextWithGemini(
  base64Image: string
): Promise<OCRResult> {
  try {
    console.log('🔍 Gemini Vision OCR 시작 (폴백)...');
    const startTime = Date.now();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // Base64 헤더 제거
    const imageData = base64Image.includes('base64,')
      ? base64Image.split('base64,')[1]
      : base64Image;

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: 'image/jpeg',
      },
    };

    const prompt = `
Extract ALL visible text from this image.
Return ONLY the extracted text, without any explanations or formatting.
Preserve the original layout and line breaks as much as possible.
Include text in all languages (Korean, English, etc.).
`;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Gemini Vision OCR 완료 (${elapsedTime}초)`);
    console.log(`  추출된 텍스트 길이: ${text.length} 자`);

    return {
      text,
      confidence: 100, // Gemini는 신뢰도를 제공하지 않으므로 임의값
      source: 'gemini',
    };
  } catch (error) {
    console.error('❌ Gemini Vision OCR 실패:', error);
    throw error;
  }
}

/**
 * OCR 처리 (여러 전략 지원)
 *
 * 전략 설명:
 * - 'google-vision': Google Cloud Vision API만 사용 (가장 빠르고 정확, 1-2초)
 * - 'gemini-only': Gemini만 사용 (중간 속도, 무료, 2-3초)
 * - 'tesseract': Tesseract만 사용 (무료, 느림, 5-10초)
 * - 'race': Google Vision vs Gemini 병렬 경쟁 (가장 빠른 것 채택, 1-2초) ⚡ 추천!
 * - 'hybrid': Google Vision → Tesseract → Gemini 순차 폴백 (8-15초, 느림 ❌)
 *
 * @param base64Image - Base64 인코딩된 이미지 데이터
 * @param language - OCR 언어 (기본값: 'kor+eng')
 * @param strategy - OCR 전략 (기본값: 'race')
 * @returns OCR 결과
 */
export async function extractText(
  base64Image: string,
  language: string = 'kor+eng',
  strategy: OCRStrategy = 'race'
): Promise<OCRResult> {
  console.log(`📋 OCR 전략: ${strategy}`);

  // 1. Google Vision만 사용
  if (strategy === 'google-vision') {
    try {
      return await extractTextWithGoogleVision(base64Image);
    } catch (error) {
      console.error('❌ Google Vision OCR 실패');
      throw error;
    }
  }

  // 2. Tesseract만 사용
  if (strategy === 'tesseract') {
    try {
      return await extractTextWithTesseract(base64Image, language);
    } catch (error) {
      console.error('❌ Tesseract OCR 실패');
      throw error;
    }
  }

  // 3. Gemini만 사용
  if (strategy === 'gemini-only') {
    try {
      return await extractTextWithGemini(base64Image);
    } catch (error) {
      console.error('❌ Gemini OCR 실패');
      throw error;
    }
  }

  // 4. Race 전략 (가장 빠른 추천!): Google Vision vs Gemini 병렬 경쟁
  if (strategy === 'race') {
    const hasGoogleVisionKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (hasGoogleVisionKey) {
      // Google Vision과 Gemini를 동시에 실행, 먼저 완료되는 것 사용
      console.log('🏁 Race 시작: Google Vision vs Gemini');

      try {
        const result = await Promise.race([
          extractTextWithGoogleVision(base64Image),
          extractTextWithGemini(base64Image),
        ]);

        console.log(`🏆 Race 승자: ${result.source}`);
        return result;
      } catch (error) {
        console.error('❌ Race 전략 실패 (둘 다 실패)');
        throw error;
      }
    } else {
      // Google Vision API 키가 없으면 Gemini만 사용
      console.log('⚠️ Google Vision API 키 없음, Gemini만 사용');
      return await extractTextWithGemini(base64Image);
    }
  }

  // 5. Hybrid 전략 (느림, 권장하지 않음): Google Vision → Tesseract → Gemini
  if (strategy === 'hybrid') {
    // 4-1. Google Vision 시도 (가장 빠르고 정확)
    const hasGoogleVisionKey = !!process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (hasGoogleVisionKey) {
      try {
        console.log('🎯 1차: Google Cloud Vision 시도...');
        const googleResult = await extractTextWithGoogleVision(base64Image);

        // 텍스트가 충분히 추출되었으면 성공
        if (googleResult.text.trim().length >= 10) {
          console.log('✅ Google Vision으로 충분한 텍스트 추출');
          return googleResult;
        }

        console.warn('⚠️ Google Vision 결과 부족, Tesseract 시도');
      } catch (googleError) {
        console.warn('⚠️ Google Vision 실패, Tesseract 시도');
      }
    }

    // 4-2. Tesseract 시도 (무료 폴백)
    try {
      console.log('🎯 2차: Tesseract 시도...');
      const tesseractResult = await extractTextWithTesseract(base64Image, language);

      const MIN_CONFIDENCE = 30;
      const MIN_TEXT_LENGTH = 10;

      if (
        tesseractResult.confidence >= MIN_CONFIDENCE &&
        tesseractResult.text.trim().length >= MIN_TEXT_LENGTH
      ) {
        console.log('✅ Tesseract로 충분한 텍스트 추출');
        return tesseractResult;
      }

      console.warn(
        `⚠️ Tesseract 결과 품질 낮음 (신뢰도: ${tesseractResult.confidence.toFixed(2)}%, 길이: ${tesseractResult.text.trim().length}자)`
      );

      // 4-3. Gemini 최종 폴백
      console.log('🎯 3차: Gemini 최종 폴백...');
      try {
        const geminiResult = await extractTextWithGemini(base64Image);
        return geminiResult;
      } catch (geminiError) {
        console.warn('⚠️ Gemini 폴백 실패, Tesseract 결과 사용');
        return tesseractResult;
      }
    } catch (tesseractError) {
      // Tesseract 완전 실패 시 Gemini 최종 시도
      console.error('❌ Tesseract 완전 실패, Gemini 최종 시도');

      try {
        const geminiResult = await extractTextWithGemini(base64Image);
        return geminiResult;
      } catch (geminiError) {
        console.error('❌ 모든 OCR 방법 실패');
        throw new Error('OCR 처리 실패: 모든 OCR 엔진이 실패했습니다.');
      }
    }
  }

  throw new Error(`알 수 없는 OCR 전략: ${strategy}`);
}
