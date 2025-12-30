import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseClient } from '@/lib/supabase'; // 보여주신 파일 import

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();

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
    // gemini-2.5-flash: 최신 모델, 무료 티어 사용 가능
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a strict food safety expert. Analyze this menu image.
      
      User's Allergies: ${userAllergies.length > 0 ? userAllergies.join(', ') : 'None'}
      User's Diet: ${dietType}
      Target Language: ${language}

      Task:
      1. Identify all menu items visible in the image.
      2. Translate names to the target language (${language}).
      3. CRITICAL: Assess safety based strictly on the User's Allergies.
      
      Safety Status Rules:
      - DANGER: Menu item DEFINITELY contains the allergen.
      - CAUTION: Menu item MIGHT contain the allergen or cross-contamination is common.
      - SAFE: No obvious allergens detected.

      Output JSON format:
      {
        "results": [
          {
            "id": "1",
            "original_name": "menu name in image",
            "translated_name": "translated name",
            "description": "brief explanation",
            "safety_status": "SAFE" | "CAUTION" | "DANGER",
            "reason": "Why is it dangerous? (e.g., Contains Shrimp)",
            "ingredients": ["detected", "ingredients"]
          }
        ]
      }
      Return ONLY JSON string without markdown formatting.
    `;

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

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

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
