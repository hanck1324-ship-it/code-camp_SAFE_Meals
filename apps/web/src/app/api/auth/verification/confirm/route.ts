import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 인증번호 확인
    const { data: verification, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 만료 확인
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      // 만료된 코드 삭제
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', verification.id);

      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    // 전화번호로 이메일 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('phone', phone)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용된 인증번호 삭제
    await supabase.from('verification_codes').delete().eq('id', verification.id);

    return NextResponse.json({
      success: true,
      email: profile.email,
    });
  } catch (error) {
    console.error('Error in confirm verification:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
