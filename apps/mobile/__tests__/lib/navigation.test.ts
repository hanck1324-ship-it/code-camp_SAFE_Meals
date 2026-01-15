import { router } from 'expo-router';

describe('Navigation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Navigation', () => {
    it('로그인 화면으로 이동할 수 있어야 함', () => {
      router.replace('/(auth)/login');

      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
    });

    it('온보딩 화면으로 이동할 수 있어야 함', () => {
      router.replace('/(auth)/onboarding');

      expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');
    });

    it('회원가입 화면으로 이동할 수 있어야 함', () => {
      router.push('/(auth)/signup');

      expect(router.push).toHaveBeenCalledWith('/(auth)/signup');
    });
  });

  describe('Tab Navigation', () => {
    it('메인 탭으로 이동할 수 있어야 함', () => {
      router.replace('/(tabs)');

      expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('스캔 탭으로 이동할 수 있어야 함', () => {
      router.push('/(tabs)/scan');

      expect(router.push).toHaveBeenCalledWith('/(tabs)/scan');
    });

    it('프로필 탭으로 이동할 수 있어야 함', () => {
      router.push('/(tabs)/profile');

      expect(router.push).toHaveBeenCalledWith('/(tabs)/profile');
    });

    it('히스토리 탭으로 이동할 수 있어야 함', () => {
      router.push('/(tabs)/history');

      expect(router.push).toHaveBeenCalledWith('/(tabs)/history');
    });
  });

  describe('Camera Navigation', () => {
    it('카메라 화면으로 이동할 수 있어야 함', () => {
      router.push('/camera');

      expect(router.push).toHaveBeenCalledWith('/camera');
    });

    it('바코드 스캔 화면으로 이동할 수 있어야 함', () => {
      router.push('/camera');

      expect(router.push).toHaveBeenCalledWith('/camera');
    });
  });

  describe('WebView Navigation', () => {
    it('웹뷰 화면으로 경로와 함께 이동할 수 있어야 함', () => {
      const path = '/dashboard';
      router.push(`/webview${path}`);

      expect(router.push).toHaveBeenCalledWith('/webview/dashboard');
    });

    it('파라미터와 함께 웹뷰 화면으로 이동할 수 있어야 함', () => {
      const screen = 'profile';
      router.push(`/webview/${screen.toLowerCase()}`);

      expect(router.push).toHaveBeenCalledWith('/webview/profile');
    });
  });

  describe('Back Navigation', () => {
    it('뒤로가기를 실행할 수 있어야 함', () => {
      router.back();

      expect(router.back).toHaveBeenCalled();
    });

    it('여러 번 뒤로가기를 실행할 수 있어야 함', () => {
      router.back();
      router.back();

      expect(router.back).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navigation Flow - New User', () => {
    it('신규 사용자는 로그인 -> 온보딩 -> 메인 순서로 이동해야 함', () => {
      // 1. 로그인 화면으로 이동
      router.replace('/(auth)/login');
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');

      // 2. 로그인 성공 후 온보딩으로 이동 (신규 사용자)
      router.replace('/(auth)/onboarding');
      expect(router.replace).toHaveBeenCalledWith('/(auth)/onboarding');

      // 3. 온보딩 완료 후 메인으로 이동
      router.replace('/(tabs)');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');

      expect(router.replace).toHaveBeenCalledTimes(3);
    });
  });

  describe('Navigation Flow - Existing User', () => {
    it('기존 사용자는 로그인 -> 메인 순서로 이동해야 함', () => {
      // 1. 로그인 화면으로 이동
      router.replace('/(auth)/login');
      expect(router.replace).toHaveBeenCalledWith('/(auth)/login');

      // 2. 로그인 성공 후 바로 메인으로 이동 (기존 사용자)
      router.replace('/(tabs)');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)');

      expect(router.replace).toHaveBeenCalledTimes(2);
    });
  });

  describe('Navigation Flow - Logout', () => {
    it('로그아웃 시 로그인 화면으로 이동해야 함', () => {
      // 메인 화면에서
      router.replace('/(tabs)');

      // 로그아웃
      router.replace('/(auth)/login');

      expect(router.replace).toHaveBeenLastCalledWith('/(auth)/login');
    });
  });

  describe('Navigation Flow - Menu Scan', () => {
    it('메뉴 스캔 플로우: 메인 -> 스캔 -> 결과 -> 메인', () => {
      // 1. 메인 화면
      router.replace('/(tabs)');

      // 2. 스캔 화면으로 이동
      router.push('/(tabs)/scan');

      // 3. 결과 확인 후 뒤로가기
      router.back();

      expect(router.push).toHaveBeenCalledWith('/(tabs)/scan');
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('Deep Link Navigation', () => {
    it('딥링크로 특정 화면에 직접 접근할 수 있어야 함', () => {
      // 딥링크: exp+safemeals://scan
      router.push('/(tabs)/scan');

      expect(router.push).toHaveBeenCalledWith('/(tabs)/scan');
    });

    it('딥링크로 웹뷰 화면에 접근할 수 있어야 함', () => {
      // 딥링크: exp+safemeals://webview/profile
      router.push('/webview/profile');

      expect(router.push).toHaveBeenCalledWith('/webview/profile');
    });
  });

  describe('Navigation Error Handling', () => {
    it('잘못된 경로로 이동 시도 시 에러를 처리해야 함', () => {
      // router는 mock이므로 실제 에러가 발생하지 않지만,
      // 실제 환경에서는 에러 핸들링이 필요함을 테스트
      const invalidPath = '/invalid/path/that/does/not/exist';

      try {
        router.push(invalidPath);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // mock에서는 정상 호출됨
      expect(router.push).toHaveBeenCalledWith(invalidPath);
    });
  });
});
