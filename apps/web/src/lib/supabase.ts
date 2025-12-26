'use client';

import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';

// 클라이언트 전용 Supabase 인스턴스 (쿠키 기반 세션)
let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClientComponentClient();
  }
  return browserClient;
}

// 기존 Proxy export 유지 (기존 import 호환)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});
