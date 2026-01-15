/**
 * 상대 시간 포맷 유틸리티
 * - 스캔 시간을 "방금 전", "5분 전" 등으로 표시
 */

type LocaleLabels = {
  justNow: string;
  minutes: (n: number) => string;
  hours: (n: number) => string;
  days: (n: number) => string;
};

const LABELS: Record<string, LocaleLabels> = {
  ko: {
    justNow: '방금 전',
    minutes: (n: number) => `${n}분 전`,
    hours: (n: number) => `${n}시간 전`,
    days: (n: number) => `${n}일 전`,
  },
  en: {
    justNow: 'just now',
    minutes: (n: number) => `${n} min ago`,
    hours: (n: number) => `${n}h ago`,
    days: (n: number) => `${n}d ago`,
  },
  ja: {
    justNow: 'たった今',
    minutes: (n: number) => `${n}分前`,
    hours: (n: number) => `${n}時間前`,
    days: (n: number) => `${n}日前`,
  },
  zh: {
    justNow: '刚刚',
    minutes: (n: number) => `${n}分钟前`,
    hours: (n: number) => `${n}小时前`,
    days: (n: number) => `${n}天前`,
  },
};

/**
 * ISO 날짜 문자열을 상대 시간 문자열로 변환
 * @param dateString ISO 형식 날짜 문자열
 * @param locale 언어 코드 (기본: 'ko')
 * @returns 상대 시간 문자열
 */
export function formatRelativeTime(dateString: string, locale = 'ko'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const l = LABELS[locale] ?? LABELS.ko;

  if (diffMins < 1) return l.justNow;
  if (diffMins < 60) return l.minutes(diffMins);
  if (diffHours < 24) return l.hours(diffHours);
  if (diffDays < 7) return l.days(diffDays);

  // 7일 이상이면 날짜 표시
  const localeString =
    locale === 'ko'
      ? 'ko-KR'
      : locale === 'ja'
        ? 'ja-JP'
        : locale === 'zh'
          ? 'zh-CN'
          : 'en-US';
  return date.toLocaleDateString(localeString, {
    month: 'short',
    day: 'numeric',
  });
}
