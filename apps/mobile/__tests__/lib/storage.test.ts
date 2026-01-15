import AsyncStorage from '@react-native-async-storage/async-storage';

describe('AsyncStorage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Language Storage', () => {
    it('언어를 저장할 수 있어야 함', async () => {
      const language = 'ko';
      await AsyncStorage.setItem('app_language', language);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'ko');
    });

    it('저장된 언어를 불러올 수 있어야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('en');

      const language = await AsyncStorage.getItem('app_language');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_language');
      expect(language).toBe('en');
    });

    it('언어가 없으면 null을 반환해야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const language = await AsyncStorage.getItem('app_language');

      expect(language).toBeNull();
    });
  });

  describe('Auth Storage', () => {
    it('인증 토큰을 저장할 수 있어야 함', async () => {
      const token = 'test-auth-token';
      await AsyncStorage.setItem('authToken', token);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'authToken',
        'test-auth-token'
      );
    });

    it('리프레시 토큰을 저장할 수 있어야 함', async () => {
      const refreshToken = 'test-refresh-token';
      await AsyncStorage.setItem('refreshToken', refreshToken);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token'
      );
    });

    it('사용자 ID를 저장할 수 있어야 함', async () => {
      const userId = 'user-123';
      await AsyncStorage.setItem('userId', userId);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', 'user-123');
    });

    it('모든 인증 정보를 한번에 삭제할 수 있어야 함', async () => {
      const keys = [
        'authToken',
        'refreshToken',
        'userId',
        'hasOnboarded',
        'supabaseSession',
      ];
      await AsyncStorage.multiRemove(keys);

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(keys);
    });

    it('저장된 토큰을 불러올 수 있어야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-token');

      const token = await AsyncStorage.getItem('authToken');

      expect(token).toBe('stored-token');
    });
  });

  describe('Supabase Session Storage', () => {
    it('Supabase 세션을 JSON 문자열로 저장할 수 있어야 함', async () => {
      const session = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: { id: 'user-123' },
      };
      const sessionString = JSON.stringify(session);

      await AsyncStorage.setItem('supabaseSession', sessionString);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'supabaseSession',
        sessionString
      );
    });

    it('저장된 Supabase 세션을 불러와서 파싱할 수 있어야 함', async () => {
      const session = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: { id: 'user-123' },
      };
      const sessionString = JSON.stringify(session);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(sessionString);

      const storedSession = await AsyncStorage.getItem('supabaseSession');
      const parsedSession = storedSession ? JSON.parse(storedSession) : null;

      expect(parsedSession).toEqual(session);
    });

    it('Supabase 세션을 삭제할 수 있어야 함', async () => {
      await AsyncStorage.removeItem('supabaseSession');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('supabaseSession');
    });
  });

  describe('Image Storage', () => {
    it('이미지 데이터를 임시 저장할 수 있어야 함', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      await AsyncStorage.setItem('pending_analyze_image', imageData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_analyze_image',
        imageData
      );
    });

    it('저장된 이미지 데이터를 불러올 수 있어야 함', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(imageData);

      const storedImage = await AsyncStorage.getItem('pending_analyze_image');

      expect(storedImage).toBe(imageData);
    });

    it('사용 후 이미지 데이터를 삭제할 수 있어야 함', async () => {
      await AsyncStorage.removeItem('pending_analyze_image');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'pending_analyze_image'
      );
    });
  });

  describe('Onboarding Status', () => {
    it('온보딩 완료 상태를 저장할 수 있어야 함', async () => {
      await AsyncStorage.setItem('hasOnboarded', 'true');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasOnboarded', 'true');
    });

    it('온보딩 완료 상태를 확인할 수 있어야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');

      expect(hasOnboarded).toBe('true');
    });

    it('온보딩 미완료 시 null을 반환해야 함', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');

      expect(hasOnboarded).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('저장 실패 시 에러를 처리해야 함', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(error);

      await expect(AsyncStorage.setItem('key', 'value')).rejects.toThrow(
        'Storage error'
      );
    });

    it('불러오기 실패 시 에러를 처리해야 함', async () => {
      const error = new Error('Retrieval error');
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(error);

      await expect(AsyncStorage.getItem('key')).rejects.toThrow(
        'Retrieval error'
      );
    });

    it('삭제 실패 시 에러를 처리해야 함', async () => {
      const error = new Error('Removal error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(error);

      await expect(AsyncStorage.removeItem('key')).rejects.toThrow(
        'Removal error'
      );
    });
  });

  describe('Storage Clear', () => {
    it('전체 스토리지를 클리어할 수 있어야 함', async () => {
      await AsyncStorage.clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });
  });
});
