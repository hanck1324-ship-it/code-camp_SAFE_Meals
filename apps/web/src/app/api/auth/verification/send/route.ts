import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 이름과 전화번호로 사용자 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('phone', phone)
      .eq('name', name)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '일치하는 사용자 정보가 없습니다.' },
        { status: 404 }
      );
    }

    // 6자리 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 인증번호 저장 (3분 만료)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3);

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting verification code:', insertError);
      return NextResponse.json(
        { error: '인증번호 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 개발 환경에서는 콘솔에 출력 (실제로는 SMS 발송)
    console.log(`📱 SMS Verification Code for ${phone}: ${code}`);
    console.log(`📝 Name: ${name}`);
    console.log(`⏰ Expires at: ${expiresAt.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: '인증번호가 전송되었습니다.',
    });
  } catch (error) {
    console.error('Error in send verification:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
