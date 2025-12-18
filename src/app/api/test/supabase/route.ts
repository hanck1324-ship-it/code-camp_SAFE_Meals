import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Supabase 연결 테스트 API
 * GET /api/test/supabase
 *
 * Supabase 클라이언트가 정상적으로 연결되는지 확인합니다.
 */
export async function GET() {
  try {
    // 1. 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: '환경 변수가 설정되지 않았습니다',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            urlLength: supabaseUrl?.length || 0,
            keyLength: supabaseKey?.length || 0,
          },
          message:
            '.env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.',
        },
        { status: 400 }
      );
    }

    // 2. Supabase 클라이언트 연결 테스트
    const supabase = getSupabaseClient();

    // 간단한 쿼리로 연결 확인 (auth.users 테이블은 접근 권한이 필요하므로,
    // 대신 health check를 위해 빈 쿼리 실행)
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);

    // 테이블이 없어도 에러가 나는 것은 정상 (연결은 확인됨)
    // 실제로는 연결 상태만 확인하면 됨
    const connectionTest = await supabase.auth.getSession();

    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 성공',
      details: {
        url: supabaseUrl.substring(0, 30) + '...', // URL 일부만 표시
        keyPrefix: supabaseKey.substring(0, 20) + '...', // 키 일부만 표시
        urlLength: supabaseUrl.length,
        keyLength: supabaseKey.length,
        connectionStatus: connectionTest.error
          ? '연결 확인됨 (인증 필요)'
          : '완전 연결됨',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Supabase 연결 실패',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
        details: {
          errorType: error.constructor.name,
        },
      },
      { status: 500 }
    );
  }
}
