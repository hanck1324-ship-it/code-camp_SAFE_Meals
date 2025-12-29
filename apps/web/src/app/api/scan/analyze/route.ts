import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1. API 키 확인 (서버 크래시 방지)
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: '서버에 Gemini API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. 🔐 인증 토큰 확인
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다. (토큰 없음)' },
        { status: 401 }
      );
    }

    // Supabase 클라이언트 생성 (환경 변수 확인)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 토큰이 포함된 인증된 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 토큰 검증
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 3. 👤 유저 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('allergies, custom_keywords, diet_type')
      .eq('id', user.id)
      .single();

    // Profile 조회 실패 시 기본값 사용
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 (레코드 없음)
      console.error('Profile 조회 오류:', profileError);
    }

    // 알레르기 정보 조합
    const userAllergies = [
      ...(profile?.allergies || []),
      ...(profile?.custom_keywords || [])
    ];
    const dietType = profile?.diet_type || 'None';

    // 4. 📸 이미지 데이터 수신
    const body = await req.json();
    const { image, language = 'ko' } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // 단순화된 이미지 크기 검증 (약 20MB Base64 문자열 길이 기준)
    // Base64 인코딩은 원본 크기의 약 133%이므로, 20MB 이미지는 약 27MB Base64 문자열
    const MAX_BASE64_LENGTH = 28_000_000; // 약 20MB 이미지에 해당
    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { 
          success: false, 
          message: '이미지가 너무 큽니다. 이미지를 압축하거나 해상도를 낮춰주세요.' 
        },
        { status: 400 }
      );
    }

    // 5. 🤖 AI 분석 요청
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
      Return ONLY JSON string without markdown formatting. Do not include \`\`\`json or \`\`\`.
    `;

    // Base64 헤더 제거 및 MIME 타입 추출
    // 모바일 브라우저 호환성: iOS Safari, Android Chrome 모두 지원
    let base64Data: string;
    let mimeType = 'image/jpeg'; // 기본값 (모바일 브라우저 기본 형식)

    if (image.includes('base64,')) {
      const [header, data] = image.split('base64,');
      base64Data = data;
      
      // MIME 타입 추출 (data:image/png;base64, 또는 data:image/jpeg;base64, 형식)
      // iOS Safari: data:image/jpeg;base64, 또는 data:image/png;base64,
      // Android Chrome: data:image/jpeg;base64, 또는 data:image/webp;base64,
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        const extractedMime = mimeMatch[1].trim();
        // 이미지 MIME 타입인지 검증 (보안)
        if (extractedMime.startsWith('image/')) {
          mimeType = extractedMime;
        }
      }
    } else {
      // 헤더가 없는 경우 (순수 Base64)
      // canvas.toDataURL()은 항상 헤더를 포함하므로 이 경우는 드뭅니다
      base64Data = image;
      // 기본값 image/jpeg 사용 (모바일 브라우저에서 가장 호환성이 좋음)
    }

    // Base64 형식 검증
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱 (마크다운 제거 강화)
    const cleanedText = text.replace(/```json|```/g, '').trim();
    
    let analysisData;
    try {
      analysisData = JSON.parse(cleanedText);
    } catch (e) {
      // 에러 로그에는 상세 정보 기록, 클라이언트에는 일반 메시지만 전달
      console.error('AI 응답 파싱 실패:', {
        error: e instanceof Error ? e.message : 'Unknown error',
        textLength: text.length,
        cleanedTextLength: cleanedText.length,
        preview: cleanedText.substring(0, 200), // 처음 200자만 로그
      });
      return NextResponse.json(
        { success: false, message: 'AI 분석 결과를 처리하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analyzed_at: new Date().toISOString(),
      user_context: { 
        allergies: userAllergies, 
        diet: dietType 
      },
      results: analysisData.results || []
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || '서버 내부 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
}