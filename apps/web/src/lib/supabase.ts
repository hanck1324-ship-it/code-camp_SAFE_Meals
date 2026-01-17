import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Supabase 클라이언트 인스턴스 반환
 * - 자동 토큰 갱신 활성화
 * - 세션 지속성 설정
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 .env.local 파일에 설정해주세요.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // 자동 토큰 갱신 활성화
        autoRefreshToken: true,
        // 세션 지속성 (localStorage 사용)
        persistSession: true,
        // 탭 간 세션 동기화
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

/**
 * 토큰 갱신 시도
 * 401 에러 발생 시 호출하여 토큰 갱신 후 재시도
 * @returns 갱신 성공 여부
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Supabase] 토큰 갱신 실패:', error.message);
      return false;
    }

    if (data.session) {
      console.log('[Supabase] 토큰 갱신 성공');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Supabase] 토큰 갱신 중 에러:', error);
    return false;
  }
}

/**
 * 현재 세션 유효성 확인
 * @returns 유효한 세션이 있으면 true
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return false;

    // 토큰 만료 시간 확인 (5분 여유)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const expiresAtMs = expiresAt * 1000;
      const now = Date.now();
      const bufferMs = 5 * 60 * 1000; // 5분

      if (expiresAtMs - now < bufferMs) {
        // 만료 임박 - 갱신 시도
        return await refreshSession();
      }
    }

    return true;
  } catch {
    return false;
  }
}

// 기존 코드와의 호환성을 위한 export
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});
