import { NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase';

/**
 * 포트원 결제 검증 API
 *
 * 결제 완료 후 호출하여 실제 결제가 완료되었는지 검증
 *
 * 보안 강화:
 * - 중복 결제 방지: payment_id 유니크 제약으로 이중 처리 방지
 * - 금액 검증: 클라이언트 금액과 포트원 실제 금액 비교
 * - 상태 검증: PAID 상태인 경우에만 처리
 */
export async function POST(req: Request) {
  try {
    const { paymentId, amount, productId, startDate, endDate, days } =
      await req.json();

    // 1. 인증 확인
    const supabase = getSupabaseClient();
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

    // 2. 입력값 검증
    if (!paymentId || !amount || !productId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 3. 중복 결제 방지: 이미 처리된 결제인지 확인
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, user_id')
      .eq('payment_id', paymentId)
      .single();

    if (existingPayment) {
      // 같은 사용자의 결제이고 성공한 경우 - 이미 처리됨 응답
      if (
        existingPayment.user_id === user.id &&
        existingPayment.status === 'PAID'
      ) {
        console.log('[Payment Verify] 이미 처리된 결제:', paymentId);
        return NextResponse.json({
          success: true,
          message: '이미 처리된 결제입니다.',
          alreadyProcessed: true,
        });
      }
      // 다른 사용자의 결제 ID를 사용하는 경우 - 보안 위반
      if (existingPayment.user_id !== user.id) {
        console.error('[Payment Verify] 결제 ID 도용 시도:', {
          paymentId,
          requestUser: user.id,
          paymentOwner: existingPayment.user_id,
        });
        return NextResponse.json(
          { error: '유효하지 않은 결제입니다.' },
          { status: 403 }
        );
      }
    }

    // 4. 포트원 API로 결제 정보 조회
    const portoneApiSecret = process.env.PORTONE_API_SECRET;
    if (!portoneApiSecret) {
      console.error('[Payment Verify] PORTONE_API_SECRET 미설정');
      return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.portone.io/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${portoneApiSecret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Payment Verify] 포트원 API 조회 실패:', response.status);
      return NextResponse.json(
        { error: '결제 정보 조회 실패' },
        { status: 500 }
      );
    }

    const paymentData = await response.json();

    // 5. 결제 금액 검증 (포트원 V2는 amount.total 형식)
    const actualAmount = paymentData.amount?.total || paymentData.amount;
    if (actualAmount !== amount) {
      console.error('[Payment Verify] 금액 불일치:', {
        expected: amount,
        actual: actualAmount,
      });
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 6. 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      return NextResponse.json(
        { error: '결제가 완료되지 않았습니다.', status: paymentData.status },
        { status: 400 }
      );
    }

    // 7. 결제 내역 DB 저장 (중복 시 업데이트)
    const { error: insertError } = await supabase.from('payments').upsert(
      {
        user_id: user.id,
        payment_id: paymentId,
        product_id: productId,
        amount: amount,
        status: paymentData.status,
        paid_at: new Date().toISOString(),
        start_date: startDate,
        end_date: endDate,
        days: days,
        portone_data: paymentData,
        verified_at: new Date().toISOString(),
      },
      {
        onConflict: 'payment_id',
        ignoreDuplicates: false,
      }
    );

    if (insertError) {
      // 중복 키 에러가 아닌 경우에만 실패 처리
      if (insertError.code !== '23505') {
        console.error('[Payment Verify] DB 저장 실패:', insertError);
        return NextResponse.json(
          { error: '결제 정보 저장 실패' },
          { status: 500 }
        );
      }
      // 중복 키 에러면 이미 웹훅에서 처리된 것
      console.log('[Payment Verify] 웹훅에서 이미 처리된 결제:', paymentId);
    }

    // 8. 프리미엄 기능 활성화
    const expiresAt = endDate || calculateExpiryDate(productId);
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        product_id: productId,
        is_active: true,
        expires_at: expiresAt,
        start_date: startDate,
        end_date: endDate,
        days: days,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('[Payment Verify] 구독 업데이트 실패:', updateError);
      // 결제는 완료되었으므로 에러를 반환하지 않고 로그만 남김
    }

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다.',
      expiresAt,
    });
  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    return NextResponse.json(
      { error: '결제 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 상품별 만료일 계산
 */
function calculateExpiryDate(productId: string): string {
  const now = new Date();

  switch (productId) {
    case 'ad_free_month':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'ad_free_year':
      now.setFullYear(now.getFullYear() + 1);
      break;
    case 'premium_features':
      // 영구 구매
      now.setFullYear(now.getFullYear() + 100);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString();
}
