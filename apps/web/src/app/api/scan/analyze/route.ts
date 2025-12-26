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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 2. 👤 유저의 알레르기 정보 가져오기 (Supabase DB)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('allergies, custom_keywords, diet_type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('프로필 조회 실패:', profileError);
      // 프로필이 없어도 분석은 진행하되, 알레르기 정보 없이 진행
    }

    // 알레르기 목록 합치기 (기본 선택 + 직접 입력)
    const userAllergies = [
      ...(profile?.allergies || []),
      ...(profile?.custom_keywords || [])
    ];
    const dietType = profile?.diet_type || 'None';

    // 3. 📸 클라이언트에서 보낸 이미지 데이터 받기
    const body = await req.json();
    const { image, language = 'ko' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 4. 🤖 Gemini에게 분석 요청 (프롬프트 핵심!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

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
        { success: false, message: 'AI 분석 결과를 처리하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 5. ✅ 결과 반환
    return NextResponse.json({
      success: true,
      analyzed_at: new Date().toISOString(),
      user_context: { 
        allergies: userAllergies, 
        diet: dietType 
      },
      results: analysisData.results
    });

  } catch (error: any) {
    console.error('Menu Analysis Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || '분석 중 알 수 없는 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}