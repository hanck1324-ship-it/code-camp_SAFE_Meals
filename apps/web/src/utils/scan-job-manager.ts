/**
 * 스캔 작업 관리자 (scan-job-manager.ts)
 *
 * 메뉴 스캔 분석의 PARTIAL/FINAL 응답 패턴을 위한 jobId 관리 시스템
 *
 * 아키텍처:
 * - JobStorage 인터페이스로 추상화하여 저장소 교체가 용이함
 * - 초기 구현: MemoryJobStorage (dev/단일 인스턴스용)
 * - 추후 확장: RedisJobStorage (prod/스케일아웃용)
 *
 * WARNING: 서버리스/스케일아웃 환경에서의 제약사항
 * - 메모리 Map은 인스턴스 간 공유되지 않음
 * - 핫리로드/재시작 시 데이터 소실
 * - prod 환경에서는 Redis 등 외부 저장소 필요
 */

import { randomUUID } from 'crypto';

// ============================================
// 타입 정의
// ============================================

/** 위험도 등급 */
export type SafetyLevel = 'SAFE' | 'CAUTION' | 'DANGER';

/** 신뢰도 등급 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/** Job 상태 */
export type JobStatus = 'PENDING' | 'FINAL' | 'ERROR';

/** 1차 판정 결과 (QuickResult) */
export interface QuickResult {
  /** 위험도 등급 */
  level: SafetyLevel;
  /** 사용자에게 보여줄 1줄 요약 */
  summaryText: string;
  /** 내부 트리거 코드 배열 (로그/분석용) */
  triggerCodes: string[];
  /** 사용자에게 보여줄 트리거 레이블 배열 */
  triggerLabels: string[];
  /** 템플릿 기반 질문 (사용자 알레르기/식단에 따라 자동 생성) */
  questionForStaff: string;
  /** OCR 텍스트 품질 신뢰도 */
  confidence: ConfidenceLevel;
}

/** 최종 분석 결과 */
export interface FinalResult {
  menus: unknown[];
  summary: string;
  aiAnalysis: unknown;
  overall_status: SafetyLevel;
  results: unknown[];
  user_context?: {
    allergies: string[];
    diet: string;
  };
  db_enhanced?: boolean;
}

/** 성능 계측 데이터 */
export interface ScanTimings {
  /** OCR 처리 시간 (ms) */
  ocrMs?: number;
  /** 룰/DB 1차 판정 시간 (ms) */
  quickMs?: number;
  /** Fast Gemini 1차 판정 시간 (ms) */
  fastGeminiMs?: number;
  /** Gemini AI 분석 시간 (ms) - 완료 시에만 */
  geminiMs?: number;
  /** 타임아웃으로 대기한 시간 (ms) */
  waitedForGeminiMs?: number;
  /** 총 소요 시간 (ms) */
  totalMs?: number;
  /** JSON 파싱 시간 */
  parseMs?: number;
  /** DB 처리 시간 */
  dbMs?: number;
  /** DB 알레르기 검증 시간 (ms) */
  dbVerifyMs?: number;
  /** OCR 추출 텍스트 글자 수 */
  ocrTextChars?: number;
  /** Gemini 프롬프트 글자 수 */
  promptChars?: number;
  /** 토큰 최적화 시간 (ms) */
  tokenOptimizeMs?: number;
  /** 스캔 이력 저장 시간 (ms) */
  saveMs?: number;
  /** 에러 메시지 */
  error?: string;
}

/** Job 저장 데이터 */
export interface JobData {
  /** Job 상태 */
  status: JobStatus;
  /** Quick 분석 결과 (PARTIAL용) */
  quickResult?: QuickResult;
  /** 최종 분석 결과 (FINAL용) */
  result?: FinalResult | null;
  /** 성능 계측 데이터 */
  timings: ScanTimings;
  /** 생성 시간 */
  createdAt: number;
  /** 완료 시간 */
  completedAt: number | null;
  /** 에러 메시지 */
  errorMessage?: string;
}

/** PARTIAL 응답 구조 */
export interface PartialResponse {
  status: 'PARTIAL';
  jobId: string;
  quickResult: QuickResult;
  timings: ScanTimings;
}

/** FINAL 응답 구조 */
export interface FinalResponse {
  status: 'FINAL';
  jobId: string | null;
  result: FinalResult;
  timings: ScanTimings;
}

/** API 응답 유니온 타입 */
export type ScanAnalyzeResponse = PartialResponse | FinalResponse;

// ============================================
// JobStorage 인터페이스
// ============================================

/**
 * Job 저장소 인터페이스
 *
 * 구현체를 교체하여 다양한 저장소 사용 가능:
 * - MemoryJobStorage: 개발/단일 인스턴스용 (메모리)
 * - RedisJobStorage: 프로덕션/스케일아웃용 (Redis)
 */
export interface JobStorage {
  /**
   * Job 데이터 저장
   * @param jobId - Job 고유 ID
   * @param data - 저장할 Job 데이터
   */
  set(jobId: string, data: JobData): Promise<void>;

  /**
   * Job 데이터 조회
   * @param jobId - Job 고유 ID
   * @returns Job 데이터 또는 null
   */
  get(jobId: string): Promise<JobData | null>;

  /**
   * Job 데이터 삭제
   * @param jobId - Job 고유 ID
   */
  delete(jobId: string): Promise<void>;

  /**
   * 저장소 정리 (TTL 만료 항목 제거)
   */
  cleanup(): Promise<void>;
}

// ============================================
// MemoryJobStorage 구현
// ============================================

/**
 * 메모리 기반 Job 저장소
 *
 * WARNING: 개발/단일 인스턴스 환경에서만 사용할 것
 * - 서버리스/스케일아웃 환경에서는 인스턴스 간 데이터 공유 불가
 * - 핫리로드/재시작 시 데이터 소실
 * - prod 환경에서는 RedisJobStorage 사용 권장
 */
export class MemoryJobStorage implements JobStorage {
  private store: Map<string, JobData> = new Map();
  private ttlMs: number;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(ttlMs: number = 30 * 60 * 1000) {
    // 기본 TTL: 30분
    this.ttlMs = ttlMs;

    // WARNING: 서버리스 환경에서는 setInterval이 비효율적
    // Vercel/Lambda 등에서는 인스턴스가 재사용되지 않을 수 있음
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // 5분마다 만료된 항목 정리
    this.cleanupIntervalId = setInterval(
      () => {
        this.cleanup().catch((err) => {
          console.error('[MemoryJobStorage] Cleanup error:', err);
        });
      },
      5 * 60 * 1000
    );
  }

  async set(jobId: string, data: JobData): Promise<void> {
    this.store.set(jobId, data);
    console.log(`[MemoryJobStorage] SET jobId=${jobId}, status=${data.status}`);
  }

  async get(jobId: string): Promise<JobData | null> {
    const data = this.store.get(jobId);

    if (!data) {
      console.log(`[MemoryJobStorage] GET jobId=${jobId} → NOT FOUND`);
      return null;
    }

    // TTL 체크
    const now = Date.now();
    if (now - data.createdAt > this.ttlMs) {
      console.log(`[MemoryJobStorage] GET jobId=${jobId} → EXPIRED`);
      this.store.delete(jobId);
      return null;
    }

    console.log(
      `[MemoryJobStorage] GET jobId=${jobId} → status=${data.status}`
    );
    return data;
  }

  async delete(jobId: string): Promise<void> {
    this.store.delete(jobId);
    console.log(`[MemoryJobStorage] DELETE jobId=${jobId}`);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    let deletedCount = 0;

    for (const [jobId, data] of this.store.entries()) {
      if (now - data.createdAt > this.ttlMs) {
        this.store.delete(jobId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(
        `[MemoryJobStorage] CLEANUP: removed ${deletedCount} expired jobs`
      );
    }
  }

  /** 저장소 상태 조회 (디버깅용) */
  getStats(): { size: number; ttlMs: number } {
    return {
      size: this.store.size,
      ttlMs: this.ttlMs,
    };
  }

  /** 정리 인터벌 중지 (테스트용) */
  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}

// ============================================
// 싱글톤 인스턴스 (HMR 대응)
// ============================================

/**
 * globalThis를 사용한 진짜 싱글톤
 *
 * Next.js dev 모드에서 HMR(핫 모듈 교체)이 발생하면
 * 모듈이 재평가되어 일반 변수는 초기화됨.
 * globalThis에 저장하면 HMR에서도 인스턴스가 유지됨.
 */
const GLOBAL_KEY = '__safeMeals_jobStorage__';

declare global {
  // eslint-disable-next-line no-var
  var __safeMeals_jobStorage__: JobStorage | undefined;
}

/**
 * Job 저장소 인스턴스 가져오기
 */
export function getJobStorage(): JobStorage {
  if (!globalThis[GLOBAL_KEY]) {
    // TODO: 환경 변수에 따라 RedisJobStorage 사용
    // if (process.env.REDIS_URL) {
    //   globalThis[GLOBAL_KEY] = new RedisJobStorage(process.env.REDIS_URL);
    // } else {
    globalThis[GLOBAL_KEY] = new MemoryJobStorage();
    console.log(
      '[ScanJobManager] Using MemoryJobStorage (dev/single-instance only)'
    );
    // }
  }
  return globalThis[GLOBAL_KEY];
}

/**
 * Job 저장소 인스턴스 교체 (테스트/커스텀 구현용)
 */
export function setJobStorage(storage: JobStorage): void {
  globalThis[GLOBAL_KEY] = storage;
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 새 jobId 생성
 */
export function generateJobId(): string {
  return randomUUID();
}

/**
 * PENDING 상태의 Job 생성
 */
export async function createPendingJob(
  jobId: string,
  quickResult: QuickResult,
  timings: ScanTimings
): Promise<void> {
  const storage = getJobStorage();
  await storage.set(jobId, {
    status: 'PENDING',
    quickResult,
    result: null,
    timings,
    createdAt: Date.now(),
    completedAt: null,
  });
}

/**
 * Job을 FINAL 상태로 업데이트
 */
export async function completeJob(
  jobId: string,
  result: FinalResult,
  timings: ScanTimings
): Promise<void> {
  const storage = getJobStorage();
  const existing = await storage.get(jobId);

  if (!existing) {
    console.warn(`[ScanJobManager] completeJob: jobId=${jobId} not found`);
    // 없어도 새로 생성
    await storage.set(jobId, {
      status: 'FINAL',
      result,
      timings,
      createdAt: Date.now(),
      completedAt: Date.now(),
    });
    return;
  }

  await storage.set(jobId, {
    ...existing,
    status: 'FINAL',
    result,
    timings: { ...existing.timings, ...timings },
    completedAt: Date.now(),
  });
  console.log(`[ScanJobManager] Job completed: jobId=${jobId}`);
}

/**
 * Job을 ERROR 상태로 업데이트
 */
export async function failJob(
  jobId: string,
  errorMessage: string,
  timings?: ScanTimings
): Promise<void> {
  const storage = getJobStorage();
  const existing = await storage.get(jobId);

  const jobData: JobData = {
    status: 'ERROR',
    result: null,
    timings: { ...existing?.timings, ...timings, error: errorMessage },
    createdAt: existing?.createdAt || Date.now(),
    completedAt: Date.now(),
    errorMessage,
  };

  if (existing?.quickResult) {
    jobData.quickResult = existing.quickResult;
  }

  await storage.set(jobId, jobData);
  console.log(
    `[ScanJobManager] Job failed: jobId=${jobId}, error=${errorMessage}`
  );
}

/**
 * Job 조회
 */
export async function getJob(jobId: string): Promise<JobData | null> {
  const storage = getJobStorage();
  return storage.get(jobId);
}

// ============================================
// 알레르기 코드 ↔ 레이블 매핑
// ============================================

export const ALLERGY_CODE_TO_LABEL: Record<string, string> = {
  eggs: '계란',
  milk: '우유/유제품',
  peanuts: '땅콩',
  tree_nuts: '견과류',
  fish: '생선',
  shellfish: '갑각류/조개류',
  wheat: '밀/글루텐',
  soy: '대두',
  sesame: '참깨',
  pork: '돼지고기',
  beef: '소고기',
  chicken: '닭고기',
  lamb: '양고기',
  buckwheat: '메밀',
  peach: '복숭아',
  tomato: '토마토',
  sulfites: '아황산염',
  mustard: '겨자',
  celery: '셀러리',
  lupin: '루핀',
  mollusks: '연체류',
  alcohol: '알코올',
};

export const DIET_CODE_TO_LABEL: Record<string, string> = {
  vegetarian: '채식주의',
  vegan: '비건',
  lacto_vegetarian: '락토 채식',
  ovo_vegetarian: '오보 채식',
  pesco_vegetarian: '페스코 채식',
  flexitarian: '플렉시테리언',
  halal: '할랄',
  kosher: '코셔',
  buddhist_vegetarian: '불교 채식',
  gluten_free: '글루텐 프리',
  pork_free: '돼지고기 제외',
  alcohol_free: '무알코올',
  garlic_onion_free: '마늘/양파 제외',
};

// ============================================
// 위험 키워드 정의 (1차 판정용)
// ============================================

/** 확실한 위험 키워드 (DANGER) - 알레르기별 */
export const DANGER_KEYWORDS: Record<string, string[]> = {
  eggs: ['계란', '달걀', 'egg', '에그', '란', '마요네즈'],
  milk: ['우유', '치즈', '버터', 'milk', 'cheese', 'cream', '크림', '유제품'],
  peanuts: ['땅콩', 'peanut', '피넛'],
  tree_nuts: [
    '호두',
    '아몬드',
    '캐슈넛',
    '피스타치오',
    '견과류',
    'nut',
    'walnut',
    'almond',
  ],
  fish: ['생선', '연어', '참치', '고등어', 'fish', 'salmon', 'tuna'],
  shellfish: [
    '새우',
    '게',
    '랍스터',
    '가재',
    '갑각류',
    'shrimp',
    'crab',
    'lobster',
  ],
  wheat: ['밀', '글루텐', '빵', '면', 'wheat', 'gluten', 'flour'],
  soy: ['대두', '두부', '된장', '간장', 'soy', 'tofu'],
  sesame: ['참깨', '깨', 'sesame'],
  pork: ['돼지', '삼겹', '베이컨', '햄', 'pork', 'bacon', 'ham'],
  beef: ['소고기', '불고기', 'beef', '스테이크'],
  chicken: ['닭', '치킨', 'chicken'],
  lamb: ['양고기', '램', 'lamb'],
  buckwheat: ['메밀', 'buckwheat', '소바'],
  peach: ['복숭아', 'peach'],
  alcohol: ['알코올', '술', '맥주', '와인', 'alcohol', 'beer', 'wine'],
};

/** 의심스러운 키워드 (CAUTION) - 숨겨진 재료 가능성 */
export const CAUTION_KEYWORDS = [
  '소스',
  'sauce',
  '양념',
  '육수',
  '브로스',
  'broth',
  'stock',
  '튀김',
  '프라이',
  'fried',
  '조미료',
  '시즈닝',
  'seasoning',
  '드레싱',
  'dressing',
  '마리네이드',
  '볶음',
  '찜',
  '조림',
];

const VEGETARIAN_BASE_KEYWORDS = [
  '고기',
  '육류',
  'meat',
  '소고기',
  '돼지',
  '닭',
  '생선',
  '해산물',
];
const EGG_KEYWORDS = ['계란', '달걀', 'egg', '에그'];
const DAIRY_KEYWORDS = [
  '우유',
  '치즈',
  '버터',
  'milk',
  'cheese',
  'cream',
  '크림',
  '유제품',
];
const GARLIC_ONION_KEYWORDS = [
  '마늘',
  '양파',
  '파',
  '대파',
  '쪽파',
  'garlic',
  'onion',
];

/** 식단별 위험 키워드 */
export const DIET_DANGER_KEYWORDS: Record<string, string[]> = {
  vegetarian: VEGETARIAN_BASE_KEYWORDS,
  vegan: [
    '고기',
    '육류',
    'meat',
    '우유',
    '계란',
    '꿀',
    'honey',
    '유제품',
    'dairy',
  ],
  lacto_vegetarian: [...VEGETARIAN_BASE_KEYWORDS, ...EGG_KEYWORDS],
  ovo_vegetarian: [...VEGETARIAN_BASE_KEYWORDS, ...DAIRY_KEYWORDS],
  pesco_vegetarian: ['고기', '육류', 'meat', '소고기', '돼지', '닭'],
  flexitarian: VEGETARIAN_BASE_KEYWORDS,
  halal: ['돼지', 'pork', '베이컨', '햄', '알코올', 'alcohol', '술', '와인'],
  kosher: ['돼지', 'pork', '갑각류', 'shellfish', '새우', '게'],
  buddhist_vegetarian: [
    ...VEGETARIAN_BASE_KEYWORDS,
    ...GARLIC_ONION_KEYWORDS,
  ],
  gluten_free: ['밀', 'wheat', '글루텐', 'gluten', '빵', '면', '파스타'],
  pork_free: ['돼지', 'pork', '베이컨', '햄'],
  alcohol_free: ['알코올', '술', '맥주', '와인', '소주', 'alcohol', 'beer', 'wine'],
  garlic_onion_free: GARLIC_ONION_KEYWORDS,
};

// ============================================
// 1차 판정 함수
// ============================================

/**
 * 룰/DB 기반 1차 빠른 판정 수행
 *
 * 역할: "빨간불 조기 경보" (Safe 인증이 아님)
 * - 명확한 금지/위험 신호를 빠르게 감지
 * - 사용자에게 "직원에게 물어볼 질문 1줄" 제공
 *
 * @param ocrText - OCR 추출 텍스트
 * @param userAllergies - 사용자 알레르기 코드 배열
 * @param userDiets - 사용자 식이제한 코드 배열
 * @param ocrConfidence - OCR 텍스트 품질 신뢰도
 * @param ocrFailed - OCR API 호출 자체가 실패했는지 여부 (true = API 에러)
 */
export function performQuickAnalysis(
  ocrText: string,
  userAllergies: string[],
  userDiets: string[],
  ocrConfidence: ConfidenceLevel = 'medium',
  ocrFailed: boolean = false
): QuickResult {
  // 🚨 OCR API 완전 실패 시 조기 반환
  // 이 경우 텍스트가 없어 1차 판정 불가 → Gemini AI 분석에 의존해야 함
  if (ocrFailed && ocrText.trim().length === 0) {
    return {
      level: 'CAUTION',
      summaryText: '텍스트 인식에 실패했습니다. AI 분석 결과를 기다려주세요.',
      triggerCodes: ['_OCR_FAILED'],
      triggerLabels: [],
      questionForStaff: generateDefaultStaffQuestion(userAllergies, userDiets),
      confidence: 'low',
    };
  }

  // 🚨 텍스트가 너무 짧은 경우 (10자 미만) - 먼저 체크
  if (ocrText.trim().length < 10) {
    return {
      level: 'CAUTION',
      summaryText: '메뉴 정보가 충분하지 않습니다. 직원에게 확인하세요.',
      triggerCodes: ['_TEXT_TOO_SHORT'],
      triggerLabels: [],
      questionForStaff: generateDefaultStaffQuestion(userAllergies, userDiets),
      confidence: ocrConfidence,
    };
  }

  const lowerText = ocrText.toLowerCase();
  const triggerCodes: string[] = [];
  const triggerLabels: string[] = [];

  // 1. 알레르기 키워드 검사
  for (const allergyCode of userAllergies) {
    const keywords = DANGER_KEYWORDS[allergyCode] || [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!triggerCodes.includes(allergyCode)) {
          triggerCodes.push(allergyCode);
          triggerLabels.push(ALLERGY_CODE_TO_LABEL[allergyCode] || allergyCode);
        }
        break;
      }
    }
  }

  // 2. 식이제한 키워드 검사
  const dietTriggers: string[] = [];
  for (const dietCode of userDiets) {
    const keywords = DIET_DANGER_KEYWORDS[dietCode] || [];
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!dietTriggers.includes(dietCode)) {
          dietTriggers.push(dietCode);
          triggerLabels.push(DIET_CODE_TO_LABEL[dietCode] || dietCode);
        }
        break;
      }
    }
  }

  // 3. 의심스러운 키워드 검사 (CAUTION용)
  let hasCautionKeyword = false;
  for (const keyword of CAUTION_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      hasCautionKeyword = true;
      break;
    }
  }

  // 4. 판정 로직
  let level: SafetyLevel;
  let summaryText: string;

  if (triggerCodes.length > 0 || dietTriggers.length > 0) {
    // 명확한 위험 키워드 발견 → DANGER
    level = 'DANGER';
    summaryText = `${triggerLabels.join(', ')} 포함 가능성이 높습니다. 직원에게 확인하세요.`;
  } else if (hasCautionKeyword) {
    // 의심스러운 키워드 발견 → CAUTION
    level = 'CAUTION';
    summaryText = '숨겨진 재료가 있을 수 있습니다. 직원에게 확인하세요.';
  } else if (ocrConfidence === 'low') {
    // OCR 품질이 낮음 → CAUTION
    level = 'CAUTION';
    summaryText = '메뉴 정보가 명확하지 않습니다. 직원에게 확인을 권장합니다.';
  } else {
    // 모든 조건 만족 → SAFE (보수적)
    level = 'SAFE';
    summaryText =
      '1차 검사 결과 위험 요소가 감지되지 않았습니다. 최종 분석을 기다려주세요.';
  }

  // 5. 질문 생성
  const questionForStaff = generateStaffQuestion(
    triggerCodes,
    dietTriggers,
    userAllergies,
    userDiets
  );

  return {
    level,
    summaryText,
    triggerCodes: [...triggerCodes, ...dietTriggers],
    triggerLabels,
    questionForStaff,
    confidence: ocrConfidence,
  };
}

/**
 * OCR 실패 시 기본 질문 생성 (트리거 없이 사용자 프로필 기반)
 */
function generateDefaultStaffQuestion(
  userAllergies: string[],
  userDiets: string[]
): string {
  // 사용자 알레르기 기반 질문
  if (userAllergies.length > 0) {
    const allergyLabels = userAllergies
      .slice(0, 2)
      .map((code) => ALLERGY_CODE_TO_LABEL[code] || code)
      .join(', ');
    return `이 요리에 ${allergyLabels} 등이 들어가나요?`;
  }

  // 사용자 식단 기반 질문
  if (userDiets.length > 0) {
    const dietLabel = DIET_CODE_TO_LABEL[userDiets[0]] || userDiets[0];
    return `이 요리가 ${dietLabel} 식단에 적합한가요?`;
  }

  // 프로필 없으면 일반 질문
  return '이 요리의 주요 재료를 알려주시겠어요?';
}

/**
 * 직원에게 물어볼 질문 생성
 */
function generateStaffQuestion(
  triggerCodes: string[],
  dietTriggers: string[],
  userAllergies: string[],
  userDiets: string[]
): string {
  // 발견된 트리거가 있으면 그에 대해 질문
  if (triggerCodes.length > 0) {
    const firstTrigger = triggerCodes[0];
    const label = ALLERGY_CODE_TO_LABEL[firstTrigger] || firstTrigger;

    switch (firstTrigger) {
      case 'shellfish':
        return '이 요리에 새우, 게, 랍스터 등 갑각류가 들어가나요?';
      case 'pork':
        return '육수나 조미료에 돼지고기가 들어가나요?';
      case 'eggs':
        return '이 요리에 계란이 들어가나요?';
      case 'milk':
        return '이 요리에 우유나 유제품이 들어가나요?';
      default:
        return `이 요리에 ${label}이(가) 들어가나요?`;
    }
  }

  // 식이제한 트리거가 있으면 그에 대해 질문
  if (dietTriggers.length > 0) {
    const firstDiet = dietTriggers[0];

    switch (firstDiet) {
      case 'halal':
        return '이 요리는 할랄 인증을 받았나요? 돼지고기나 알코올이 없나요?';
      case 'vegan':
        return '이 요리에 동물성 재료(고기/달걀/우유/꿀)가 전혀 없나요?';
      case 'vegetarian':
        return '이 요리에 고기나 해산물이 들어가나요?';
      case 'lacto_vegetarian':
        return '이 요리에 고기, 생선, 계란이 들어가나요?';
      case 'ovo_vegetarian':
        return '이 요리에 고기, 생선, 유제품이 들어가나요?';
      case 'pesco_vegetarian':
        return '이 요리에 고기나 닭고기가 들어가나요?';
      case 'flexitarian':
        return '이 요리에 고기나 해산물이 들어가나요?';
      case 'kosher':
        return '이 요리는 코셔 규정을 따르나요?';
      case 'buddhist_vegetarian':
        return '이 요리에 고기나 마늘/양파가 들어가나요?';
      case 'gluten_free':
        return '이 요리에 밀가루나 글루텐이 들어가나요?';
      case 'pork_free':
        return '이 요리에 돼지고기나 돼지 육수가 들어가나요?';
      case 'alcohol_free':
        return '이 요리에 알코올(술, 와인 등)이 들어가나요?';
      case 'garlic_onion_free':
        return '이 요리에 마늘이나 양파가 들어가나요?';
      default:
        return '이 요리의 재료를 확인해주시겠어요?';
    }
  }

  // 사용자 알레르기/식단 기반 일반 질문
  if (userAllergies.length > 0) {
    const allergyLabels = userAllergies
      .slice(0, 2)
      .map((code) => ALLERGY_CODE_TO_LABEL[code] || code)
      .join(', ');
    return `이 요리에 ${allergyLabels} 등이 들어가나요?`;
  }

  if (userDiets.length > 0) {
    const dietLabel = DIET_CODE_TO_LABEL[userDiets[0]] || userDiets[0];
    return `이 요리가 ${dietLabel} 식단에 적합한가요?`;
  }

  return '이 요리의 주요 재료를 알려주시겠어요?';
}

// ============================================
// 결과 병합 함수
// ============================================

/**
 * QuickResult와 Gemini 결과를 병합하여 FinalResult 생성
 *
 * ⚠️ 중요: quickResult의 식단 트리거가 있으면 Gemini 결과에 반영
 * - Gemini가 식단 위반을 놓칠 수 있으므로 quickResult 트리거도 고려
 * - 최종 overall_status는 둘 중 더 위험한 쪽을 따름
 */
export function mergeQuickAndGemini(
  quickResult: QuickResult,
  geminiResult: {
    overall_status: SafetyLevel;
    results: unknown[];
    user_context?: { allergies: string[]; diet: string };
    db_enhanced?: boolean;
  }
): FinalResult {
  // quickResult에서 식단 관련 트리거 확인 (알레르기 코드가 아닌 식단 코드)
  const dietCodes = [
    'vegetarian',
    'vegan',
    'lacto_vegetarian',
    'ovo_vegetarian',
    'pesco_vegetarian',
    'flexitarian',
    'halal',
    'kosher',
    'buddhist_vegetarian',
    'gluten_free',
    'pork_free',
    'alcohol_free',
    'garlic_onion_free',
  ];
  const quickDietTriggers = quickResult.triggerCodes.filter((code) =>
    dietCodes.includes(code)
  );

  // quickResult가 DANGER이고 식단 트리거가 있으면 Gemini 결과에 반영
  const quickHasDietDanger =
    quickResult.level === 'DANGER' && quickDietTriggers.length > 0;

  // 최종 overall_status 결정 (더 위험한 쪽 선택)
  let finalOverallStatus: SafetyLevel = geminiResult.overall_status;

  if (quickHasDietDanger && geminiResult.overall_status === 'SAFE') {
    // Quick 판정에서 식단 위반 발견했지만 Gemini가 놓친 경우
    finalOverallStatus = 'DANGER';
    console.warn(
      '⚠️ [mergeQuickAndGemini] Quick 판정의 식단 트리거로 DANGER 상향:',
      quickDietTriggers
    );
  } else if (
    quickResult.level === 'DANGER' &&
    geminiResult.overall_status !== 'DANGER'
  ) {
    // Quick이 DANGER인데 Gemini가 아니면 최소 CAUTION으로 상향
    finalOverallStatus =
      geminiResult.overall_status === 'SAFE'
        ? 'CAUTION'
        : geminiResult.overall_status;
    console.warn(
      '⚠️ [mergeQuickAndGemini] Quick DANGER로 인해 상태 상향:',
      quickResult.triggerCodes
    );
  }

  return {
    menus: geminiResult.results,
    summary: finalOverallStatus,
    aiAnalysis: {
      ...geminiResult,
      overall_status: finalOverallStatus,
      quickDietTriggers:
        quickDietTriggers.length > 0 ? quickDietTriggers : undefined,
    },
    overall_status: finalOverallStatus,
    results: geminiResult.results,
    user_context: geminiResult.user_context,
    db_enhanced: geminiResult.db_enhanced,
  };
}
