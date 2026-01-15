/**
 * 강화된 마스킹 유틸리티
 * 사용자 정보를 안전하게 숨기면서 힌트를 제공
 */

/**
 * 이메일 마스킹
 * @example "johnsmith@gmail.com" → "j***h@g***.com"
 * @example "ab@test.com" → "a*@t***.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';

  const [localPart, domain] = email.split('@');

  // Local part 마스킹 (첫 글자 + *** + 마지막 글자)
  let maskedLocal: string;
  if (localPart.length <= 2) {
    maskedLocal = localPart[0] + '*';
  } else {
    maskedLocal = localPart[0] + '***' + localPart[localPart.length - 1];
  }

  // Domain 마스킹 (첫 글자 + *** + 확장자)
  const domainParts = domain.split('.');
  let maskedDomain: string;

  if (domainParts[0].length <= 2) {
    maskedDomain = domainParts[0][0] + '*';
  } else {
    maskedDomain = domainParts[0][0] + '***';
  }

  const extension = domainParts.slice(1).join('.');
  maskedDomain = maskedDomain + '.' + extension;

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * 전화번호 마스킹
 * @example "010-1234-5678" → "010-****-5678"
 * @example "01012345678" → "010****5678"
 */
export function maskPhone(phone: string): string {
  if (!phone) return '***-****-****';

  // 하이픈 제거 후 숫자만 추출
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length !== 11) {
    // 11자리가 아니면 기본 마스킹
    return '***-****-****';
  }

  // 010-****-5678 형태로 마스킹
  const prefix = digitsOnly.slice(0, 3); // 010
  const suffix = digitsOnly.slice(-4); // 5678

  return `${prefix}-****-${suffix}`;
}

/**
 * 이름 마스킹
 * @example "김철수" → "김**"
 * @example "John Smith" → "J*** S****"
 */
export function maskName(name: string): string {
  if (!name) return '***';

  // 한글인 경우 (2-4자)
  if (/^[가-힣]+$/.test(name)) {
    if (name.length <= 2) {
      return name[0] + '*';
    }
    return name[0] + '*'.repeat(name.length - 1);
  }

  // 영문인 경우 (공백으로 분리된 이름)
  const parts = name.split(' ');
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(part.length - 1);
    })
    .join(' ');
}

/**
 * 타이밍 어택 방지를 위한 일정한 지연 함수
 * @param ms 지연 시간 (기본 500ms)
 */
export async function constantTimeDelay(ms: number = 500): Promise<void> {
  const start = Date.now();
  // 실제 작업 시간과 관계없이 항상 동일한 시간 소요
  await new Promise((resolve) => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, ms - elapsed);
    setTimeout(resolve, remaining);
  });
}
