import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import {
  buildAllergyClassifierPrompt,
  parseStatus as parseQuickStatus,
  ALLERGY_CLASSIFIER_CONFIG,
  RECOMMENDED_MODELS,
  type QuickSafetyStatus,
} from '@/lib/prompts/allergy-classifier.prompt';
import {
  convertSafetyLevel,
  CONFIDENCE_TO_SCORE,
  type SaveScanParams,
  type ScanResultItem,
} from '@/types/scan-history.types';
import { extractTextFromImage, cleanMenuText } from '@/utils/google-vision-ocr';
import { ScanHistoryRepository } from '@/utils/scan-history-repository';
import {
  generateJobId,
  createPendingJob,
  completeJob,
  failJob,
  performQuickAnalysis,
  mergeQuickAndGemini,
  type SafetyLevel,
  type ScanTimings,
  type QuickResult,
  type FinalResult,
  type PartialResponse,
  type FinalResponse,
  type ConfidenceLevel,
} from '@/utils/scan-job-manager';
import { getOptimizedAllergyTokens } from '@/utils/token-optimizer';

import type { Language } from '@/lib/translations';
import type { NextRequest } from 'next/server';

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 타임아웃 설정 (환경 변수로 조정 가능)
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '3000', 10);

/**
 * 메뉴 스캔 분석 API
 *
 * 아키텍처: "룰/DB 1차 판정 + Gemini 병렬, Promise.race로 2~5초 내 부분 결과 먼저 노출"
 *
 * 흐름:
 * 1. OCR 처리 (필수 대기) - 이미지에서 텍스트 추출
 * 2. 룰/DB + Gemini 병렬 처리
 *    - quickPromise: 룰/DB 기반 1차 판정 (빠름, 수백 ms)
 *    - geminiPromise: Gemini AI 호출 (느림, 수초~수십초)
 * 3. Promise.race 타임아웃 처리
 *    - Gemini가 타임아웃 내 완료: FINAL 응답 즉시 반환
 *    - 타임아웃 초과: PARTIAL 응답 반환 + 백그라운드 처리
 */
export async function POST(req: NextRequest) {
  // 📊 성능 계측: 서버 시작 시간 기록
  const serverStartTime = Date.now();
  const timings: ScanTimings = {};

  // 🔀 Content Negotiation: 스트리밍 요청 확인
  const acceptHeader = req.headers.get('Accept') || '';
  const wantsStream = acceptHeader.includes('application/x-ndjson');

  console.log('\n' + '='.repeat(60));
  console.log(
    `🚀 [ScanAnalyze] 요청 수신 - ${wantsStream ? 'STREAMING' : 'PARTIAL/FINAL'} 패턴`
  );
  console.log('='.repeat(60));

  try {
    // 📊 요청 크기 로깅
    const contentLength = req.headers.get('content-length');
    const contentLengthBytes = contentLength ? parseInt(contentLength, 10) : 0;
    console.log(
      `📦 [Performance] 요청 크기: ${contentLengthBytes} bytes (${(contentLengthBytes / 1024).toFixed(2)} KB)`
    );

    // 1. 🔐 헤더에서 토큰 추출 및 유저 확인
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다. (토큰 없음)' },
        { status: 401 }
      );
    }

    // 🔑 사용자 토큰으로 인증된 Supabase 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 토큰으로 유저 정보 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 2. 👤 유저의 알레르기 및 식이제한 정보 가져오기
    const { data: allergiesData } = await supabase
      .from('user_allergies')
      .select('allergy_code')
      .eq('user_id', user.id);

    const { data: dietsData } = await supabase
      .from('user_diets')
      .select('diet_code')
      .eq('user_id', user.id);

    const userAllergies = allergiesData?.map((a) => a.allergy_code) || [];
    const userDiets = dietsData?.map((d) => d.diet_code) || [];
    const dietType = userDiets.length > 0 ? userDiets.join(', ') : 'None';

    console.log('👤 사용자 ID:', user.id);
    console.log('🚨 알레르기 목록:', userAllergies);
    console.log('🍽️ 식단 목록:', userDiets);

    // 3. 📸 클라이언트에서 보낸 이미지 데이터 받기
    const parseStartTime = Date.now();
    const formData = await req.formData();
    const imageFile = formData.get('file') as File | null;
    // 클라이언트에서 언어 정보를 보낼 경우를 대비하여 추가
    const languageInput = (formData.get('language') as string | null) || 'ko';
    const language: Language = ['ko', 'en', 'ja', 'zh', 'es'].includes(
      languageInput
    )
      ? (languageInput as Language)
      : 'ko';

    // 위치 정보 파싱
    let clientLocation: { lat: number; lng: number } | null = null;
    const locationStr = formData.get('location') as string | null;
    if (locationStr) {
      try {
        clientLocation = JSON.parse(locationStr);
        console.log('📍 [Location] 클라이언트 위치 정보:', clientLocation);
      } catch (err) {
        console.warn('⚠️ [Location] 위치 정보 파싱 실패:', err);
      }
    }

    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: '이미지 파일이 없습니다.' },
        { status: 400 }
      );
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const image = Buffer.from(imageBuffer).toString('base64');
    timings.parseMs = Date.now() - parseStartTime;

    // 📊 실제 요청 바디 크기 분석
    const imageSize = imageBuffer.byteLength;
    console.log(
      `📦 [Performance] 이미지 크기: ${(imageSize / 1024).toFixed(2)} KB (FormData 파싱: ${timings.parseMs}ms)`
    );

    // 4. 🔍 OCR 처리 (필수 대기) - Google Vision API
    // OCR 텍스트가 나와야 룰/DB 1차 판정이 가능
    console.log('📝 [OCR] Google Vision OCR 시작...');
    const ocrStartTime = Date.now();

    // 이미지 데이터 처리 (Base64 헤더 제거)
    const base64Data = image; // FormData에서 읽은 raw base64
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };

    // Google Vision OCR 호출
    let ocrText = '';
    let ocrConfidence: ConfidenceLevel = 'medium';
    let detectedLanguage: string | null = null;
    let ocrFailed = false; // OCR API 호출 실패 여부

    try {
      const ocrResult = await extractTextFromImage(image);
      ocrText = cleanMenuText(ocrResult.text);
      ocrConfidence = ocrResult.confidence;
      detectedLanguage = ocrResult.detectedLanguage;
      timings.ocrMs = ocrResult.processingTimeMs;

      console.log(`✅ [OCR] 완료 (${timings.ocrMs}ms)`);
      console.log(`   - 추출된 텍스트: ${ocrText.length}자`);
      console.log(`   - 신뢰도: ${ocrConfidence}`);
      console.log(`   - 감지된 언어: ${detectedLanguage || '알 수 없음'}`);
      // 📊 OCR 텍스트 길이 기록
      timings.ocrTextChars = ocrText.length;
    } catch (ocrError) {
      console.error('❌ [OCR] 실패, Gemini 분석으로 폴백:', ocrError);
      timings.ocrMs = Date.now() - ocrStartTime;
      ocrConfidence = 'low';
      // OCR 실패 플래그 설정
      ocrFailed = true;
      // OCR 실패해도 Gemini는 이미지를 직접 분석할 수 있으므로 계속 진행
    }

    // 5. 🚀 룰/DB + Gemini 병렬 처리
    console.log('🚀 [Parallel] 1차 판정 + Gemini AI 병렬 시작');

    // 5-1. Quick 1차 판정 (즉시 완료)
    const quickStartTime = Date.now();
    const quickResult = performQuickAnalysis(
      ocrText,
      userAllergies,
      userDiets,
      language,
      ocrConfidence,
      ocrFailed // OCR 실패 플래그 전달
    );
    timings.quickMs = Date.now() - quickStartTime;
    console.log(
      `⚡ [Quick] 1차 판정 완료 (${timings.quickMs}ms) - Level: ${quickResult.level}`
    );

    // 5-2. Gemini Promise 생성 (아직 await 하지 않음)
    const geminiStartTime = Date.now();

    // 📊 토큰 최적화 적용 (AI 입력 아이템 수 제한)
    const tokenOptimizeStartTime = Date.now();
    const extractedIngredients = extractIngredientsFromOCR(ocrText);
    const optimizedInput = getOptimizedAllergyTokens(
      userAllergies,
      extractedIngredients
    );
    timings.tokenOptimizeMs = Date.now() - tokenOptimizeStartTime;

    console.log(`⚡ [TokenOptimize] 완료 (${timings.tokenOptimizeMs}ms)`);
    console.log(`   - 원본 재료: ${extractedIngredients.length}개`);
    console.log(
      `   - 최적화된 알레르기: ${optimizedInput.user_allergies.length}개`
    );
    console.log(
      `   - 최적화된 메뉴 토큰: ${optimizedInput.menu_tokens.length}개`
    );
    console.log(`   - 총 아이템 수: ${optimizedInput.item_count}개`);
    console.log(`   - 절삭 여부: ${optimizedInput.was_truncated}`);

    // 🔀 스트리밍 요청인 경우: 빠른 판별기 사용
    if (wantsStream) {
      console.log('⚡ [Streaming] 빠른 판별 스트리밍 모드 시작');
      return handleStreamingResponse(
        serverStartTime,
        imagePart,
        optimizedInput.user_allergies,
        optimizedInput.menu_tokens,
        userAllergies,
        dietType
      );
    }

    // ============================================
    // 🚀 Progressive Enhancement: Fast → Accurate
    // 1) Fast Gemini (텍스트만, 빠른 S/C/D 판정)
    // 2) Accurate Gemini (이미지 포함, 상세 분석)
    // ============================================

    // 5-3. Fast Gemini Promise (텍스트만, 빠름)
    const fastGeminiStartTime = Date.now();
    const fastGeminiPromise = callFastGeminiJudgment(
      optimizedInput.user_allergies,
      optimizedInput.menu_tokens,
      dietType
    );

    // 5-4. Accurate Gemini Promise (이미지 포함, 정확)
    const accurateGeminiStartTime = Date.now();
    const accurateGeminiPromise = callGeminiAnalysis(
      imagePart,
      optimizedInput.user_allergies,
      userDiets,
      dietType,
      language,
      supabase,
      optimizedInput.menu_tokens
    );

    // 5-5. 타임아웃 Promise (Fast용 - 짧은 타임아웃)
    const FAST_TIMEOUT_MS = 1500; // Fast는 1.5초 타임아웃
    const fastTimeoutPromise = new Promise<{ timeout: true }>((resolve) => {
      setTimeout(() => resolve({ timeout: true }), FAST_TIMEOUT_MS);
    });

    // 6. 🏁 Phase 1: Fast Gemini vs 타임아웃
    console.log(`⚡ [Phase1] Fast Gemini vs 타임아웃 (${FAST_TIMEOUT_MS}ms)`);

    const fastRaceResult = await Promise.race([
      fastGeminiPromise
        .then((result) => ({ timeout: false, error: false, result }))
        .catch((error) => ({
          timeout: false,
          error: true,
          errorMessage: String(error),
        })),
      fastTimeoutPromise.then(() => ({ timeout: true, error: false })),
    ]);

    // Fast Gemini 결과 처리
    let fastStatus: SafetyLevel = quickResult.level; // 기본값: 룰 기반 결과
    if (
      !fastRaceResult.timeout &&
      !('error' in fastRaceResult && fastRaceResult.error)
    ) {
      const fastResult = (fastRaceResult as any).result;
      fastStatus = fastResult.overall_status;
      timings.fastGeminiMs = Date.now() - fastGeminiStartTime;
      console.log(
        `⚡ [Phase1] Fast Gemini 완료 (${timings.fastGeminiMs}ms) - ${fastStatus}`
      );
    } else if (fastRaceResult.timeout) {
      timings.fastGeminiMs = FAST_TIMEOUT_MS;
      console.log(`⏰ [Phase1] Fast Gemini 타임아웃, 룰 기반 결과 사용`);
    } else {
      console.log(`❌ [Phase1] Fast Gemini 에러, 룰 기반 결과 사용`);
    }

    // ============================================
    // 🚀 SPEEDUP: Fast 결과 즉시 반환 (Accurate 대기 제거)
    // 기존: Fast 완료 후 Accurate 3초 추가 대기 → TTFR ~5초
    // 개선: Fast 완료 즉시 PARTIAL 반환 → TTFR ~1.8초
    // Accurate는 백그라운드에서 실행, 폴링으로 FINAL 제공
    // ============================================

    timings.totalMs = Date.now() - serverStartTime;

    // jobId 생성 및 PENDING 상태 저장
    const jobId = generateJobId();
    await createPendingJob(jobId, quickResult, timings);

    console.log(`📝 [Job] 생성됨 - jobId=${jobId}`);
    console.log(
      `\n📊 [Performance] 서버 처리 시간 요약 (PARTIAL - Fast 즉시 반환):`
    );
    console.log(`   - JSON 파싱: ${timings.parseMs}ms`);
    console.log(`   - OCR 준비: ${timings.ocrMs}ms`);
    console.log(`   - OCR 텍스트 길이: ${timings.ocrTextChars}자`);
    console.log(`   - 토큰 최적화: ${timings.tokenOptimizeMs}ms`);
    console.log(`   - 1차 판정 (룰): ${timings.quickMs}ms`);
    console.log(`   - Fast Gemini: ${timings.fastGeminiMs}ms`);
    console.log(
      `   - 총합: ${timings.totalMs}ms (Accurate 대기 제거로 ~3초 단축)\n`
    );

    const partialResponse: PartialResponse = {
      status: 'PARTIAL',
      jobId,
      quickResult,
      timings: {
        ocrMs: timings.ocrMs,
        quickMs: timings.quickMs,
        fastGeminiMs: timings.fastGeminiMs,
        totalMs: timings.totalMs,
        ocrTextChars: timings.ocrTextChars,
      },
    };

    // ============================================
    // 🔥 백그라운드 작업: Accurate Gemini 완료 후 Job 저장 + DB 영구 저장
    //
    // ⚠️ 서버리스/엣지 런타임 대응 (38prompts 5-1):
    // - Next.js 15+: after() 또는 unstable_after() 사용 권장
    // - Vercel Edge: waitUntil() 사용 권장
    // - Next.js 14 (현재): 백그라운드 Promise + await 저장
    //
    // 현재 환경 제약:
    // - 응답 반환 후 인스턴스 종료 시 백그라운드 작업 중단 가능
    // - job_id UNIQUE 제약으로 중복 방지 및 추후 재시도 가능
    // - 저장 실패해도 분석 결과는 정상 반환됨
    // ============================================
    accurateGeminiPromise
      .then(async (geminiResult) => {
        const geminiCompleteTime = Date.now();
        const backgroundTimings: ScanTimings = {
          ...timings,
          geminiMs: geminiCompleteTime - accurateGeminiStartTime,
          dbVerifyMs: geminiResult.dbVerifyMs,
          promptChars: geminiResult.promptChars,
          totalMs: geminiCompleteTime - serverStartTime,
        };

        console.log(`\n🔄 [Background] Accurate Gemini 완료 - jobId=${jobId}`);
        console.log(`   - Accurate Gemini: ${backgroundTimings.geminiMs}ms`);
        console.log(`   - DB 검증: ${backgroundTimings.dbVerifyMs}ms`);

        const finalResult = mergeQuickAndGemini(quickResult, geminiResult);
        await completeJob(jobId, finalResult, backgroundTimings);

        console.log(`✅ [Background] Job 완료 저장 - jobId=${jobId}`);

        // ============================================
        // 📦 스캔 이력 영구 저장 (FINAL 상태)
        // - 저장 실패해도 분석 결과에 영향 없음
        // - job_id로 중복 저장 방지
        // ============================================
        try {
          const saveStartTime = Date.now();
          const scanHistoryRepo = new ScanHistoryRepository(supabase);

          // FinalResult → SaveScanParams 변환
          const scanResults: ScanResultItem[] = (finalResult.results || []).map(
            (item: any) => ({
              itemName:
                item.translated_name ||
                item.original_name ||
                item.name ||
                'Unknown',
              safetyLevel: convertSafetyLevel(
                item.safety_status || item.status
              ),
              warningMessage: item.reason || null,
              matchedAllergens:
                item.allergy_risk?.matched_allergens || item.allergens || null,
              matchedDiets:
                item.diet_risk?.violations || item.diet_violations || null,
              confidenceScore:
                CONFIDENCE_TO_SCORE[quickResult.confidence] || 0.7,
            })
          );

          const saveParams: SaveScanParams = {
            userId: user.id,
            jobId: jobId,
            scanType: 'menu',
            imageUrl: null, // imageData가 있으면 Repository에서 Storage에 업로드 후 URL 설정
            imageData: image, // Base64 이미지 데이터 (Storage 업로드용)
            restaurantName: null, // OCR에서 추출 가능하면 추후 추가
            location: clientLocation, // 클라이언트에서 받은 위치 정보
            results: scanResults,
          };

          const saveResult = await scanHistoryRepo.saveScan(saveParams);
          const saveMs = Date.now() - saveStartTime;

          // backgroundTimings에 saveMs 및 imageUploadMs 기록
          backgroundTimings.saveMs = saveMs;
          if (saveResult.imageUploadMs) {
            backgroundTimings.imageUploadMs = saveResult.imageUploadMs;
          }

          if (saveResult.success) {
            console.log(
              `✅ [ScanHistory] 저장 완료 - scanId: ${saveResult.scanId}, results: ${saveResult.resultIds?.length}건 (${saveMs}ms, imageUpload: ${saveResult.imageUploadMs || 0}ms)`
            );
          } else {
            console.log(`⚠️ [ScanHistory] 저장 스킵 - ${saveResult.error}`);
          }
        } catch (saveError) {
          // 저장 실패해도 분석 결과에 영향 없음
          console.error(
            `❌ [ScanHistory] 저장 실패 (분석 결과 영향 없음):`,
            saveError
          );
        }
      })
      .catch(async (error) => {
        console.error(
          `❌ [Background] Accurate Gemini 실패 - jobId=${jobId}:`,
          error
        );
        await failJob(jobId, String(error));
      });

    // 즉시 PARTIAL 응답 반환
    return NextResponse.json(
      {
        success: true,
        ...partialResponse,
        analyzed_at: new Date().toISOString(),
        user_context: { allergies: userAllergies, diet: dietType },
        overall_status: fastStatus,
        fast_status: fastStatus,
        message: '빠른 분석 완료. 상세 분석이 진행 중입니다.',
        _performance: {
          server_total_ms: timings.totalMs,
          parse_ms: timings.parseMs,
          ocr_ms: timings.ocrMs,
          token_optimize_ms: timings.tokenOptimizeMs,
          quick_ms: timings.quickMs,
          fast_gemini_ms: timings.fastGeminiMs,
          ocr_text_chars: timings.ocrTextChars,
          speedup_note: 'Accurate Gemini 3초 대기 제거로 TTFR 단축',
        },
      },
      {
        headers: {
          'Server-Timing': buildServerTimingHeader(timings),
        },
      }
    );
  } catch (error: any) {
    console.error('❌ [ScanAnalyze] Error:', error);

    // 429 할당량 초과 에러 처리
    if (error.status === 429) {
      return NextResponse.json(
        {
          success: false,
          message: '서버가 바쁩니다. 잠시 후 다시 시도해주세요.',
          retry_after: 20,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || '분석 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// ============================================
// Fast Gemini 호출 (빠른 1차 판정용)
// ============================================

/**
 * Fast Gemini 호출 - 빠른 S/C/D 판정
 *
 * 특징:
 * - gemini-2.5-flash-lite 사용 (더 빠름)
 * - 텍스트만 사용 (이미지 제외 → 비전 추론 비용 제거)
 * - 출력: overall_status만 (SAFE/CAUTION/DANGER)
 * - 목표: 0.3~1초 내 응답
 */
async function callFastGeminiJudgment(
  userAllergies: string[],
  menuTokens: string[],
  dietType: string
): Promise<{
  overall_status: SafetyLevel;
  promptChars: number;
}> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      maxOutputTokens: 10,
      temperature: 0,
    },
  });

  const allergyCodes = userAllergies.join(', ') || 'None';
  const tokens = menuTokens.slice(0, 30).join(', ') || 'None';

  const prompt = `Classify food safety. Output ONLY one word: SAFE, CAUTION, or DANGER.

ALLERGIES: ${allergyCodes}
DIET: ${dietType}
MENU_TOKENS: ${tokens}

ALLERGY RULES:
- DANGER: any token matches allergy (direct or ingredient)
- CAUTION: possible hidden allergen or cross-contamination
- SAFE: no allergen detected

DIET RULES:
- vegetarian: DANGER if contains meat/poultry/fish
- vegan: DANGER if contains any animal product
- lacto_vegetarian: DANGER if contains meat/poultry/fish/eggs
- ovo_vegetarian: DANGER if contains meat/poultry/fish/dairy
- pesco_vegetarian: DANGER if contains meat/poultry
- flexitarian: DANGER if contains meat/poultry/fish
- halal: DANGER if contains pork/alcohol
- kosher: DANGER if contains pork/shellfish
- buddhist_vegetarian: DANGER if contains meat/poultry/fish/garlic/onion
- gluten_free: DANGER if contains wheat/gluten
- pork_free: DANGER if contains pork
- alcohol_free: DANGER if contains alcohol
- garlic_onion_free: DANGER if contains garlic/onion

OUTPUT:`;

  const promptChars = prompt.length;
  console.log(`⚡ [FastGemini] 프롬프트: ${promptChars}자`);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text().trim().toUpperCase();

  // 결과 파싱
  let status: SafetyLevel = 'CAUTION';
  if (
    text.includes('SAFE') &&
    !text.includes('DANGER') &&
    !text.includes('CAUTION')
  ) {
    status = 'SAFE';
  } else if (text.includes('DANGER')) {
    status = 'DANGER';
  }

  console.log(`⚡ [FastGemini] 결과: ${status} (raw: ${text})`);

  return { overall_status: status, promptChars };
}

// ============================================
// Accurate Gemini 호출 (정확한 2차 분석용)
// ============================================

/**
 * OCR 텍스트에서 재료 추출 (간단한 토큰화)
 * 쉼표, 줄바꿈, 공백 등으로 분리
 */
function extractIngredientsFromOCR(ocrText: string): string[] {
  if (!ocrText || ocrText.trim().length === 0) {
    return [];
  }

  // 다양한 구분자로 분리 (쉼표, 줄바꿈, 슬래시, 괄호 등)
  const tokens = ocrText
    .split(/[,\n\r/()\[\]|·•\-\t]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 50); // 너무 긴 토큰 제외

  // 추가 정제: 숫자만 있는 토큰 제거, 가격 패턴 제거
  const refined = tokens.filter((t) => {
    // 숫자만 있는 토큰 제거
    if (/^[\d,.\s]+$/.test(t)) return false;
    // 가격 패턴 제거 (₩, $, 원, 등)
    if (/[₩$€¥원]/.test(t)) return false;
    return true;
  });

  return refined;
}

async function callGeminiAnalysis(
  imagePart: { inlineData: { data: string; mimeType: string } },
  userAllergies: string[],
  userDiets: string[],
  dietType: string,
  language: string,
  supabase: any,
  optimizedMenuTokens?: string[]
): Promise<{
  overall_status: SafetyLevel;
  results: any[];
  user_context?: { allergies: string[]; diet: string };
  db_enhanced?: boolean;
  /** 📊 성능 계측: DB 검증 시간 */
  dbVerifyMs?: number;
  /** 📊 성능 계측: 프롬프트 글자 수 */
  promptChars?: number;
}> {
  // ============================================
  // 📊 최적화된 프롬프트 (GPT 피드백 반영)
  // - 반복 제거: 알레르기 정보 1회만 명시
  // - 출력량 감소: description 제거, reason 간략화
  // - 작업 축소: "ALL menu items" 대신 "visible menu items"
  // - responseSchema로 JSON 형식 강제
  // ============================================

  // responseSchema를 활용한 모델 설정
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          overall_status: {
            type: 'string',
            enum: ['SAFE', 'CAUTION', 'DANGER'],
            description: 'Overall safety status for the menu',
          },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                original_name: {
                  type: 'string',
                  description:
                    'Original menu name as shown in the image (in original language)',
                },
                translated_name: {
                  type: 'string',
                  description: 'Menu name translated to user language',
                },
                price: {
                  type: 'string',
                  description:
                    'Price as shown in the image (e.g., "₩15,000", "$10.99", "1,500円"). Empty string if no price visible.',
                },
                status: { type: 'string', enum: ['SAFE', 'CAUTION', 'DANGER'] },
                reason: {
                  type: 'string',
                  description: 'Brief reason (1 sentence)',
                },
                allergens: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Matched allergen codes',
                },
                diet_violations: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Diet restriction violations (e.g., meat for vegetarian)',
                },
              },
              required: [
                'id',
                'original_name',
                'translated_name',
                'price',
                'status',
                'reason',
                'allergens',
                'diet_violations',
              ],
            },
          },
        },
        required: ['overall_status', 'results'],
      } as any,
    },
  });

  // 알레르기 코드만 간단히 (반복 제거)
  const allergyCodes = userAllergies.join(', ') || 'None';
  const menuHints = optimizedMenuTokens?.slice(0, 20).join(', ') || '';

  // ============================================
  // 📝 축소된 프롬프트 (기존 ~3000자 → ~800자)
  // ============================================
  // 식단 제한 규칙 정의
  const dietRules =
    userDiets.length > 0
      ? `
DIET RESTRICTION RULES:
- vegetarian: DANGER if contains meat/poultry/fish/seafood
- vegan: DANGER if contains any animal product (meat/dairy/eggs/honey)
- lacto_vegetarian: DANGER if contains meat/poultry/fish/seafood/eggs
- ovo_vegetarian: DANGER if contains meat/poultry/fish/seafood/dairy
- pesco_vegetarian: DANGER if contains meat/poultry
- flexitarian: DANGER if contains meat/poultry/fish/seafood
- halal: DANGER if contains pork/alcohol
- kosher: DANGER if contains pork/shellfish or mixed meat-dairy
- buddhist_vegetarian: DANGER if contains meat/poultry/fish/seafood/garlic/onion
- gluten_free: DANGER if contains wheat/gluten/flour/pasta/bread
- pork_free: DANGER if contains pork
- alcohol_free: DANGER if contains alcohol
- garlic_onion_free: DANGER if contains garlic/onion`
      : '';

  // 언어 코드를 AI가 이해하기 쉬운 전체 언어 이름으로 변환
  const languageNames: Record<string, string> = {
    ko: 'Korean',
    en: 'English',
    ja: 'Japanese',
    zh: 'Chinese',
    es: 'Spanish',
  };
  const targetLanguage = languageNames[language] || 'English';

  const prompt = `Analyze menu image for food allergies and dietary restrictions.

ALLERGIES: ${allergyCodes}
DIET: ${dietType}
USER_DIETS: ${userDiets.join(', ') || 'None'}
TARGET_LANGUAGE: ${targetLanguage}
${menuHints ? `HINTS: ${menuHints}` : ''}

ALLERGY RULES:
- DANGER: definitely contains allergen
- CAUTION: might contain (hidden ingredient, cross-contamination)
- SAFE: no allergen detected
${dietRules}

GENERAL RULES:
- Check BOTH allergies AND diet restrictions
- Be conservative: if unsure → CAUTION
- original_name: Keep the EXACT menu name as shown in the image (in original language, e.g., Japanese, Chinese, etc.)
- translated_name: Translate menu name to ${targetLanguage}. MUST be in ${targetLanguage}, not English or Korean unless that is the target.
- Keep reason brief (1 sentence, in ${targetLanguage})
- Include diet_violations array for any diet restriction violations`;

  // 📊 프롬프트 글자 수 기록
  const promptChars = prompt.length;
  console.log(`📊 [Performance] 프롬프트 길이: ${promptChars}자 (최적화됨)`);

  console.log('🤖 [Gemini] API 호출 시작...');
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();
  console.log('✅ [Gemini] API 응답 수신');

  // JSON 파싱 (responseSchema 덕분에 안정적)
  let analysisData;
  try {
    analysisData = JSON.parse(text);
  } catch (e) {
    console.error('❌ [Gemini] JSON 파싱 에러:', text.substring(0, 200));
    throw new Error('AI 분석 결과를 처리하는 중 오류가 발생했습니다.');
  }

  // 결과 형식 변환 (기존 인터페이스 호환)
  const convertedResults = (analysisData.results || []).map((item: any) => {
    const dietViolations = item.diet_violations || [];
    // diet_risk 상태 결정: 위반 사항이 있으면 DANGER
    const dietRiskStatus = dietViolations.length > 0 ? 'DANGER' : 'SAFE';

    return {
      id: item.id,
      original_name: item.original_name || item.name || '',
      translated_name: item.translated_name || item.name || '',
      price: item.price || null, // 가격 필드 추가
      description: '',
      safety_status: item.status,
      reason: item.reason,
      ingredients: [],
      allergy_risk: {
        status: item.status,
        matched_allergens: item.allergens || [],
      },
      diet_risk: {
        status: dietRiskStatus,
        violations: dietViolations,
      },
    };
  });

  // DB 검증은 생략 (속도 최적화 - 1차 판정에서 충분)
  // 필요시 백그라운드에서 DB 검증 수행
  const dbVerifyStartTime = Date.now();
  const dbVerifyMs = Date.now() - dbVerifyStartTime;

  // overall_status 계산 (알레르기 + 식단 제한 모두 고려)
  const hasDanger = convertedResults.some(
    (item: any) =>
      item.safety_status === 'DANGER' || item.diet_risk?.status === 'DANGER'
  );
  const hasCaution = convertedResults.some(
    (item: any) => item.safety_status === 'CAUTION'
  );
  const finalOverallStatus: SafetyLevel = hasDanger
    ? 'DANGER'
    : hasCaution
      ? 'CAUTION'
      : 'SAFE';

  console.log(`✅ [Gemini] 분석 완료 - 최종 상태: ${finalOverallStatus}`);

  return {
    overall_status: finalOverallStatus,
    results: convertedResults,
    user_context: { allergies: userAllergies, diet: dietType },
    db_enhanced: false,
    dbVerifyMs,
    promptChars,
  };
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * Server-Timing 헤더 생성
 */
function buildServerTimingHeader(timings: ScanTimings): string {
  const entries: string[] = [];

  if (timings.parseMs !== undefined) {
    entries.push(`parse;dur=${timings.parseMs}`);
  }
  if (timings.ocrMs !== undefined) {
    entries.push(`ocr;dur=${timings.ocrMs};desc="OCR Processing"`);
  }
  if (timings.ocrTextChars !== undefined) {
    entries.push(`ocrChars;dur=${timings.ocrTextChars};desc="OCR Text Chars"`);
  }
  if (timings.tokenOptimizeMs !== undefined) {
    entries.push(
      `tokenOptimize;dur=${timings.tokenOptimizeMs};desc="Token Optimize"`
    );
  }
  if (timings.quickMs !== undefined) {
    entries.push(`quick;dur=${timings.quickMs};desc="Quick Analysis"`);
  }
  if (timings.fastGeminiMs !== undefined) {
    entries.push(`fastGemini;dur=${timings.fastGeminiMs};desc="Fast Gemini"`);
  }
  if (timings.geminiMs !== undefined) {
    entries.push(`gemini;dur=${timings.geminiMs};desc="Gemini AI"`);
  }
  if (timings.dbVerifyMs !== undefined) {
    entries.push(
      `dbVerify;dur=${timings.dbVerifyMs};desc="DB Allergen Verify"`
    );
  }
  if (timings.promptChars !== undefined) {
    entries.push(`promptChars;dur=${timings.promptChars};desc="Prompt Chars"`);
  }
  if (timings.waitedForGeminiMs !== undefined) {
    entries.push(
      `wait;dur=${timings.waitedForGeminiMs};desc="Waited for Gemini"`
    );
  }
  if (timings.totalMs !== undefined) {
    entries.push(`total;dur=${timings.totalMs}`);
  }

  return entries.join(', ');
}

// ============================================
// 스트리밍 응답 핸들러 (빠른 판별용)
// ============================================

/**
 * 스트리밍 응답 핸들러
 *
 * "사고 금지 판별기" 프롬프트로 빠른 S/D 분류 수행
 * NDJSON 형식으로 실시간 스트리밍 응답
 *
 * @see 36prompts.403.ai-output-streaming-optimization.txt
 */
async function handleStreamingResponse(
  startTime: number,
  imagePart: { inlineData: { data: string; mimeType: string } },
  userAllergies: string[],
  menuTokens: string[],
  rawUserAllergies: string[],
  dietType: string
): Promise<Response> {
  console.log('🚀 [Streaming] 빠른 판별 스트리밍 시작');

  // 빠른 분류용 모델 사용 (gemini-2.5-flash-lite)
  const model = genAI.getGenerativeModel({
    model: RECOMMENDED_MODELS.fast,
    generationConfig: {
      maxOutputTokens: 3,
      temperature: 0,
      topP: 1,
      topK: 1,
      stopSequences: ['\n'],
    },
  });

  // 프롬프트 생성
  const prompt = buildAllergyClassifierPrompt(userAllergies, menuTokens);
  console.log(`📝 [Streaming] 프롬프트 생성 완료 (${prompt.length}자)`);

  try {
    // 스트리밍 콘텐츠 생성
    const result = await model.generateContentStream([prompt, imagePart]);

    // NDJSON 스트리밍 응답 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let firstChunkSent = false;
        let accumulated = '';
        let ttftMs: number | null = null;

        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            accumulated += text;

            if (!firstChunkSent) {
              // TTFT(Time To First Token) 측정 - 첫 청크 시점
              ttftMs = Date.now() - startTime;
              console.log(`⚡ [Streaming] TTFT: ${ttftMs}ms`);
              firstChunkSent = true;
            }

            // NDJSON 형식 (프로덕션에서는 accumulated 제외)
            const payload =
              process.env.NODE_ENV === 'development'
                ? { text, accumulated } // 디버그용
                : { text }; // 프로덕션용 (페이로드 최소화)

            controller.enqueue(encoder.encode(JSON.stringify(payload) + '\n'));
          }

          // 최종 결과 전송 (ttft는 첫 청크 시점 값)
          const finalStatus = parseQuickStatus(accumulated.trim());
          const totalMs = Date.now() - startTime;

          console.log(
            `✅ [Streaming] 완료 - 상태: ${finalStatus}, TTFT: ${ttftMs}ms, Total: ${totalMs}ms`
          );

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                status: finalStatus,
                ttft: ttftMs,
                totalMs,
                user_context: { allergies: rawUserAllergies, diet: dietType },
              }) + '\n'
            )
          );
          controller.close();
        } catch (streamError) {
          console.error('❌ [Streaming] 스트림 처리 에러:', streamError);

          // 에러 시 DANGER로 처리 (보수적 안전)
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                status: 'DANGER',
                error: 'Stream processing failed',
                ttft: ttftMs,
              }) + '\n'
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Accel-Buffering': 'no', // Nginx 버퍼링 비활성화
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('❌ [Streaming] 스트림 생성 실패:', error);

    // 에러 시 JSON 응답으로 폴백 (DANGER)
    return new Response(
      JSON.stringify({
        done: true,
        status: 'DANGER',
        error: 'Failed to create stream',
        ttft: null,
      }) + '\n',
      {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
