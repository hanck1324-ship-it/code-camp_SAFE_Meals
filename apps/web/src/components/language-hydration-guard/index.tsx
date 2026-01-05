'use client';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { Loader2 } from 'lucide-react';
import { useEffect, useCallback } from 'react';

/**
 * LanguageHydrationGuard Props 인터페이스
 */
interface LanguageHydrationGuardProps {
  children: React.ReactNode;
}

/**
 * LanguageHydrationGuard 컴포넌트
 *
 * zustand persist hydration이 완료될 때까지 로딩 UI를 표시하고,
 * 완료 후 children을 렌더링합니다.
 * 모든 페이지에서 언어 상태가 통일되도록 보장합니다.
 *
 * 모바일 앱(WebView)에서 탭 전환 시에도 언어가 동기화됩니다.
 *
 * @param {LanguageHydrationGuardProps} props - children을 포함하는 props
 * @returns {JSX.Element} 로딩 UI 또는 children
 *
 * @example
 * ```tsx
 * <LanguageHydrationGuard>
 *   <App />
 * </LanguageHydrationGuard>
 * ```
 */
export function LanguageHydrationGuard({
  children,
}: LanguageHydrationGuardProps) {
  const hydrated = useLanguageStore((state) => state.hydrated);
  const syncFromStorage = useLanguageStore((state) => state.syncFromStorage);

  // Ensure hydrated flag flips true once persist finishes, even if storage is empty
  useEffect(() => {
    const { setHydrated } = useLanguageStore.getState();

    if (useLanguageStore.persist?.hasHydrated?.()) {
      setHydrated(true);
      return;
    }

    const unsubscribe = useLanguageStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 페이지가 다시 보일 때 (탭 전환 등) localStorage에서 언어 동기화
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log(
          '[LanguageHydrationGuard] Page became visible, syncing language...'
        );
        syncFromStorage();
      }
    };

    // 네이티브 앱에서 포커스 이벤트도 감지
    const handleFocus = () => {
      console.log(
        '[LanguageHydrationGuard] Window focused, syncing language...'
      );
      syncFromStorage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncFromStorage]);

  if (!hydrated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        data-testid="language-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return <div data-testid="app-content">{children}</div>;
}
