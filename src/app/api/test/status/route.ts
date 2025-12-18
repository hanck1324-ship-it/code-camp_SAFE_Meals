import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 전체 연결 상태 확인 API
 * GET /api/test/status
 * 
 * Supabase와 API 키 모두의 상태를 한 번에 확인합니다.
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    supabase: {
      configured: false,
      connected: false,
      error: null as string | null,
      details: {} as any,
    },
    apiKey: {
      configured: false,
      working: false,
      error: null as string | null,
      details: {} as any,
    },
  };

  // 1. Supabase 테스트
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    results.supabase.configured = !!(supabaseUrl && supabaseKey);

    if (results.supabase.configured) {
      try {
        const supabase = getSupabaseClient();
        const session = await supabase.auth.getSession();
        results.supabase.connected = true;
        results.supabase.details = {
          urlLength: supabaseUrl!.length,
          keyLength: supabaseKey!.length,
          hasSession: !!session.data.session,
        };
      } catch (error: any) {
        results.supabase.connected = false;
        results.supabase.error = error.message;
      }
    } else {
      results.supabase.error = '환경 변수가 설정되지 않았습니다';
    }
  } catch (error: any) {
    results.supabase.error = error.message;
  }

  // 2. API 키 테스트
  try {
    const API_KEY = 'e2d56042ec20418197';
    const RECIPE_ID = 'COOKRCP01';
    const testUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${RECIPE_ID}/json/1/1`;

    results.apiKey.configured = true;

    const startTime = Date.now();
    const response = await fetch(testUrl);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          results.apiKey.working = !!(data[RECIPE_ID] && data[RECIPE_ID].row);
          results.apiKey.details = {
            status: response.status,
            responseTime: `${responseTime}ms`,
            hasData: results.apiKey.working,
          };
        } catch (parseError: any) {
          results.apiKey.working = false;
          results.apiKey.error = `JSON 파싱 실패: ${parseError.message}`;
        }
      } else {
        const text = await response.text();
        results.apiKey.working = false;
        results.apiKey.error = 'API가 JSON을 반환하지 않습니다 (인증키가 유효하지 않을 수 있습니다)';
        results.apiKey.details = {
          status: response.status,
          responseTime: `${responseTime}ms`,
          contentType,
          responsePreview: text.substring(0, 100),
        };
      }
    } else {
      results.apiKey.working = false;
      results.apiKey.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    results.apiKey.working = false;
    results.apiKey.error = error.message;
  }

  // 3. 전체 상태 요약
  const allGood = results.supabase.connected && results.apiKey.working;
  const statusCode = allGood ? 200 : 207; // 207 = Multi-Status

  return NextResponse.json(
    {
      ...results,
      summary: {
        allGood,
        message: allGood
          ? '모든 연결이 정상입니다 ✅'
          : '일부 연결에 문제가 있습니다 ⚠️',
      },
    },
    { status: statusCode }
  );
}

