'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/commons/stores/useAppStore';
import { RequireAuth } from '@/components/auth/require-auth';
import { getSupabaseClient } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';

export default function SafetyCardOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { completeOnboarding } = useAppStore();
  const isEditMode = searchParams.get('mode') === 'edit';

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * PIN 입력 핸들러
   */
  const handlePinChange = (index: number, value: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 0) {
      const newPin = currentPin.split('');
      newPin[index] = numericValue.slice(-1);
      setCurrentPin(newPin.join('').slice(0, 4));

      // 다음 입력 필드로 포커스 이동
      if (index < 3 && numericValue.length > 0) {
        const nextInput = document.querySelector(
          `input[data-pin-index="${index + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      const newPin = currentPin.split('');
      newPin[index] = '';
      setCurrentPin(newPin.join(''));
    }
  };

  /**
   * Backspace 처리
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[data-pin-index="${index - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  /**
   * 첫 번째 PIN 생성 완료
   */
  const handleCreatePin = () => {
    if (pin.length === 4) {
      setError('');
      setStep('confirm');
    }
  };

  /**
   * PIN 확인 및 저장
   */
  const handleConfirmPin = async () => {
    if (confirmPin.length !== 4) return;

    if (pin !== confirmPin) {
      setError(t.pinMismatch);
      setConfirmPin('');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(t.loginRequired);
        return;
      }

      const { data: existingCards, error: fetchError } = await supabase
        .from('safety_cards')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (fetchError) {
        console.error('Safety card 조회 실패:', fetchError);
        setError(t.saveFailedRetry);
        return;
      }

      if (existingCards && existingCards.length > 0) {
        const { error: updateError } = await supabase
          .from('safety_cards')
          .update({ pin_code: pin })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Safety card 업데이트 실패:', updateError);
          setError(t.saveFailedRetry);
          return;
        }
      } else {
        // Safety card 생성
        const { error: insertError } = await supabase
          .from('safety_cards')
          .insert({
            user_id: user.id,
            pin_code: pin,
            message_ko:
              '저는 알레르기가 있습니다.\n이 음식에 알레르기 성분이 들어있나요?',
            message_en: 'I have allergies.\nDoes this food contain any allergens?',
            message_ja:
              '私はアレルギーがあります。\nこの食べ物にアレルゲンが含まれていますか?',
            message_zh: '我有过敏症。\n这种食物含有过敏原吗?',
          });

        if (insertError) {
          console.error('Safety card 저장 실패:', insertError);
          setError(t.saveFailedRetry);
          return;
        }
      }

      if (isEditMode) {
        router.replace('/profile/settings');
        return;
      }

      // 온보딩 완료
      completeOnboarding();

      // 네이티브 앱 감지: ReactNativeWebView 또는 isNativeApp 플래그 확인
      const isNativeApp = typeof window !== 'undefined' && (
        (window as any).ReactNativeWebView !== undefined ||
        (window as any).isNativeApp === true
      );

      console.log('[SafetyCard] 환경 감지:', {
        hasReactNativeWebView: typeof window !== 'undefined' && (window as any).ReactNativeWebView !== undefined,
        hasIsNativeAppFlag: typeof window !== 'undefined' && (window as any).isNativeApp === true,
        isNativeApp
      });

      if (isNativeApp) {
        // 네이티브 앱: ONBOARDING_COMPLETE 메시지 전송 (네이티브가 라우팅 처리)
        console.log('[SafetyCard] 네이티브 환경 - ONBOARDING_COMPLETE 메시지 전송');
        if ((window as any).SafeMealsBridge) {
          (window as any).SafeMealsBridge.postMessage({
            type: 'ONBOARDING_COMPLETE',
          });
        }
      } else {
        // 웹 환경: 직접 라우팅
        console.log('[SafetyCard] 웹 환경 - 홈으로 이동');
        router.replace('/');
      }
    } catch (err) {
      console.error('Safety card 저장 중 에러:', err);
      setError(t.saveFailedRetry);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 건너뛰기
   */
  const handleSkip = () => {
    if (isEditMode) {
      router.replace('/profile/settings');
      return;
    }

    completeOnboarding();

    // 네이티브 앱 감지: ReactNativeWebView 또는 isNativeApp 플래그 확인
    const isNativeApp = typeof window !== 'undefined' && (
      (window as any).ReactNativeWebView !== undefined ||
      (window as any).isNativeApp === true
    );

    console.log('[SafetyCard Skip] 환경 감지:', {
      hasReactNativeWebView: typeof window !== 'undefined' && (window as any).ReactNativeWebView !== undefined,
      hasIsNativeAppFlag: typeof window !== 'undefined' && (window as any).isNativeApp === true,
      isNativeApp
    });

    if (isNativeApp) {
      // 네이티브 앱: ONBOARDING_COMPLETE 메시지 전송 (네이티브가 라우팅 처리)
      console.log('[SafetyCard Skip] 네이티브 환경 - ONBOARDING_COMPLETE 메시지 전송');
      if ((window as any).SafeMealsBridge) {
        (window as any).SafeMealsBridge.postMessage({
          type: 'ONBOARDING_COMPLETE',
        });
      }
    } else {
      // 웹 환경: 직접 라우팅
      console.log('[SafetyCard Skip] 웹 환경 - 홈으로 이동');
      router.replace('/');
    }
  };

  const currentPin = step === 'create' ? pin : confirmPin;
  const title =
    step === 'create'
      ? isEditMode
        ? t.safetyCardPinChangeTitle
        : t.safetyCardPinSetupTitle
      : t.safetyCardPinConfirmTitle;
  const description =
    step === 'create'
      ? isEditMode
        ? t.safetyCardPinChangeDesc
        : t.safetyCardPinSetupDesc
      : t.safetyCardPinConfirmDesc;
  const actionLabel = isSaving
    ? t.saving
    : step === 'create'
      ? t.next
      : t.done;

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col items-center bg-white px-6 pt-12">
        {/* Icon */}
        <div className="mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] shadow-lg shadow-[#2ECC71]/20">
            <ShieldAlert className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="mb-8 max-w-sm text-center text-gray-600">
          {description}
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 w-full max-w-md rounded-xl bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        {/* PIN Input */}
        <div className="mb-8 flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <input
              key={i}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={currentPin[i] || ''}
              onChange={(e) => handlePinChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              data-pin-index={i}
              className="h-16 w-16 rounded-2xl border-2 border-gray-200 bg-white text-center text-2xl font-semibold focus:border-[#2ECC71] focus:outline-none"
              autoFocus={i === 0 && step === 'create'}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          <Button
            onClick={step === 'create' ? handleCreatePin : handleConfirmPin}
            disabled={
              currentPin.length < 4 || isSaving
            }
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-lg font-semibold text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
          >
            {actionLabel}
          </Button>

          {step === 'create' && !isEditMode && (
            <button
              onClick={handleSkip}
              className="w-full rounded-2xl py-3 text-gray-500 hover:text-gray-700"
            >
              {t.setUpLater}
            </button>
          )}

          {step === 'confirm' && (
            <button
              onClick={() => {
                setStep('create');
                setConfirmPin('');
                setError('');
              }}
              className="w-full rounded-2xl py-3 text-gray-500 hover:text-gray-700"
            >
              {t.reenterPin}
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 flex w-full max-w-md items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Lock className="mt-1 h-5 w-5 flex-shrink-0 text-[#2ECC71]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {t.safetyCardInfoTitle}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {t.safetyCardInfoDesc}
            </p>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
