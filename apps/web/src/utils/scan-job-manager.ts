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
import type { Language } from '@/lib/translations';

// ============================================
// 타입 정의
// ============================================

/** 위험도 등급 */
export type SafetyLevel = 'SAFE' | 'CAUTION' | 'DANGER';

/** 신뢰도 등급 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

const QUICK_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'es'] as const;
type QuickLanguage = (typeof QUICK_LANGUAGES)[number];

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
  /** 이미지 Storage 업로드 시간 (ms) */
  imageUploadMs?: number;
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

const ALLERGY_CODE_TO_LABEL_EN: Record<string, string> = {
  eggs: 'Eggs',
  milk: 'Milk/Dairy',
  peanuts: 'Peanuts',
  tree_nuts: 'Tree nuts',
  fish: 'Fish',
  shellfish: 'Shellfish',
  wheat: 'Wheat/Gluten',
  soy: 'Soy',
  sesame: 'Sesame',
  pork: 'Pork',
  beef: 'Beef',
  chicken: 'Chicken',
  lamb: 'Lamb',
  buckwheat: 'Buckwheat',
  peach: 'Peach',
  tomato: 'Tomato',
  sulfites: 'Sulfites',
  mustard: 'Mustard',
  celery: 'Celery',
  lupin: 'Lupin',
  mollusks: 'Mollusks',
  alcohol: 'Alcohol',
};

const ALLERGY_CODE_TO_LABEL_JA: Record<string, string> = {
  eggs: '卵',
  milk: '牛乳/乳製品',
  peanuts: 'ピーナッツ',
  tree_nuts: 'ナッツ類',
  fish: '魚',
  shellfish: '甲殻類/貝類',
  wheat: '小麦/グルテン',
  soy: '大豆',
  sesame: 'ごま',
  pork: '豚肉',
  beef: '牛肉',
  chicken: '鶏肉',
  lamb: '羊肉',
  buckwheat: 'そば',
  peach: '桃',
  tomato: 'トマト',
  sulfites: '亜硫酸塩',
  mustard: 'からし',
  celery: 'セロリ',
  lupin: 'ルピナス',
  mollusks: '軟体類',
  alcohol: 'アルコール',
};

const ALLERGY_CODE_TO_LABEL_ZH: Record<string, string> = {
  eggs: '鸡蛋',
  milk: '牛奶/乳制品',
  peanuts: '花生',
  tree_nuts: '树坚果',
  fish: '鱼',
  shellfish: '甲壳类/贝类',
  wheat: '小麦/麸质',
  soy: '大豆',
  sesame: '芝麻',
  pork: '猪肉',
  beef: '牛肉',
  chicken: '鸡肉',
  lamb: '羊肉',
  buckwheat: '荞麦',
  peach: '桃子',
  tomato: '番茄',
  sulfites: '亚硫酸盐',
  mustard: '芥末',
  celery: '芹菜',
  lupin: '羽扇豆',
  mollusks: '软体类',
  alcohol: '酒精',
};

const ALLERGY_CODE_TO_LABEL_ES: Record<string, string> = {
  eggs: 'Huevos',
  milk: 'Leche/Lácteos',
  peanuts: 'Cacahuetes',
  tree_nuts: 'Frutos secos',
  fish: 'Pescado',
  shellfish: 'Mariscos',
  wheat: 'Trigo/Gluten',
  soy: 'Soja',
  sesame: 'Sésamo',
  pork: 'Cerdo',
  beef: 'Carne de res',
  chicken: 'Pollo',
  lamb: 'Cordero',
  buckwheat: 'Trigo sarraceno',
  peach: 'Melocotón',
  tomato: 'Tomate',
  sulfites: 'Sulfitos',
  mustard: 'Mostaza',
  celery: 'Apio',
  lupin: 'Altramuz',
  mollusks: 'Moluscos',
  alcohol: 'Alcohol',
};

const DIET_CODE_TO_LABEL_EN: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  lacto_vegetarian: 'Lacto-vegetarian',
  ovo_vegetarian: 'Ovo-vegetarian',
  pesco_vegetarian: 'Pescatarian',
  flexitarian: 'Flexitarian',
  halal: 'Halal',
  kosher: 'Kosher',
  buddhist_vegetarian: 'Buddhist vegetarian',
  gluten_free: 'Gluten-free',
  pork_free: 'Pork-free',
  alcohol_free: 'Alcohol-free',
  garlic_onion_free: 'Garlic/onion-free',
};

const DIET_CODE_TO_LABEL_JA: Record<string, string> = {
  vegetarian: 'ベジタリアン',
  vegan: 'ヴィーガン',
  lacto_vegetarian: 'ラクト・ベジタリアン',
  ovo_vegetarian: 'オボ・ベジタリアン',
  pesco_vegetarian: 'ペスコ・ベジタリアン',
  flexitarian: 'フレキシタリアン',
  halal: 'ハラール',
  kosher: 'コーシャ',
  buddhist_vegetarian: '仏教菜食',
  gluten_free: 'グルテンフリー',
  pork_free: '豚肉不使用',
  alcohol_free: 'アルコール不使用',
  garlic_onion_free: 'にんにく/玉ねぎ不使用',
};

const DIET_CODE_TO_LABEL_ZH: Record<string, string> = {
  vegetarian: '素食',
  vegan: '纯素',
  lacto_vegetarian: '奶素',
  ovo_vegetarian: '蛋素',
  pesco_vegetarian: '鱼素',
  flexitarian: '弹性素食',
  halal: '清真',
  kosher: '犹太洁食',
  buddhist_vegetarian: '佛教素食',
  gluten_free: '无麸质',
  pork_free: '不含猪肉',
  alcohol_free: '无酒精',
  garlic_onion_free: '不含大蒜/洋葱',
};

const DIET_CODE_TO_LABEL_ES: Record<string, string> = {
  vegetarian: 'Vegetariano',
  vegan: 'Vegano',
  lacto_vegetarian: 'Lacto-vegetariano',
  ovo_vegetarian: 'Ovo-vegetariano',
  pesco_vegetarian: 'Pescetariano',
  flexitarian: 'Flexitariano',
  halal: 'Halal',
  kosher: 'Kosher',
  buddhist_vegetarian: 'Vegetariano budista',
  gluten_free: 'Sin gluten',
  pork_free: 'Sin cerdo',
  alcohol_free: 'Sin alcohol',
  garlic_onion_free: 'Sin ajo/cebolla',
};

const ALLERGY_CODE_TO_LABELS: Record<QuickLanguage, Record<string, string>> = {
  ko: ALLERGY_CODE_TO_LABEL,
  en: ALLERGY_CODE_TO_LABEL_EN,
  ja: ALLERGY_CODE_TO_LABEL_JA,
  zh: ALLERGY_CODE_TO_LABEL_ZH,
  es: ALLERGY_CODE_TO_LABEL_ES,
};

const DIET_CODE_TO_LABELS: Record<QuickLanguage, Record<string, string>> = {
  ko: DIET_CODE_TO_LABEL,
  en: DIET_CODE_TO_LABEL_EN,
  ja: DIET_CODE_TO_LABEL_JA,
  zh: DIET_CODE_TO_LABEL_ZH,
  es: DIET_CODE_TO_LABEL_ES,
};

const normalizeQuickLanguage = (language: Language): QuickLanguage =>
  QUICK_LANGUAGES.includes(language) ? language : 'en';

const getAllergyLabel = (code: string, language: Language): string => {
  const quickLanguage = normalizeQuickLanguage(language);
  const labels =
    ALLERGY_CODE_TO_LABELS[quickLanguage] || ALLERGY_CODE_TO_LABEL_EN;
  return labels[code] || ALLERGY_CODE_TO_LABEL_EN[code] || code;
};

const getDietLabel = (code: string, language: Language): string => {
  const quickLanguage = normalizeQuickLanguage(language);
  const labels = DIET_CODE_TO_LABELS[quickLanguage] || DIET_CODE_TO_LABEL_EN;
  return labels[code] || DIET_CODE_TO_LABEL_EN[code] || code;
};

const formatLabelList = (labels: string[], language: Language): string => {
  const quickLanguage = normalizeQuickLanguage(language);
  const separator =
    quickLanguage === 'ja' || quickLanguage === 'zh' ? '、' : ', ';
  return labels.join(separator);
};

const SUMMARY_TEXTS: Record<
  QuickLanguage,
  {
    ocrFailed: string;
    textTooShort: string;
    cautionKeyword: string;
    ocrLow: string;
    safe: string;
  }
> = {
  ko: {
    ocrFailed: '텍스트 인식에 실패했습니다. AI 분석 결과를 기다려주세요.',
    textTooShort: '메뉴 정보가 충분하지 않습니다. 직원에게 확인하세요.',
    cautionKeyword: '숨겨진 재료가 있을 수 있습니다. 직원에게 확인하세요.',
    ocrLow: '메뉴 정보가 명확하지 않습니다. 직원에게 확인을 권장합니다.',
    safe: '1차 검사 결과 위험 요소가 감지되지 않았습니다. 최종 분석을 기다려주세요.',
  },
  en: {
    ocrFailed: 'Text recognition failed. Please wait for the AI analysis.',
    textTooShort: 'Menu information is insufficient. Please ask the staff.',
    cautionKeyword: 'Hidden ingredients may be present. Please ask the staff.',
    ocrLow:
      'Menu information is unclear. We recommend confirming with the staff.',
    safe: 'No risk factors detected in the preliminary check. Please wait for the final analysis.',
  },
  ja: {
    ocrFailed: 'テキストの認識に失敗しました。AI分析の結果をお待ちください。',
    textTooShort:
      'メニュー情報が十分ではありません。スタッフに確認してください。',
    cautionKeyword:
      '隠れた材料が含まれている可能性があります。スタッフに確認してください。',
    ocrLow: 'メニュー情報が不明確です。スタッフへの確認をおすすめします。',
    safe: '一次検査で危険要素は検出されませんでした。最終分析をお待ちください。',
  },
  zh: {
    ocrFailed: '文本识别失败。请等待 AI 分析结果。',
    textTooShort: '菜单信息不足。请向店员确认。',
    cautionKeyword: '可能含有隐藏配料。请向店员确认。',
    ocrLow: '菜单信息不清晰，建议向店员确认。',
    safe: '初步检查未发现风险因素。请等待最终分析。',
  },
  es: {
    ocrFailed: 'No se pudo reconocer el texto. Espera el análisis de la IA.',
    textTooShort:
      'La información del menú es insuficiente. Consulta al personal.',
    cautionKeyword: 'Puede haber ingredientes ocultos. Consulta al personal.',
    ocrLow:
      'La información del menú no es clara. Se recomienda confirmar con el personal.',
    safe: 'No se detectaron riesgos en la revisión preliminar. Espera el análisis final.',
  },
};

const DANGER_SUMMARY_TEMPLATES: Record<
  QuickLanguage,
  (labels: string) => string
> = {
  ko: (labels) => `${labels} 포함 가능성이 높습니다. 직원에게 확인하세요.`,
  en: (labels) => `Likely contains ${labels}. Please ask the staff.`,
  ja: (labels) =>
    `${labels}が含まれている可能性が高いです。スタッフに確認してください。`,
  zh: (labels) => `很可能包含${labels}。请向店员确认。`,
  es: (labels) => `Es probable que contenga ${labels}. Consulta al personal.`,
};

const DEFAULT_STAFF_QUESTIONS: Record<
  QuickLanguage,
  {
    allergy: (labels: string) => string;
    diet: (label: string) => string;
    general: string;
  }
> = {
  ko: {
    allergy: (labels) => `이 요리에 ${labels} 등이 들어가나요?`,
    diet: (label) => `이 요리가 ${label} 식단에 적합한가요?`,
    general: '이 요리의 주요 재료를 알려주시겠어요?',
  },
  en: {
    allergy: (labels) => `Does this dish contain ${labels}?`,
    diet: (label) => `Is this dish suitable for a ${label} diet?`,
    general: 'Could you tell me the main ingredients of this dish?',
  },
  ja: {
    allergy: (labels) => `この料理に${labels}が入っていますか？`,
    diet: (label) => `この料理は${label}の食事に適していますか？`,
    general: 'この料理の主な材料を教えていただけますか？',
  },
  zh: {
    allergy: (labels) => `这道菜里有${labels}吗？`,
    diet: (label) => `这道菜适合${label}饮食吗？`,
    general: '可以告诉我这道菜的主要配料吗？',
  },
  es: {
    allergy: (labels) => `¿Este plato contiene ${labels}?`,
    diet: (label) => `¿Este plato es adecuado para una dieta ${label}?`,
    general: '¿Podría decirme los ingredientes principales de este plato?',
  },
};

const ALLERGY_QUESTION_DEFAULT: Record<
  QuickLanguage,
  (label: string) => string
> = {
  ko: (label) => `이 요리에 ${label}이(가) 들어가나요?`,
  en: (label) => `Does this dish contain ${label}?`,
  ja: (label) => `この料理に${label}が入っていますか？`,
  zh: (label) => `这道菜里有${label}吗？`,
  es: (label) => `¿Este plato contiene ${label}?`,
};

const ALLERGY_QUESTION_OVERRIDES: Record<
  QuickLanguage,
  Record<string, string>
> = {
  ko: {
    shellfish: '이 요리에 새우, 게, 랍스터 등 갑각류가 들어가나요?',
    pork: '육수나 조미료에 돼지고기가 들어가나요?',
    eggs: '이 요리에 계란이 들어가나요?',
    milk: '이 요리에 우유나 유제품이 들어가나요?',
  },
  en: {
    shellfish:
      'Does this dish contain shellfish like shrimp, crab, or lobster?',
    pork: 'Does the broth or seasoning contain pork?',
    eggs: 'Does this dish contain eggs?',
    milk: 'Does this dish contain milk or dairy?',
  },
  ja: {
    shellfish: 'この料理にエビ、カニ、ロブスターなどの甲殻類が入っていますか？',
    pork: 'だしや調味料に豚肉が使われていますか？',
    eggs: 'この料理に卵が入っていますか？',
    milk: 'この料理に牛乳や乳製品が入っていますか？',
  },
  zh: {
    shellfish: '这道菜里有虾、蟹、龙虾等甲壳类吗？',
    pork: '高汤或调味料里有猪肉吗？',
    eggs: '这道菜里有鸡蛋吗？',
    milk: '这道菜里有牛奶或乳制品吗？',
  },
  es: {
    shellfish:
      '¿Este plato contiene mariscos como camarón, cangrejo o langosta?',
    pork: '¿El caldo o el condimento contiene cerdo?',
    eggs: '¿Este plato contiene huevo?',
    milk: '¿Este plato contiene leche o lácteos?',
  },
};

const DIET_QUESTION_OVERRIDES: Record<QuickLanguage, Record<string, string>> = {
  ko: {
    halal: '이 요리는 할랄 인증을 받았나요? 돼지고기나 알코올이 없나요?',
    vegan: '이 요리에 동물성 재료(고기/달걀/우유/꿀)가 전혀 없나요?',
    vegetarian: '이 요리에 고기나 해산물이 들어가나요?',
    lacto_vegetarian: '이 요리에 고기, 생선, 계란이 들어가나요?',
    ovo_vegetarian: '이 요리에 고기, 생선, 유제품이 들어가나요?',
    pesco_vegetarian: '이 요리에 고기나 닭고기가 들어가나요?',
    flexitarian: '이 요리에 고기나 해산물이 들어가나요?',
    kosher: '이 요리는 코셔 규정을 따르나요?',
    buddhist_vegetarian: '이 요리에 고기나 마늘/양파가 들어가나요?',
    gluten_free: '이 요리에 밀가루나 글루텐이 들어가나요?',
    pork_free: '이 요리에 돼지고기나 돼지 육수가 들어가나요?',
    alcohol_free: '이 요리에 알코올(술, 와인 등)이 들어가나요?',
    garlic_onion_free: '이 요리에 마늘이나 양파가 들어가나요?',
  },
  en: {
    halal: 'Is this dish halal? Does it contain pork or alcohol?',
    vegan:
      'Does this dish contain any animal products (meat/eggs/dairy/honey)?',
    vegetarian: 'Does this dish contain meat or seafood?',
    lacto_vegetarian: 'Does this dish contain meat, fish, or eggs?',
    ovo_vegetarian: 'Does this dish contain meat, fish, or dairy?',
    pesco_vegetarian: 'Does this dish contain meat or poultry?',
    flexitarian: 'Does this dish contain meat or seafood?',
    kosher: 'Does this dish follow kosher guidelines?',
    buddhist_vegetarian: 'Does this dish contain meat, garlic, or onion?',
    gluten_free: 'Does this dish contain wheat or gluten?',
    pork_free: 'Does this dish contain pork or pork-based broth?',
    alcohol_free: 'Does this dish contain alcohol (wine, spirits, etc.)?',
    garlic_onion_free: 'Does this dish contain garlic or onion?',
  },
  ja: {
    halal: 'この料理はハラール認証ですか？豚肉やアルコールは含まれていますか？',
    vegan:
      'この料理に動物性食材（肉・卵・乳製品・はちみつ）は一切含まれていませんか？',
    vegetarian: 'この料理に肉や魚介類が入っていますか？',
    lacto_vegetarian: 'この料理に肉、魚、卵が入っていますか？',
    ovo_vegetarian: 'この料理に肉、魚、乳製品が入っていますか？',
    pesco_vegetarian: 'この料理に肉や鶏肉が入っていますか？',
    flexitarian: 'この料理に肉や魚介類が入っていますか？',
    kosher: 'この料理はコーシャの規定に従っていますか？',
    buddhist_vegetarian: 'この料理に肉やにんにく/玉ねぎが入っていますか？',
    gluten_free: 'この料理に小麦やグルテンが入っていますか？',
    pork_free: 'この料理に豚肉や豚骨だしが入っていますか？',
    alcohol_free:
      'この料理にアルコール（ワイン、蒸留酒など）が入っていますか？',
    garlic_onion_free: 'この料理ににんにくや玉ねぎが入っていますか？',
  },
  zh: {
    halal: '这道菜是清真的吗？是否含有猪肉或酒精？',
    vegan: '这道菜完全不含动物性食材（肉/蛋/奶/蜂蜜）吗？',
    vegetarian: '这道菜里有肉或海鲜吗？',
    lacto_vegetarian: '这道菜里有肉、鱼或鸡蛋吗？',
    ovo_vegetarian: '这道菜里有肉、鱼或乳制品吗？',
    pesco_vegetarian: '这道菜里有肉或禽肉吗？',
    flexitarian: '这道菜里有肉或海鲜吗？',
    kosher: '这道菜符合犹太洁食规定吗？',
    buddhist_vegetarian: '这道菜里有肉或大蒜/洋葱吗？',
    gluten_free: '这道菜里有小麦或麸质吗？',
    pork_free: '这道菜里有猪肉或猪骨高汤吗？',
    alcohol_free: '这道菜里含有酒精（葡萄酒、烈酒等）吗？',
    garlic_onion_free: '这道菜里有大蒜或洋葱吗？',
  },
  es: {
    halal: '¿Este plato es halal? ¿Contiene cerdo o alcohol?',
    vegan:
      '¿Este plato no contiene ningún producto animal (carne/huevo/lácteos/miel)?',
    vegetarian: '¿Este plato contiene carne o mariscos?',
    lacto_vegetarian: '¿Este plato contiene carne, pescado o huevo?',
    ovo_vegetarian: '¿Este plato contiene carne, pescado o lácteos?',
    pesco_vegetarian: '¿Este plato contiene carne o aves?',
    flexitarian: '¿Este plato contiene carne o mariscos?',
    kosher: '¿Este plato cumple con las normas kosher?',
    buddhist_vegetarian: '¿Este plato contiene carne o ajo/cebolla?',
    gluten_free: '¿Este plato contiene trigo o gluten?',
    pork_free: '¿Este plato contiene cerdo o caldo de cerdo?',
    alcohol_free: '¿Este plato contiene alcohol (vino, licores, etc.)?',
    garlic_onion_free: '¿Este plato contiene ajo o cebolla?',
  },
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
  buddhist_vegetarian: [...VEGETARIAN_BASE_KEYWORDS, ...GARLIC_ONION_KEYWORDS],
  gluten_free: ['밀', 'wheat', '글루텐', 'gluten', '빵', '면', '파스타'],
  pork_free: ['돼지', 'pork', '베이컨', '햄'],
  alcohol_free: [
    '알코올',
    '술',
    '맥주',
    '와인',
    '소주',
    'alcohol',
    'beer',
    'wine',
  ],
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
  language: Language = 'ko',
  ocrConfidence: ConfidenceLevel = 'medium',
  ocrFailed: boolean = false
): QuickResult {
  const quickLanguage = normalizeQuickLanguage(language);
  const summaryTextByLanguage = SUMMARY_TEXTS[quickLanguage];
  // 🚨 OCR API 완전 실패 시 조기 반환
  // 이 경우 텍스트가 없어 1차 판정 불가 → Gemini AI 분석에 의존해야 함
  if (ocrFailed && ocrText.trim().length === 0) {
    return {
      level: 'CAUTION',
      summaryText: summaryTextByLanguage.ocrFailed,
      triggerCodes: ['_OCR_FAILED'],
      triggerLabels: [],
      questionForStaff: generateDefaultStaffQuestion(
        userAllergies,
        userDiets,
        language
      ),
      confidence: 'low',
    };
  }

  // 🚨 텍스트가 너무 짧은 경우 (10자 미만) - 먼저 체크
  if (ocrText.trim().length < 10) {
    return {
      level: 'CAUTION',
      summaryText: summaryTextByLanguage.textTooShort,
      triggerCodes: ['_TEXT_TOO_SHORT'],
      triggerLabels: [],
      questionForStaff: generateDefaultStaffQuestion(
        userAllergies,
        userDiets,
        language
      ),
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
          triggerLabels.push(getAllergyLabel(allergyCode, language));
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
          triggerLabels.push(getDietLabel(dietCode, language));
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
    summaryText = DANGER_SUMMARY_TEMPLATES[quickLanguage](
      formatLabelList(triggerLabels, language)
    );
  } else if (hasCautionKeyword) {
    // 의심스러운 키워드 발견 → CAUTION
    level = 'CAUTION';
    summaryText = summaryTextByLanguage.cautionKeyword;
  } else if (ocrConfidence === 'low') {
    // OCR 품질이 낮음 → CAUTION
    level = 'CAUTION';
    summaryText = summaryTextByLanguage.ocrLow;
  } else {
    // 모든 조건 만족 → SAFE (보수적)
    level = 'SAFE';
    summaryText = summaryTextByLanguage.safe;
  }

  // 5. 질문 생성
  const questionForStaff = generateStaffQuestion(
    triggerCodes,
    dietTriggers,
    userAllergies,
    userDiets,
    language
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
  userDiets: string[],
  language: Language
): string {
  const quickLanguage = normalizeQuickLanguage(language);
  const templates = DEFAULT_STAFF_QUESTIONS[quickLanguage];
  // 사용자 알레르기 기반 질문
  if (userAllergies.length > 0) {
    const allergyLabels = userAllergies
      .slice(0, 2)
      .map((code) => getAllergyLabel(code, language));
    return templates.allergy(formatLabelList(allergyLabels, language));
  }

  // 사용자 식단 기반 질문
  if (userDiets.length > 0) {
    const dietLabel = getDietLabel(userDiets[0], language);
    return templates.diet(dietLabel);
  }

  // 프로필 없으면 일반 질문
  return templates.general;
}

/**
 * 직원에게 물어볼 질문 생성
 */
function generateStaffQuestion(
  triggerCodes: string[],
  dietTriggers: string[],
  userAllergies: string[],
  userDiets: string[],
  language: Language
): string {
  const quickLanguage = normalizeQuickLanguage(language);
  // 발견된 트리거가 있으면 그에 대해 질문
  if (triggerCodes.length > 0) {
    const firstTrigger = triggerCodes[0];
    const label = getAllergyLabel(firstTrigger, language);
    const override = ALLERGY_QUESTION_OVERRIDES[quickLanguage]?.[firstTrigger];
    if (override) return override;
    return ALLERGY_QUESTION_DEFAULT[quickLanguage](label);
  }

  // 식이제한 트리거가 있으면 그에 대해 질문
  if (dietTriggers.length > 0) {
    const firstDiet = dietTriggers[0];
    const override = DIET_QUESTION_OVERRIDES[quickLanguage]?.[firstDiet];
    if (override) return override;
    return DEFAULT_STAFF_QUESTIONS[quickLanguage].diet(
      getDietLabel(firstDiet, language)
    );
  }

  return generateDefaultStaffQuestion(userAllergies, userDiets, language);
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
