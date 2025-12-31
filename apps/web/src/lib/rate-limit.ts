/**
 * 간단한 In-Memory Rate Limiting
 * 프로덕션에서는 Redis/Upstash를 사용해야 하지만,
 * 초기 단계에서는 메모리 기반으로 시작
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// IP별 요청 카운트 저장
const rateLimitStore = new Map<string, RateLimitEntry>();

// 정리 작업: 5분마다 만료된 항목 제거
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * 허용 횟수
   * @default 3
   */
  limit?: number;

  /**
   * 시간 윈도우 (밀리초)
   * @default 3600000 (1시간)
   */
  windowMs?: number;
}

export interface RateLimitResult {
  /**
   * 요청 허용 여부
   */
  allowed: boolean;

  /**
   * 남은 요청 횟수
   */
  remaining: number;

  /**
   * 제한 해제 시간 (Unix timestamp)
   */
  resetAt: number;

  /**
   * 제한 초과 여부
   */
  limited: boolean;
}

/**
 * Rate Limiting 체크
 * @param identifier 식별자 (보통 IP 주소)
 * @param config 설정
 * @returns Rate Limit 결과
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { limit = 3, windowMs = 60 * 60 * 1000 } = config; // 기본: 1시간에 3회
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  // 항목이 없거나 만료된 경우 새로 생성
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: entry.resetAt,
      limited: false,
    };
  }

  // 제한 초과 체크
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limited: true,
    };
  }

  // 카운트 증가
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    limited: false,
  };
}

/**
 * Rate Limit 초기화 (테스트용)
 * @param identifier 식별자
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * 모든 Rate Limit 초기화 (테스트용)
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Request에서 IP 주소 추출
 * @param req NextRequest
 * @returns IP 주소
 */
export function getClientIp(req: Request): string {
  // Vercel/Next.js에서 IP 가져오기
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    // x-forwarded-for는 쉼표로 구분된 IP 목록
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // 기본값 (로컬 개발 환경)
  return '127.0.0.1';
}
