import { createHmac } from 'crypto';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * 포트원 웹훅 API
 *
 * 포트원에서 결제 상태 변경 시 호출됩니다.
 * 웹훅 서명을 검증하여 위조된 요청을 방지합니다.
 *
 * @see https://developers.portone.io/docs/ko/result/webhook
 */

// 환경 변수
const PORTONE_WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 웹훅 서명 검증
 *
 * 포트원 V2 웹훅 서명 방식:
 * - 헤더: webhook-id, webhook-timestamp, webhook-signature
 * - 서명: HMAC-SHA256(webhook-id.webhook-timestamp.body)
 */
function verifyWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  signature: string
): boolean {
  if (!PORTONE_WEBHOOK_SECRET) {
    console.error('[Webhook] PORTONE_WEBHOOK_SECRET 미설정');
    return false;
  }

  // 타임스탬프 검증 (5분 이내)
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - timestamp);

  if (timeDiff > 300) {
    console.error('[Webhook] 타임스탬프 만료:', {
      timestamp,
      now,
      diff: timeDiff,
    });
    return false;
  }

  // 서명 생성 및 비교
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;
  const expectedSignature = createHmac('sha256', PORTONE_WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('base64');

  // v1,signature 형식에서 signature 추출
  const signatures = signature.split(' ').map((s) => {
    const parts = s.split(',');
    return parts.length > 1 ? parts[1] : parts[0];
  });

  const isValid = signatures.some((sig) => sig === expectedSignature);

  if (!isValid) {
    console.error('[Webhook] 서명 불일치:', {
      expected: expectedSignature,
      received: signatures,
    });
  }

  return isValid;
}

/**
 * 포트원 API로 결제 정보 조회
 */
async function getPaymentFromPortone(paymentId: string) {
  if (!PORTONE_API_SECRET) {
    throw new Error('PORTONE_API_SECRET 미설정');
  }

  const response = await fetch(
    `https://api.portone.io/v2/payments/${paymentId}`,
    {
      headers: {
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`포트원 API 오류: ${response.status}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let body: string;

  try {
    body = await req.text();

    // 1. 웹훅 헤더 추출
    const webhookId = req.headers.get('webhook-id') || '';
    const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
    const webhookSignature = req.headers.get('webhook-signature') || '';

    console.log('[Webhook] 수신:', {
      webhookId,
      timestamp: webhookTimestamp,
      bodyLength: body.length,
    });

    // 2. 서명 검증
    if (
      !verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        webhookSignature
      )
    ) {
      console.error('[Webhook] 서명 검증 실패');
      return NextResponse.json({ error: '서명 검증 실패' }, { status: 401 });
    }

    console.log('[Webhook] 서명 검증 성공');

    // 3. 요청 본문 파싱
    const webhookData = JSON.parse(body);
    const { type, data } = webhookData;

    // 4. 이벤트 타입별 처리
    if (type === 'Transaction.Paid') {
      await handlePaymentPaid(data);
    } else if (type === 'Transaction.Cancelled') {
      await handlePaymentCancelled(data);
    } else if (type === 'Transaction.Failed') {
      await handlePaymentFailed(data);
    } else {
      console.log('[Webhook] 처리하지 않는 이벤트 타입:', type);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Webhook] 처리 완료 (${processingTime}ms)`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] 처리 오류:', error);
    return NextResponse.json({ error: '웹훅 처리 오류' }, { status: 500 });
  }
}

/**
 * 결제 완료 이벤트 처리
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentPaid(data: Record<string, any>) {
  const { paymentId } = data;

  console.log('[Webhook] 결제 완료 이벤트:', paymentId);

  // 서비스 역할 키로 Supabase 클라이언트 생성 (웹훅은 서버 간 통신)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. 중복 처리 방지: 이미 처리된 결제인지 확인
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('payment_id', paymentId)
    .single();

  if (existingPayment) {
    console.log(
      '[Webhook] 이미 처리된 결제:',
      paymentId,
      existingPayment.status
    );
    return; // 중복 처리 방지
  }

  // 2. 포트원 API로 결제 정보 재확인 (이중 검증)
  const paymentInfo = await getPaymentFromPortone(paymentId);

  if (paymentInfo.status !== 'PAID') {
    console.error('[Webhook] 결제 상태 불일치:', paymentInfo.status);
    return;
  }

  // 3. customData에서 사용자 정보 추출
  const customData = paymentInfo.customData
    ? JSON.parse(paymentInfo.customData)
    : {};
  const { userId, productId, startDate, endDate, days } = customData;

  if (!userId || !productId) {
    console.error('[Webhook] customData 누락:', customData);
    return;
  }

  // 4. 결제 내역 DB 저장
  const { error: insertError } = await supabase.from('payments').insert({
    user_id: userId,
    payment_id: paymentId,
    product_id: productId,
    amount: paymentInfo.amount.total,
    status: 'PAID',
    paid_at: new Date().toISOString(),
    start_date: startDate,
    end_date: endDate,
    days: days,
    portone_data: paymentInfo,
    webhook_processed: true,
  });

  if (insertError) {
    // 중복 키 에러면 무시 (이미 verify API에서 처리됨)
    if (insertError.code === '23505') {
      console.log('[Webhook] 결제가 이미 verify API에서 처리됨:', paymentId);
      return;
    }
    console.error('[Webhook] DB 저장 실패:', insertError);
    throw insertError;
  }

  // 5. 구독 활성화
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      product_id: productId,
      is_active: true,
      expires_at: endDate || calculateExpiryDate(productId),
      start_date: startDate,
      end_date: endDate,
      days: days,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    console.error('[Webhook] 구독 업데이트 실패:', updateError);
  }

  console.log('[Webhook] 결제 처리 완료:', paymentId);
}

/**
 * 결제 취소 이벤트 처리
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentCancelled(data: Record<string, any>) {
  const { paymentId } = data;

  console.log('[Webhook] 결제 취소 이벤트:', paymentId);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 결제 상태 업데이트
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId);

  if (error) {
    console.error('[Webhook] 취소 처리 실패:', error);
    throw error;
  }

  // 해당 결제의 구독 비활성화
  const { data: payment } = await supabase
    .from('payments')
    .select('user_id, product_id')
    .eq('payment_id', paymentId)
    .single();

  if (payment) {
    await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', payment.user_id)
      .eq('product_id', payment.product_id);
  }

  console.log('[Webhook] 결제 취소 처리 완료:', paymentId);
}

/**
 * 결제 실패 이벤트 처리
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(data: Record<string, any>) {
  const { paymentId } = data;

  console.log('[Webhook] 결제 실패 이벤트:', paymentId);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 결제 실패 기록 (있는 경우에만)
  await supabase
    .from('payments')
    .update({
      status: 'FAILED',
      failed_at: new Date().toISOString(),
    })
    .eq('payment_id', paymentId);

  console.log('[Webhook] 결제 실패 처리 완료:', paymentId);
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
      now.setFullYear(now.getFullYear() + 100);
      break;
    default:
      now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString();
}
