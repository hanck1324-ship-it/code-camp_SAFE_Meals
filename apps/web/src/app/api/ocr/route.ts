/**
 * Google Vision OCR API 라우트
 *
 * 클라이언트에서 API 키를 노출하지 않고 서버에서 OCR 처리
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// 타입 정의
// ============================================

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      locale?: string;
      description: string;
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

interface OcrRequestBody {
  image: string; // Base64 인코딩된 이미지
}

// ============================================
// POST 핸들러
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. API 키 확인 (서버 환경변수 - 클라이언트에 노출되지 않음)
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      console.error('❌ [OCR API] GOOGLE_VISION_API_KEY가 설정되지 않음');
      return NextResponse.json(
        { error: 'OCR 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 2. 요청 바디 파싱
    const body: OcrRequestBody = await request.json();
    if (!body.image) {
      return NextResponse.json(
        { error: '이미지 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. Base64 헤더 제거
    const base64Data = body.image.includes('base64,')
      ? body.image.split('base64,')[1]
      : body.image;

    console.log(
      `📝 [OCR API] Google Vision API 호출 시작 (이미지 크기: ${(base64Data.length / 1024).toFixed(1)} KB)`
    );

    // 4. Google Vision API 호출
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
                { type: 'TEXT_DETECTION', maxResults: 1 },
                { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
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
      console.error(`❌ [OCR API] Vision API 호출 실패: ${response.status}`);
      return NextResponse.json({ error: 'OCR 처리 실패' }, { status: 500 });
    }

    const data: VisionApiResponse = await response.json();
    const processingTimeMs = Date.now() - startTime;

    // 5. 에러 체크
    if (data.responses[0]?.error) {
      const error = data.responses[0].error;
      console.error(`❌ [OCR API] Vision API 에러: ${error.message}`);
      return NextResponse.json({ error: 'OCR 처리 실패' }, { status: 500 });
    }

    // 6. 결과 추출
    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
    const textAnnotations = data.responses[0]?.textAnnotations;

    const text =
      fullTextAnnotation?.text || textAnnotations?.[0]?.description || '';

    const detectedLanguage =
      fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]
        ?.languageCode ||
      textAnnotations?.[0]?.locale ||
      null;

    const pageConfidence = fullTextAnnotation?.pages?.[0]?.confidence;
    const confidence = calculateConfidence(text, pageConfidence);

    console.log(`✅ [OCR API] 완료 (${processingTimeMs}ms) - ${text.length}자`);

    return NextResponse.json({
      text,
      confidence,
      detectedLanguage,
      processingTimeMs,
    });
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`❌ [OCR API] 예외 발생 (${processingTimeMs}ms):`, error);

    return NextResponse.json(
      { error: 'OCR 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ============================================
// 헬퍼 함수
// ============================================

function calculateConfidence(
  text: string,
  pageConfidence?: number
): 'low' | 'medium' | 'high' {
  if (text.length < 10) {
    return 'low';
  }

  if (pageConfidence !== undefined) {
    if (pageConfidence >= 0.9) return 'high';
    if (pageConfidence >= 0.7) return 'medium';
    return 'low';
  }

  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const hasNumbers = /\d/.test(text);
  const hasKorean = /[가-힣]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (lines.length >= 5 && hasNumbers && (hasKorean || hasEnglish)) {
    return 'high';
  }

  if (lines.length >= 2 && text.length >= 50) {
    return 'medium';
  }

  return 'low';
}
