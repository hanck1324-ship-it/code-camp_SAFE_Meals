import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * React Native에서 Supabase 클라이언트를 생성한다.
 * - AsyncStorage를 auth storage로 사용
 * - URL/KEY는 EXPO_PUBLIC_* 환경 변수에서 주입
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase 환경 변수가 없습니다. EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Supabase가 localStorage에 세션을 저장할 때 사용하는 key(sb-<project-ref>-auth-token)를 계산한다.
 * WebView 주입용으로 사용한다.
 */
export function getSupabaseAuthStorageKey(): string | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const match = supabaseUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  if (!match) return null;

  return `sb-${match[1]}-auth-token`;
}

/**
 * WebView에 넘겨줄 수 있도록 Supabase 세션을 직렬화한다.
 */
export function serializeSupabaseSession(session: Session | null): string | null {
  if (!session) return null;

  return JSON.stringify({
    currentSession: session,
    expiresAt: session.expires_at,
  });
}
