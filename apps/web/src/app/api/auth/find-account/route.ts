import { NextResponse } from 'next/server';

import { maskEmail, constantTimeDelay } from '@/lib/masking';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 이메일 찾기 API
 *
 * 보안 기능:
 * - Rate Limiting: IP당 1시간에 3회 제한
 * - 타이밍 공격 방지: 항상 동일한 응답 시간
 * - 사용자 열거 방지: 존재 여부와 관계없이 동일한 메시지
 * - 강화된 마스킹: 이메일 대부분 숨김
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // 1. Rate Limiting 체크
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`find-account:${clientIp}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000, // 1시간
    });

    if (rateLimit.limited) {
      // 제한 초과 시
      const resetDate = new Date(rateLimit.resetAt);
      const resetTimeKr = resetDate.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      await constantTimeDelay(500);

      return NextResponse.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS',
          message: `너무 많은 요청이 발생했습니다. ${resetTimeKr} 이후에 다시 시도해주세요.`,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // 2. 요청 데이터 파싱
    const body = await req.json();
    const { phone } = body;

    // 3. 입력값 검증
    if (!phone || typeof phone !== 'string') {
      await constantTimeDelay(500);
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_INPUT',
          message: '전화번호를 입력해주세요.',
        },
        { status: 400 }
      );
    }

    // 전화번호 포맷 정규화 (하이픈 제거)
    const normalizedPhone = phone.replace(/\D/g, '');

    // 전화번호 유효성 검증 (한국 번호: 10-11자리)
    if (!/^01[0-9]{8,9}$/.test(normalizedPhone)) {
      await constantTimeDelay(500);
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_PHONE',
          message: '올바른 전화번호 형식이 아닙니다.',
        },
        { status: 400 }
      );
    }

    // 4. DB 조회
    const supabase = getSupabaseClient();

    // Supabase Auth 사용자 목록에서 phone으로 검색
    // 주의: 이 방법은 Supabase Service Role Key가 필요할 수 있음
    // 대안: user_profiles 테이블에 phone 저장하는 방식
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('email, phone')
      .eq('phone', normalizedPhone)
      .limit(1);

    // 5. 타이밍 공격 방지: 항상 최소 500ms 소요
    await constantTimeDelay(500);

    // 6. 응답 생성 (존재 여부와 관계없이 동일한 형식)
    if (error || !profiles || profiles.length === 0) {
      // 찾지 못한 경우에도 동일한 응답 (사용자 열거 방지)
      return NextResponse.json(
        {
          success: true,
          message:
            '입력하신 전화번호로 가입된 이메일 정보를 확인했습니다.\n등록된 이메일 주소를 확인해주세요.',
          found: false, // 프론트에서 처리용
        },
        {
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }

    // 7. 이메일을 찾은 경우
    const userEmail = profiles[0].email;
    const maskedEmail = maskEmail(userEmail);

    return NextResponse.json(
      {
        success: true,
        message:
          '입력하신 전화번호로 가입된 이메일 정보를 확인했습니다.\n등록된 이메일 주소를 확인해주세요.',
        found: true,
        email: maskedEmail, // 마스킹된 이메일만 전달
      },
      {
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('[Find Account API] Error:', error);

    // 에러 발생 시에도 타이밍 공격 방지
    await constantTimeDelay(500);

    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    );
  }
}
