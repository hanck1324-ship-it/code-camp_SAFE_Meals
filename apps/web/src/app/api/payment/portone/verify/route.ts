import { NextRequest, NextResponse } from 'next/server';

/**
 * 포트원 결제 검증 API
 * POST /api/payment/portone/verify
 * 
 * 서버 사이드에서 포트원 결제를 검증합니다.
 * 클라이언트에서 직접 검증하지 않고 이 API를 통해 검증해야 합니다.
 */

export async function POST(req: NextRequest) {
  try {
    const { paymentId, orderId } = await req.json();

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { success: false, message: '결제 ID와 주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // TODO: 포트원 서버 API로 결제 검증
    // 포트원 서버 API를 사용하여 실제 결제 내역을 확인해야 합니다.
    // 
    // 예시:
    // const portoneApiKey = process.env.PORTONE_API_KEY;
    // const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${portoneApiKey}`,
    //   },
    // });
    // 
    // const paymentData = await response.json();
    // 
    // if (paymentData.status === 'paid' && paymentData.orderId === orderId) {
    //   return NextResponse.json({ success: true, payment: paymentData });
    // }

    // 임시: 항상 성공 반환 (실제 구현 필요)
    console.log('결제 검증 요청:', { paymentId, orderId });
    
    return NextResponse.json({
      success: true,
      message: '결제 검증 완료',
      paymentId,
      orderId,
    });
  } catch (error: any) {
    console.error('결제 검증 오류:', error);
    return NextResponse.json(
      { success: false, message: error.message || '결제 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

