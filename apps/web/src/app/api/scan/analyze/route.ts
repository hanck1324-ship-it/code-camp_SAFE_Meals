import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import {
  generateJobId,
  createPendingJob,
  completeJob,
  failJob,
  performQuickAnalysis,
  mergeQuickAndGemini,
  ALLERGY_CODE_TO_LABEL,
  type SafetyLevel,
  type ScanTimings,
  type QuickResult,
  type FinalResult,
  type PartialResponse,
  type FinalResponse,
  type ConfidenceLevel,
} from '@/utils/scan-job-manager';
import { extractTextFromImage, cleanMenuText } from '@/utils/google-vision-ocr';

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

  console.log('\n' + '='.repeat(60));
  console.log('🚀 [ScanAnalyze] 요청 수신 - PARTIAL/FINAL 패턴');
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
    const body = await req.json();
    timings.parseMs = Date.now() - parseStartTime;

    const { image, language = 'ko' } = body;

    // 📊 실제 요청 바디 크기 분석
    const imageSize = image ? new TextEncoder().encode(image).length : 0;
    console.log(
      `📦 [Performance] 이미지 크기: ${(imageSize / 1024).toFixed(2)} KB (JSON 파싱: ${timings.parseMs}ms)`
    );

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    if (image.startsWith('file://')) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지 형식이 올바르지 않습니다. Base64로 변환해주세요.',
        },
        { status: 400 }
      );
    }

    // 4. 🔍 OCR 처리 (필수 대기) - Google Vision API
    // OCR 텍스트가 나와야 룰/DB 1차 판정이 가능
    console.log('📝 [OCR] Google Vision OCR 시작...');
    const ocrStartTime = Date.now();

    // 이미지 데이터 처리 (Base64 헤더 제거)
    const base64Data = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

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
      ocrConfidence,
      ocrFailed // OCR 실패 플래그 전달
    );
    timings.quickMs = Date.now() - quickStartTime;
    console.log(
      `⚡ [Quick] 1차 판정 완료 (${timings.quickMs}ms) - Level: ${quickResult.level}`
    );

    // 5-2. Gemini Promise 생성 (아직 await 하지 않음)
    const geminiStartTime = Date.now();
    const geminiPromise = callGeminiAnalysis(
      imagePart,
      userAllergies,
      userDiets,
      dietType,
      language,
      supabase
    );

    // 5-3. 타임아웃 Promise
    const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
      setTimeout(() => resolve({ timeout: true }), GEMINI_TIMEOUT_MS);
    });

    // 6. 🏁 Promise.race - Gemini vs 타임아웃
    console.log(
      `⏱️ [Race] Gemini vs 타임아웃 (${GEMINI_TIMEOUT_MS}ms) 경쟁 시작`
    );

    // Gemini 에러도 race에 포함시켜 처리
    const raceResult = await Promise.race([
      geminiPromise
        .then((result) => ({ timeout: false, error: false, result }))
        .catch((error) => ({
          timeout: false,
          error: true,
          errorMessage: String(error),
        })),
      timeoutPromise.then(() => ({ timeout: true, error: false })),
    ]);

    // 7. 결과에 따른 응답 분기
    // 7-1. Gemini 에러 발생 시 → quickResult만으로 PARTIAL 응답
    if ('error' in raceResult && raceResult.error) {
      console.error('❌ [Race] Gemini 에러 발생, quickResult로 응답');
      console.error(`   에러: ${(raceResult as any).errorMessage}`);

      timings.totalMs = Date.now() - serverStartTime;

      // 429 에러인지 확인
      const errorMessage = (raceResult as any).errorMessage || '';
      const isQuotaError =
        errorMessage.includes('429') || errorMessage.includes('quota');

      // OCR + Gemini 둘 다 실패한 경우 특별 처리
      const bothApisFailed = ocrFailed && isQuotaError;

      let userMessage: string;
      let errorType: string;

      if (bothApisFailed) {
        userMessage =
          'AI 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
        errorType = 'ALL_APIS_FAILED';
      } else if (ocrFailed) {
        userMessage =
          '텍스트 인식 서비스에 문제가 있습니다. AI 분석 결과를 기다려주세요.';
        errorType = 'OCR_FAILED';
      } else if (isQuotaError) {
        userMessage =
          'AI 분석 서비스가 일시적으로 제한되어 1차 분석 결과만 제공합니다.';
        errorType = 'QUOTA_EXCEEDED';
      } else {
        userMessage = 'AI 분석 중 오류가 발생하여 1차 분석 결과만 제공합니다.';
        errorType = 'GEMINI_ERROR';
      }

      return NextResponse.json(
        {
          success: !bothApisFailed, // 둘 다 실패하면 success: false
          status: 'PARTIAL',
          jobId: null, // Gemini 실패로 백그라운드 작업 없음
          quickResult,
          analyzed_at: new Date().toISOString(),
          user_context: { allergies: userAllergies, diet: dietType },
          overall_status: quickResult.level,
          message: userMessage,
          timings: {
            ocrMs: timings.ocrMs,
            quickMs: timings.quickMs,
            totalMs: timings.totalMs,
          },
          _performance: {
            server_total_ms: timings.totalMs,
            parse_ms: timings.parseMs,
            ocr_ms: timings.ocrMs,
            quick_ms: timings.quickMs,
          },
          _error: {
            type: errorType,
            ocrFailed,
            geminiFailed: true,
            message: errorMessage.substring(0, 200),
          },
        },
        {
          headers: {
            'Server-Timing': buildServerTimingHeader(timings),
          },
        }
      );
    }

    // 7-2. Gemini 타임아웃 내 성공
    if (!raceResult.timeout && 'result' in raceResult) {
      // ✅ Gemini가 타임아웃 내 완료 → FINAL 응답
      console.log('🎉 [Race] Gemini 승리! FINAL 응답 반환');

      const geminiResult = (
        raceResult as { timeout: false; error: false; result: any }
      ).result;
      timings.geminiMs = Date.now() - geminiStartTime;
      timings.totalMs = Date.now() - serverStartTime;
      // 📊 Gemini에서 반환된 추가 계측 데이터 기록
      timings.dbVerifyMs = geminiResult.dbVerifyMs;
      timings.promptChars = geminiResult.promptChars;

      const finalResult = mergeQuickAndGemini(quickResult, geminiResult);

      console.log(`\n📊 [Performance] 서버 처리 시간 요약 (FINAL):`);
      console.log(`   - JSON 파싱: ${timings.parseMs}ms`);
      console.log(`   - OCR 준비: ${timings.ocrMs}ms`);
      console.log(`   - 1차 판정: ${timings.quickMs}ms`);
      console.log(`   - Gemini AI: ${timings.geminiMs}ms`);
      console.log(`   - DB 검증: ${timings.dbVerifyMs}ms`);
      console.log(`   - 프롬프트 길이: ${timings.promptChars}자`);
      console.log(`   - OCR 텍스트 길이: ${timings.ocrTextChars}자`);
      console.log(`   - 총합: ${timings.totalMs}ms\n`);

      const response: FinalResponse = {
        status: 'FINAL',
        jobId: null,
        result: finalResult,
        timings: {
          ocrMs: timings.ocrMs,
          quickMs: timings.quickMs,
          geminiMs: timings.geminiMs,
          dbVerifyMs: timings.dbVerifyMs,
          totalMs: timings.totalMs,
          ocrTextChars: timings.ocrTextChars,
          promptChars: timings.promptChars,
        },
      };

      return NextResponse.json(
        {
          success: true,
          ...response,
          // 기존 응답 호환성 유지
          analyzed_at: new Date().toISOString(),
          user_context: { allergies: userAllergies, diet: dietType },
          overall_status: geminiResult.overall_status,
          results: geminiResult.results,
          db_enhanced: geminiResult.db_enhanced,
          _performance: {
            server_total_ms: timings.totalMs,
            gemini_ms: timings.geminiMs,
            db_verify_ms: timings.dbVerifyMs,
            parse_ms: timings.parseMs,
            ocr_ms: timings.ocrMs,
            quick_ms: timings.quickMs,
            ocr_text_chars: timings.ocrTextChars,
            prompt_chars: timings.promptChars,
          },
        },
        {
          headers: {
            'Server-Timing': buildServerTimingHeader(timings),
          },
        }
      );
    }

    // ⏰ 타임아웃 → PARTIAL 응답 + 백그라운드 처리
    console.log('⏰ [Race] 타임아웃 승리! PARTIAL 응답 반환');

    timings.waitedForGeminiMs = GEMINI_TIMEOUT_MS;
    timings.totalMs = Date.now() - serverStartTime;

    // jobId 생성 및 PENDING 상태 저장
    const jobId = generateJobId();
    await createPendingJob(jobId, quickResult, timings);

    console.log(`📝 [Job] 생성됨 - jobId=${jobId}`);
    console.log(`\n📊 [Performance] 서버 처리 시간 요약 (PARTIAL):`);
    console.log(`   - JSON 파싱: ${timings.parseMs}ms`);
    console.log(`   - OCR 준비: ${timings.ocrMs}ms`);
    console.log(`   - OCR 텍스트 길이: ${timings.ocrTextChars}자`);
    console.log(`   - 1차 판정: ${timings.quickMs}ms`);
    console.log(`   - Gemini 대기: ${timings.waitedForGeminiMs}ms (타임아웃)`);
    console.log(`   - 총합: ${timings.totalMs}ms\n`);

    const partialResponse: PartialResponse = {
      status: 'PARTIAL',
      jobId,
      quickResult,
      timings: {
        ocrMs: timings.ocrMs,
        quickMs: timings.quickMs,
        waitedForGeminiMs: timings.waitedForGeminiMs,
        totalMs: timings.totalMs,
        ocrTextChars: timings.ocrTextChars,
      },
    };

    // 8. 🔥 백그라운드 작업 (fire-and-forget)
    // WARNING: 서버리스 환경에서는 응답 후 실행이 보장되지 않을 수 있음
    // prod 환경에서는 Redis/큐(Inngest, BullMQ) 권장
    // Next.js 14에서는 after() API 미지원 (15+부터 사용 가능)
    // Vercel Edge Runtime 사용 시: waitUntil() 권장
    geminiPromise
      .then(async (geminiResult) => {
        const geminiCompleteTime = Date.now();
        const backgroundTimings: ScanTimings = {
          ...timings,
          geminiMs: geminiCompleteTime - geminiStartTime,
          dbVerifyMs: geminiResult.dbVerifyMs,
          promptChars: geminiResult.promptChars,
          totalMs: geminiCompleteTime - serverStartTime,
        };

        console.log(`\n🔄 [Background] Gemini 완료 - jobId=${jobId}`);
        console.log(
          `   - Gemini 소요: ${backgroundTimings.geminiMs}ms (응답 후 ${backgroundTimings.geminiMs! - GEMINI_TIMEOUT_MS}ms 추가 소요)`
        );
        console.log(`   - DB 검증: ${backgroundTimings.dbVerifyMs}ms`);
        console.log(`   - 프롬프트 길이: ${backgroundTimings.promptChars}자`);

        const finalResult = mergeQuickAndGemini(quickResult, geminiResult);
        await completeJob(jobId, finalResult, backgroundTimings);

        console.log(`✅ [Background] Job 완료 저장 - jobId=${jobId}`);
      })
      .catch(async (error) => {
        console.error(`❌ [Background] Gemini 에러 - jobId=${jobId}:`, error);
        await failJob(jobId, String(error), timings);
      });

    // PARTIAL 응답 반환
    return NextResponse.json(
      {
        success: true,
        ...partialResponse,
        analyzed_at: new Date().toISOString(),
        user_context: { allergies: userAllergies, diet: dietType },
        // PARTIAL 응답에서는 quickResult의 level을 overall_status로 사용
        overall_status: quickResult.level,
        _performance: {
          server_total_ms: timings.totalMs,
          parse_ms: timings.parseMs,
          ocr_ms: timings.ocrMs,
          ocr_text_chars: timings.ocrTextChars,
          quick_ms: timings.quickMs,
          waited_for_gemini_ms: timings.waitedForGeminiMs,
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
// Gemini 분석 호출 함수
// ============================================

/**
 * Gemini AI 분석 호출
 */
async function callGeminiAnalysis(
  imagePart: { inlineData: { data: string; mimeType: string } },
  userAllergies: string[],
  userDiets: string[],
  dietType: string,
  language: string,
  supabase: any
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
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  // 알레르기 코드를 설명이 포함된 형태로 변환
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

  const allergyDescriptions = userAllergies.map(
    (code) => allergyCodeToLabel[code] || code
  );

  const prompt = `
You are a strict food safety and dietary compliance expert. Analyze this menu image and assess safety based on the user's allergies and dietary restrictions.

# User Context
- Allergies: ${allergyDescriptions.length > 0 ? allergyDescriptions.join(', ') : 'None'}
- Diet Type: ${dietType}
- Target Language: ${language}

# CRITICAL: User has these specific allergies that MUST be checked:
${allergyDescriptions.length > 0 ? allergyDescriptions.map((a) => `  - ${a}`).join('\n') : '  - No allergies specified'}

# Task Instructions

## Step 1: Menu Item Identification
1. Identify ALL menu items visible in the image
2. Extract the original menu name (as shown in image)
3. Translate the name to the target language (${language})
4. Detect visible ingredients from the image or menu description

## Step 2: Allergy Risk Assessment

Evaluate each menu item against the user's allergies using these strict criteria:

### DANGER (위험) - 확실히 알레르기 물질 포함
- Menu item DEFINITELY contains the allergen as a main ingredient
- Example: "Shrimp Fried Rice" contains shrimp → DANGER for shellfish allergy
- Example: "Cheese Pizza" contains cheese → DANGER for milk allergy

### CAUTION (주의) - 알레르기 물질 포함 가능성 있음
- Menu item MIGHT contain the allergen (not visible but commonly used)
- Cross-contamination risk is high
- Example: "Fried Chicken" might contain egg (breading) → CAUTION for egg allergy

### SAFE (안전) - 알레르기 물질 없음
- No obvious allergens detected
- No common cross-contamination risks

## Step 3: Dietary Restriction Assessment

Evaluate each menu item against the user's diet type.

## Step 4: Combined Safety Status

For each menu item, determine the FINAL safety_status:
1. If EITHER allergy risk OR diet risk is DANGER → safety_status = "DANGER"
2. Else if EITHER is CAUTION → safety_status = "CAUTION"
3. Else if BOTH are SAFE → safety_status = "SAFE"

# Output Format

Return ONLY a valid JSON object (NO markdown formatting, NO \`\`\`json wrapper):

{
  "overall_status": "SAFE" | "CAUTION" | "DANGER",
  "results": [
    {
      "id": "1",
      "original_name": "menu name in image",
      "translated_name": "translated name in ${language}",
      "description": "brief description in ${language}",
      "safety_status": "SAFE" | "CAUTION" | "DANGER",
      "reason": "specific reason in ${language}",
      "ingredients": ["detected", "ingredients", "list"],
      "allergy_risk": {
        "status": "SAFE" | "CAUTION" | "DANGER",
        "matched_allergens": ["eggs", "milk"] or []
      },
      "diet_risk": {
        "status": "SAFE" | "CAUTION" | "DANGER",
        "violations": ["contains meat"] or []
      }
    }
  ]
}

# Critical Requirements
1. Be STRICT and CONSERVATIVE - err on the side of caution
2. If uncertain, use CAUTION (never assume SAFE when unsure)
3. Provide SPECIFIC reasons
4. Translate ALL text to the target language (${language})
5. Return ONLY valid JSON (no markdown, no extra text)
`;

  // 📊 프롬프트 글자 수 기록
  const promptChars = prompt.length;
  console.log(`📊 [Performance] 프롬프트 길이: ${promptChars}자`);

  console.log('🤖 [Gemini] API 호출 시작...');
  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();
  console.log('✅ [Gemini] API 응답 수신');

  // JSON 파싱
  const cleanedText = text.replace(/```json|```/g, '').trim();
  let analysisData;

  try {
    analysisData = JSON.parse(cleanedText);
  } catch (e) {
    console.error('❌ [Gemini] JSON 파싱 에러:', text.substring(0, 200));
    throw new Error('AI 분석 결과를 처리하는 중 오류가 발생했습니다.');
  }

  // DB 검증으로 알레르기 위험도 강화
  console.log('🔍 [DB] 재료 DB로 알레르기 검증 시작...');
  const dbVerifyStartTime = Date.now();

  const enhancedResults = await Promise.all(
    analysisData.results.map(async (menuItem: any) => {
      const ingredients = menuItem.ingredients || [];

      if (ingredients.length === 0 || userAllergies.length === 0) {
        return menuItem;
      }

      // DB에서 각 재료의 알레르기 위험도 확인
      const dbAllergenChecks = await Promise.all(
        ingredients.map(async (ingredient: string) => {
          try {
            const { data, error } = await supabase.rpc(
              'check_ingredient_allergens',
              {
                ingredient_name: ingredient,
                user_allergens: userAllergies,
              }
            );

            if (error) {
              return {
                ingredient,
                is_dangerous: false,
                matched_allergens: [],
              };
            }

            return {
              ingredient,
              is_dangerous: data?.[0]?.is_dangerous || false,
              matched_allergens: data?.[0]?.matched_allergens || [],
            };
          } catch {
            return { ingredient, is_dangerous: false, matched_allergens: [] };
          }
        })
      );

      // DB에서 발견된 알레르기 물질 수집
      const dbMatchedAllergens = dbAllergenChecks
        .filter((check) => check.is_dangerous)
        .flatMap((check) => check.matched_allergens);

      // AI 분석 결과와 DB 결과 병합
      const aiMatchedAllergens = menuItem.allergy_risk?.matched_allergens || [];
      const combinedMatchedAllergens = Array.from(
        new Set([...aiMatchedAllergens, ...dbMatchedAllergens])
      );

      // DB에서 새로운 알레르기가 발견된 경우 위험도 상향 조정
      let updatedSafetyStatus = menuItem.safety_status;
      let updatedReason = menuItem.reason;

      if (dbMatchedAllergens.length > 0) {
        if (menuItem.safety_status === 'SAFE') {
          updatedSafetyStatus = 'CAUTION';
          const dbAllergenNames = dbMatchedAllergens
            .map((code: string) => ALLERGY_CODE_TO_LABEL[code] || code)
            .join(', ');
          updatedReason = `${menuItem.reason} (DB 확인: ${dbAllergenNames} 포함 가능성)`;
        } else if (menuItem.safety_status === 'CAUTION') {
          const confirmedIngredients = dbAllergenChecks.filter(
            (check) => check.is_dangerous
          );
          if (confirmedIngredients.length > 0) {
            updatedSafetyStatus = 'DANGER';
            const confirmedNames = confirmedIngredients
              .map((check) => check.ingredient)
              .join(', ');
            updatedReason = `${confirmedNames} 확인됨 (DB 검증)`;
          }
        }
      }

      return {
        ...menuItem,
        safety_status: updatedSafetyStatus,
        reason: updatedReason,
        allergy_risk: {
          status: updatedSafetyStatus,
          matched_allergens: combinedMatchedAllergens,
        },
        db_verification: {
          checked: true,
          db_matched_allergens: dbMatchedAllergens,
          total_allergen_matches: combinedMatchedAllergens.length,
        },
      };
    })
  );

  // overall_status 재계산
  const hasDanger = enhancedResults.some(
    (item: any) => item.safety_status === 'DANGER'
  );
  const hasCaution = enhancedResults.some(
    (item: any) => item.safety_status === 'CAUTION'
  );
  const finalOverallStatus: SafetyLevel = hasDanger
    ? 'DANGER'
    : hasCaution
      ? 'CAUTION'
      : 'SAFE';

  // 📊 DB 검증 시간 계산
  const dbVerifyMs = Date.now() - dbVerifyStartTime;
  console.log(`✅ [DB] 검증 완료 (${dbVerifyMs}ms) - 최종 상태: ${finalOverallStatus}`);

  return {
    overall_status: finalOverallStatus,
    results: enhancedResults,
    user_context: { allergies: userAllergies, diet: dietType },
    db_enhanced: true,
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
  if (timings.quickMs !== undefined) {
    entries.push(`quick;dur=${timings.quickMs};desc="Quick Analysis"`);
  }
  if (timings.geminiMs !== undefined) {
    entries.push(`gemini;dur=${timings.geminiMs};desc="Gemini AI"`);
  }
  if (timings.dbVerifyMs !== undefined) {
    entries.push(`dbVerify;dur=${timings.dbVerifyMs};desc="DB Allergen Verify"`);
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
