import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    // 1. 🔐 헤더에서 토큰 추출 및 유저 확인
    // 클라이언트가 보낸 'Authorization: Bearer <token>' 헤더를 확인합니다.
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다. (토큰 없음)' },
        { status: 401 }
      );
    }

    // 🔑 사용자 토큰으로 인증된 Supabase 클라이언트 생성
    // 이렇게 해야 RLS 정책이 적용되어 해당 사용자의 데이터만 조회 가능
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

    // 2. 👤 유저의 알레르기 및 식이제한 정보 가져오기 (Supabase DB)
    // user_allergies 테이블에서 알레르기 코드 조회
    const { data: allergiesData, error: allergiesError } = await supabase
      .from('user_allergies')
      .select('allergy_code')
      .eq('user_id', user.id);

    if (allergiesError) {
      console.error('알레르기 조회 실패:', allergiesError);
    }

    // user_diets 테이블에서 식이제한 코드 조회
    const { data: dietsData, error: dietsError } = await supabase
      .from('user_diets')
      .select('diet_code')
      .eq('user_id', user.id);

    if (dietsError) {
      console.error('식이제한 조회 실패:', dietsError);
    }

    // 알레르기 코드 배열로 변환
    const userAllergies = allergiesData?.map((a) => a.allergy_code) || [];
    // 식이제한 코드 배열로 변환
    const userDiets = dietsData?.map((d) => d.diet_code) || [];
    const dietType = userDiets.length > 0 ? userDiets.join(', ') : 'None';

    // 🔍 디버깅: 사용자 알레르기/식단 정보 로그
    console.log('👤 사용자 ID:', user.id);
    console.log('🚨 알레르기 목록:', userAllergies);
    console.log('🍽️ 식단 목록:', userDiets);
    console.log('📋 dietType:', dietType);

    // 3. 📸 클라이언트에서 보낸 이미지 데이터 받기
    const body = await req.json();
    const { image, language = 'ko' } = body;

    console.log(
      '📸 이미지 수신:',
      image ? `${image.substring(0, 50)}... (${image.length} bytes)` : 'null'
    );

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // file:// URI가 전달된 경우 에러 처리
    if (image.startsWith('file://')) {
      console.error('❌ file:// URI가 전달됨 - Base64로 변환 필요');
      return NextResponse.json(
        {
          success: false,
          message: '이미지 형식이 올바르지 않습니다. Base64로 변환해주세요.',
        },
        { status: 400 }
      );
    }

    // 4. 🤖 Gemini에게 분석 요청 (프롬프트 핵심!)
    // gemini-3-flash-preview: 최신 모델, 무료 티어 사용 가능
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // 알레르기 코드를 사람이 읽을 수 있는 형태로 변환
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

    // 알레르기 코드를 설명이 포함된 형태로 변환
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
- Example: "Peanut Butter Cookies" contains peanut → DANGER for peanut allergy

### CAUTION (주의) - 알레르기 물질 포함 가능성 있음
- Menu item MIGHT contain the allergen (not visible but commonly used)
- Cross-contamination risk is high
- Example: "Fried Chicken" might contain egg (breading) → CAUTION for egg allergy
- Example: "Pad Thai" often contains peanuts → CAUTION for peanut allergy
- Example: "Bulgogi" might contain soy sauce → CAUTION for soy allergy

### SAFE (안전) - 알레르기 물질 없음
- No obvious allergens detected
- No common cross-contamination risks
- Example: "Plain Rice" → SAFE for most allergies
- Example: "Green Salad (no dressing)" → SAFE for most allergies

## Step 3: Dietary Restriction Assessment

Evaluate each menu item against the user's diet type:

### Vegetarian (채식주의자)
- DANGER: Contains meat, poultry, fish, or seafood
- CAUTION: Might contain meat-based broth or hidden meat products
- SAFE: Plant-based only (dairy and eggs allowed)

### Vegan (비건)
- DANGER: Contains ANY animal products (meat, dairy, eggs, honey, etc.)
- CAUTION: Might contain hidden animal products (gelatin, whey, etc.)
- SAFE: 100% plant-based

### Halal (할랄)
- DANGER: Contains pork, alcohol, or non-halal meat
- CAUTION: Might contain non-halal ingredients or cross-contamination
- SAFE: Halal-certified or clearly halal-compliant

### Kosher (코셔)
- DANGER: Contains non-kosher meat, shellfish, or mixing dairy with meat
- CAUTION: Might not meet kosher certification standards
- SAFE: Kosher-compliant

### Gluten-Free (글루텐 프리)
- DANGER: Contains wheat, barley, rye, or gluten-containing grains
- CAUTION: Might contain hidden gluten or cross-contamination
- SAFE: No gluten-containing ingredients

## Step 4: Combined Safety Status

For each menu item, determine the FINAL safety_status:
1. If EITHER allergy risk OR diet risk is DANGER → safety_status = "DANGER"
2. Else if EITHER is CAUTION → safety_status = "CAUTION"
3. Else if BOTH are SAFE → safety_status = "SAFE"

## Step 5: Reason Explanation

Provide a CLEAR and SPECIFIC reason in the target language:
- DANGER: "새우가 포함되어 있습니다 (갑각류 알레르기)" / "돼지고기가 포함되어 있습니다 (할랄 식단)"
- CAUTION: "계란이 포함될 수 있습니다 (튀김옷)" / "육수에 고기가 들어갈 수 있습니다 (채식주의)"
- SAFE: "알레르기 물질이 없습니다" / "식단에 적합합니다"

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
      "reason": "specific reason in ${language} (e.g., '새우가 포함되어 있습니다')",
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

# Overall Status Rules
- overall_status = "DANGER" if ANY menu item is DANGER
- overall_status = "CAUTION" if ANY menu item is CAUTION (and none are DANGER)
- overall_status = "SAFE" if ALL menu items are SAFE

# Critical Requirements
1. Be STRICT and CONSERVATIVE - err on the side of caution
2. If uncertain, use CAUTION (never assume SAFE when unsure)
3. Provide SPECIFIC reasons (e.g., "Contains eggs" not "May contain allergens")
4. Translate ALL text to the target language (${language})
5. Return ONLY valid JSON (no markdown, no extra text)
    `;

    // 🔍 디버깅: 프롬프트에 전달되는 사용자 컨텍스트 확인
    console.log('📝 프롬프트 User Context:');
    console.log(
      `   - Allergies (raw codes): ${userAllergies.length > 0 ? userAllergies.join(', ') : 'None'}`
    );
    console.log(
      `   - Allergies (descriptions): ${allergyDescriptions.length > 0 ? allergyDescriptions.join(', ') : 'None'}`
    );
    console.log(`   - Diet Type: ${dietType}`);
    console.log(`   - Language: ${language}`);

    // 이미지 데이터 처리 (Base64 헤더 제거)
    // 예: "data:image/jpeg;base64,/9j/..." -> "/9j/..."
    const base64Data = image.includes('base64,')
      ? image.split('base64,')[1]
      : image;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };

    console.log('🤖 Gemini API 호출 시작...');
    const startTime = Date.now();

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Gemini API 응답 완료 (${elapsedTime}초)`);

    // JSON 파싱 (AI가 가끔 ```json ... ``` 을 붙일 때가 있어서 처리)
    const cleanedText = text.replace(/```json|```/g, '').trim();

    let analysisData;
    try {
      analysisData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('JSON 파싱 에러:', text);
      return NextResponse.json(
        {
          success: false,
          message: 'AI 분석 결과를 처리하는 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    // 5. ✅ 결과 반환
    return NextResponse.json({
      success: true,
      analyzed_at: new Date().toISOString(),
      user_context: {
        allergies: userAllergies,
        diet: dietType,
      },
      overall_status: analysisData.overall_status || 'SAFE',
      results: analysisData.results,
    });
  } catch (error: any) {
    console.error('Menu Analysis Error:', error);

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
