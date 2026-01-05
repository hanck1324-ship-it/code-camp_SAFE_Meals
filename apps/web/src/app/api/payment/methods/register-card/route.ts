import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 카드 등록 API (빌링키 발급)
 * PortOne의 빌링키 발급 후 카드 정보를 저장합니다.
 */
export async function POST(req: Request) {
  try {
    const { billingKey, cardInfo } = await req.json();

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
    if (!billingKey || !cardInfo) {
      return NextResponse.json(
        { error: '카드 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // PortOne API로 빌링키 유효성 확인
    const portoneApiSecret = process.env.PORTONE_API_SECRET;
    if (!portoneApiSecret) {
      console.error('[Card Register] PORTONE_API_SECRET 미설정');
      return NextResponse.json(
        { error: '서버 설정 오류' },
        { status: 500 }
      );
    }

    // 타임아웃 설정 (5초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let billingKeyData;
    try {
      const verifyResponse = await fetch(
        `https://api.portone.io/v2/billing-keys/${billingKey}`,
        {
          headers: {
            'Authorization': `PortOne ${portoneApiSecret}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!verifyResponse.ok) {
        console.error('[Card Register] 빌링키 검증 실패:', verifyResponse.status);
        return NextResponse.json(
          { error: '카드 정보 검증 실패' },
          { status: 400 }
        );
      }

      billingKeyData = await verifyResponse.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('[Card Register] 빌링키 검증 타임아웃');
        return NextResponse.json(
          { error: '결제 서버 응답 시간 초과' },
          { status: 504 }
        );
      }
      throw error;
    }

    // 카드 정보 추출
    const { card } = billingKeyData;
    if (!card) {
      return NextResponse.json(
        { error: '카드 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 최적화: 기존 결제 수단 존재 여부만 확인 (count 대신 exists 사용)
    const { data: existingMethods, error: checkError } = await supabase
      .from('registered_payment_methods')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('[Card Register] 기존 결제 수단 확인 실패:', checkError);
    }

    const isFirstPaymentMethod = !existingMethods;

    // 카드 정보를 DB에 저장
    const { data: newCard, error: insertError } = await supabase
      .from('registered_payment_methods')
      .insert({
        user_id: user.id,
        payment_type: 'CARD',
        billing_key: billingKey,
        card_number_masked: `**** **** **** ${card.number?.slice(-4) || '****'}`,
        card_brand: card.brand || cardInfo.cardBrand || 'UNKNOWN',
        card_name: cardInfo.cardName || `${card.brand || 'Card'} ${card.type || ''}`.trim(),
        is_default: isFirstPaymentMethod, // 첫 번째 결제 수단은 자동으로 기본으로 설정
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Card Register] DB 저장 실패:', insertError);
      return NextResponse.json(
        { error: '카드 등록 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '카드가 등록되었습니다.',
      paymentMethod: newCard,
    });
  } catch (error) {
    console.error('[Card Register] Error:', error);
    return NextResponse.json(
      { error: '카드 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
