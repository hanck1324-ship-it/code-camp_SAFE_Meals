import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 등록된 결제 수단 조회 API
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 등록된 결제 수단 조회
    const { data: paymentMethods, error } = await supabase
      .from('registered_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Payment Methods] 조회 실패:', error);
      return NextResponse.json(
        { error: '결제 수단 조회 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentMethods: paymentMethods || [],
    });
  } catch (error) {
    console.error('[Payment Methods] Error:', error);
    return NextResponse.json(
      { error: '결제 수단 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 결제 수단 등록 API
 */
export async function POST(req: Request) {
  try {
    const {
      paymentType,
      billingKey,
      cardNumberMasked,
      cardBrand,
      cardName,
      easyPayProvider,
      easyPayAccount,
      paypalEmail,
      isDefault,
    } = await req.json();

    const supabase = getSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 입력값 검증
    if (!paymentType || !['CARD', 'EASY_PAY', 'PAYPAL'].includes(paymentType)) {
      return NextResponse.json(
        { error: '유효하지 않은 결제 수단 타입입니다.' },
        { status: 400 }
      );
    }

    // 타입별 필수 정보 검증
    if (paymentType === 'CARD' && (!cardNumberMasked || !cardBrand)) {
      return NextResponse.json(
        { error: '카드 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (paymentType === 'EASY_PAY' && !easyPayProvider) {
      return NextResponse.json(
        { error: '간편결제 제공자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (paymentType === 'PAYPAL' && !paypalEmail) {
      return NextResponse.json(
        { error: 'PayPal 계정 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 결제 수단 등록
    const { data: newPaymentMethod, error: insertError } = await supabase
      .from('registered_payment_methods')
      .insert({
        user_id: user.id,
        payment_type: paymentType,
        billing_key: billingKey,
        card_number_masked: cardNumberMasked,
        card_brand: cardBrand,
        card_name: cardName,
        easy_pay_provider: easyPayProvider,
        easy_pay_account: easyPayAccount,
        paypal_email: paypalEmail,
        is_default: isDefault || false,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Payment Methods] 등록 실패:', insertError);
      return NextResponse.json(
        { error: '결제 수단 등록 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '결제 수단이 등록되었습니다.',
      paymentMethod: newPaymentMethod,
    });
  } catch (error) {
    console.error('[Payment Methods] Error:', error);
    return NextResponse.json(
      { error: '결제 수단 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 결제 수단 수정 API (기본 결제 수단 설정, 비활성화 등)
 */
export async function PATCH(req: Request) {
  try {
    const { paymentMethodId, isDefault, isActive } = await req.json();

    const supabase = getSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: '결제 수단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 결제 수단 수정
    const updateData: any = {};
    if (isDefault !== undefined) updateData.is_default = isDefault;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { error: updateError } = await supabase
      .from('registered_payment_methods')
      .update(updateData)
      .eq('id', paymentMethodId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Payment Methods] 수정 실패:', updateError);
      return NextResponse.json(
        { error: '결제 수단 수정 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '결제 수단이 수정되었습니다.',
    });
  } catch (error) {
    console.error('[Payment Methods] Error:', error);
    return NextResponse.json(
      { error: '결제 수단 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 결제 수단 삭제 API
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentMethodId = searchParams.get('id');

    const supabase = getSupabaseClient();

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: '결제 수단 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 결제 수단 삭제
    const { error: deleteError } = await supabase
      .from('registered_payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Payment Methods] 삭제 실패:', deleteError);
      return NextResponse.json(
        { error: '결제 수단 삭제 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '결제 수단이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('[Payment Methods] Error:', error);
    return NextResponse.json(
      { error: '결제 수단 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
