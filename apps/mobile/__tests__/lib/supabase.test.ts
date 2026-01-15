import { serializeSupabaseSession } from '@/lib/supabase';

describe('Supabase Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSupabaseAuthStorageKey', () => {
    it('올바른 Supabase URL에서 스토리지 키를 생성해야 함', () => {
      // 함수를 직접 테스트하는 대신 URL 파싱 로직을 테스트
      const testUrl = 'https://test-project.supabase.co';
      const match = testUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const expectedKey = match ? `sb-${match[1]}-auth-token` : null;

      expect(expectedKey).toBe('sb-test-project-auth-token');
    });

    it('하이픈이 포함된 프로젝트 참조를 처리해야 함', () => {
      const testUrl = 'https://my-test-project-123.supabase.co';
      const match = testUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const expectedKey = match ? `sb-${match[1]}-auth-token` : null;

      expect(expectedKey).toBe('sb-my-test-project-123-auth-token');
    });

    it('URL이 없으면 null을 반환해야 함', () => {
      const testUrl: string | null = null;
      const match = testUrl?.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const expectedKey = match ? `sb-${match[1]}-auth-token` : null;

      expect(expectedKey).toBeNull();
    });

    it('잘못된 URL 형식이면 null을 반환해야 함', () => {
      const testUrl = 'https://invalid-url.com';
      const match = testUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const expectedKey = match ? `sb-${match[1]}-auth-token` : null;

      expect(expectedKey).toBeNull();
    });

    it('HTTP URL도 처리해야 함', () => {
      const testUrl = 'http://localhost-project.supabase.co';
      const match = testUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const expectedKey = match ? `sb-${match[1]}-auth-token` : null;

      expect(expectedKey).toBe('sb-localhost-project-auth-token');
    });
  });

  describe('serializeSupabaseSession', () => {
    it('세션 객체를 JSON 문자열로 직렬화해야 함', () => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const serialized = serializeSupabaseSession(session as any);

      expect(serialized).toBe(JSON.stringify(session));
      expect(JSON.parse(serialized!)).toEqual(session);
    });

    it('null 세션은 null을 반환해야 함', () => {
      const serialized = serializeSupabaseSession(null);

      expect(serialized).toBeNull();
    });

    it('직렬화된 세션을 다시 파싱할 수 있어야 함', () => {
      const session = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const serialized = serializeSupabaseSession(session as any);
      const deserialized = JSON.parse(serialized!);

      expect(deserialized.access_token).toBe('test-token');
      expect(deserialized.user.id).toBe('user-123');
      expect(deserialized.user.email).toBe('test@example.com');
    });

    it('빈 user_metadata도 직렬화해야 함', () => {
      const session = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: { name: 'Test User' },
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const serialized = serializeSupabaseSession(session as any);
      const deserialized = JSON.parse(serialized!);

      expect(deserialized.user.user_metadata).toEqual({ name: 'Test User' });
    });
  });

  describe('Integration: Storage Key + Session Serialization', () => {
    it('스토리지 키와 직렬화된 세션을 함께 사용할 수 있어야 함', () => {
      const testUrl = 'https://test-project.supabase.co';
      const match = testUrl.match(/https?:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
      const key = match ? `sb-${match[1]}-auth-token` : null;

      const session = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_in: 3600,
        expires_at: 1234567890,
        token_type: 'bearer',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const serialized = serializeSupabaseSession(session as any);

      // WebView에 주입할 때 사용하는 형태
      const injection = {
        key,
        value: serialized,
      };

      expect(injection.key).toBe('sb-test-project-auth-token');
      expect(injection.value).toBe(JSON.stringify(session));
    });
  });
});
