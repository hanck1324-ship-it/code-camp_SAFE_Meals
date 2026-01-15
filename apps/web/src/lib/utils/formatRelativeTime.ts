/**
 * 상대 시간 표시 유틸리티 함수
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(
  dateString: string,
  locale: string = 'ko'
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const translations: Record<
    string,
    {
      justNow: string;
      minutesAgo: (n: number) => string;
      hoursAgo: (n: number) => string;
      daysAgo: (n: number) => string;
    }
  > = {
    ko: {
      justNow: '방금 전',
      minutesAgo: (n) => `${n}분 전`,
      hoursAgo: (n) => `${n}시간 전`,
      daysAgo: (n) => `${n}일 전`,
    },
    en: {
      justNow: 'just now',
      minutesAgo: (n) => `${n} min ago`,
      hoursAgo: (n) => `${n} hours ago`,
      daysAgo: (n) => `${n} days ago`,
    },
  };

  const t = translations[locale] || translations.ko;

  // 1분 미만
  if (diffMinutes < 1) {
    return t.justNow;
  }

  // 1~59분
  if (diffMinutes < 60) {
    return t.minutesAgo(diffMinutes);
  }

  // 1~23시간
  if (diffHours < 24) {
    return t.hoursAgo(diffHours);
  }

  // 1~6일
  if (diffDays < 7) {
    return t.daysAgo(diffDays);
  }

  // 7일 이상: YYYY.MM.DD 형식
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
