import { NextResponse } from 'next/server';

import { getSupabaseClient } from '@/lib/supabase';

/**
 * 사용자 결제 내역 조회 API
 */
export async function GET(req: Request) {
  try {
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

    // 2. URL 쿼리 파라미터 처리
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 3. 결제 내역 조회
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('paid_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (paymentsError) {
      console.error('[Payment History] 조회 실패:', paymentsError);
      return NextResponse.json(
        { error: '결제 내역 조회 실패' },
        { status: 500 }
      );
    }

    // 4. 현재 활성 구독 조회
    const { data: activeSubscription, error: subscriptionError } =
      await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      // PGRST116: no rows returned (구독이 없는 경우는 정상)
      console.error('[Payment History] 구독 조회 실패:', subscriptionError);
    }

    return NextResponse.json({
      payments: payments || [],
      activeSubscription: activeSubscription || null,
      total: payments?.length || 0,
    });
  } catch (error) {
    console.error('[Payment History] Error:', error);
    return NextResponse.json(
      { error: '결제 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
