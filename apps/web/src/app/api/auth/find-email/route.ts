import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 이름 + 전화번호로 이메일 찾기 API
 * POST /api/auth/find-email
 */
export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: '이름과 전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Supabase Admin Client 생성 (서버 사이드에서만 사용 가능)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 전화번호 정규화
    const normalizedPhone = phone.replace(/\D/g, '');

    // 사용자 목록 조회
    const { data: { users }, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('사용자 조회 오류:', listError);
      return NextResponse.json(
        { error: '사용자 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 이름과 전화번호가 일치하는 사용자 찾기
    const matchedUser = users?.find((user) => {
      const userPhone = user.user_metadata?.phone?.replace(/\D/g, '') || '';
      const userName = user.user_metadata?.name || '';
      return userName === name.trim() && userPhone === normalizedPhone;
    });

    if (!matchedUser) {
      return NextResponse.json(
        { error: '일치하는 사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이메일은 인증 완료 후에만 반환
    // 여기서는 사용자가 존재하는지만 확인
    return NextResponse.json({
      success: true,
      userId: matchedUser.id,
      // 이메일은 인증 완료 후 반환
    });
  } catch (error) {
    console.error('이메일 찾기 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 인증 완료 후 이메일 반환 API
 * POST /api/auth/find-email/verify
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 사용자 정보 조회
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(
      userId
    );

    if (error || !user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      email: user.email,
    });
  } catch (error) {
    console.error('이메일 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}



