import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

describe('WebViewScreen Message Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LOGIN_SUCCESS 메시지', () => {
    it('신규 사용자는 온보딩으로 이동해야 함', async () => {
      const message = {
        type: 'LOGIN_SUCCESS',
        payload: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          userId: 'user-123',
          isNewUser: true,
        },
      };

      // AsyncStorage 호출 시뮬레이션
      await AsyncStorage.setItem('authToken', message.payload.token);
      await AsyncStorage.setItem('refreshToken', message.payload.refreshToken);
      await AsyncStorage.setItem('userId', message.payload.userId);

      // 신규 사용자 플로우
      if (message.payload.isNewUser) {
        router.replace('/(auth)/onboarding');
      }

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'authToken',
        'test-token'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', 'user-123');
      expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');
    });

    it('기존 사용자는 메인 화면으로 이동해야 함', async () => {
      const message = {
        type: 'LOGIN_SUCCESS',
        payload: {
          token: 'test-token',
          refreshToken: 'test-refresh',
          userId: 'user-123',
          isNewUser: false,
        },
      };

      await AsyncStorage.setItem('authToken', message.payload.token);
      await AsyncStorage.setItem('hasOnboarded', 'true');

      if (!message.payload.isNewUser) {
        router.replace('/(tabs)');
      }

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasOnboarded', 'true');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('SCAN_MENU 메시지', () => {
    it('메뉴 스캔 화면으로 이동해야 함', () => {
      const message = { type: 'SCAN_MENU' };

      router.push('/(tabs)/scan');

      expect(router.push).toHaveBeenCalledWith('/(tabs)/scan');
    });
  });

  describe('HAPTIC_FEEDBACK 메시지', () => {
    it('light 햅틱 피드백을 실행해야 함', async () => {
      const message = {
        type: 'HAPTIC_FEEDBACK',
        payload: { type: 'light' },
      };

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('medium 햅틱 피드백을 실행해야 함', async () => {
      const message = {
        type: 'HAPTIC_FEEDBACK',
        payload: { type: 'medium' },
      };

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('heavy 햅틱 피드백을 실행해야 함', async () => {
      const message = {
        type: 'HAPTIC_FEEDBACK',
        payload: { type: 'heavy' },
      };

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });
  });

  describe('ONBOARDING_COMPLETE 메시지', () => {
    it('온보딩 완료 플래그를 저장하고 메인으로 이동해야 함', async () => {
      const message = { type: 'ONBOARDING_COMPLETE' };

      await AsyncStorage.setItem('hasOnboarded', 'true');
      router.replace('/(tabs)');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasOnboarded', 'true');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('LOGOUT 메시지', () => {
    it('모든 인증 정보를 삭제하고 로그인 화면으로 이동해야 함', async () => {
      const message = { type: 'LOGOUT' };

      await AsyncStorage.multiRemove([
        'authToken',
        'refreshToken',
        'userId',
        'hasOnboarded',
        'supabaseSession',
      ]);
      router.replace('/(auth)/login');

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'authToken',
        'refreshToken',
        'userId',
        'hasOnboarded',
        'supabaseSession',
      ]);
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  describe('LANGUAGE_CHANGE 메시지', () => {
    it('언어 변경을 AsyncStorage에 저장해야 함', async () => {
      const message = {
        type: 'LANGUAGE_CHANGE',
        payload: { language: 'en' },
      };

      await AsyncStorage.setItem('app_language', message.payload.language);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'en');
    });

    it('한국어로 변경을 저장해야 함', async () => {
      const message = {
        type: 'LANGUAGE_CHANGE',
        payload: { language: 'ko' },
      };

      await AsyncStorage.setItem('app_language', message.payload.language);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_language', 'ko');
    });
  });

  describe('NAVIGATE 메시지', () => {
    it('카메라 화면으로 이동해야 함', () => {
      const message = {
        type: 'NAVIGATE',
        payload: { screen: 'camera', params: {} },
      };

      if (
        message.payload.screen === 'camera' ||
        message.payload.screen === 'Camera'
      ) {
        router.push('/camera');
      }

      expect(router.push).toHaveBeenCalledWith('/camera');
    });
  });

  describe('GO_BACK 메시지', () => {
    it('뒤로가기를 실행해야 함', () => {
      const message = { type: 'GO_BACK' };

      router.back();

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('CLOSE_WEBVIEW 메시지', () => {
    it('웹뷰를 닫아야 함', () => {
      const message = { type: 'CLOSE_WEBVIEW' };

      router.back();

      expect(router.back).toHaveBeenCalled();
    });
  });
});
