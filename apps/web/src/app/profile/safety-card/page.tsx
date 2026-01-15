'use client';

import { ShieldAlert, Lock, ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button-legacy';
import { AllergiesDietsDatabinding } from '@/features/profile/components/safety-card/allergies-diets-databinding';
import { useSafetyCardData } from '@/features/profile/components/safety-card/hooks/index.data.hook';
import { useSafetyCardVerify } from '@/features/profile/components/safety-card/hooks/index.submit.hook';
import { useTranslation } from '@/hooks/useTranslation';

import type { Language } from '@/commons/stores/useLanguageStore';
import type { SafetyCardData } from '@/features/profile/components/safety-card/hooks/index.data.hook';

/**
 * 언어별 메시지 필드 매핑
 */
const LANGUAGE_FIELD_MAP: Record<Language, keyof SafetyCardData> = {
  ko: 'message_ko',
  en: 'message_en',
  ja: 'message_ja',
  zh: 'message_zh',
  es: 'message_ko',
};

/**
 * 메시지 기본값 (데이터가 없을 때 사용)
 */
const DEFAULT_MESSAGES: Record<Language, string> = {
  ko: '저는 알레르기가 있습니다.\n이 음식에 알레르기 성분이 들어있나요?',
  en: 'I have allergies.\nDoes this food contain any allergens?',
  ja: '私はアレルギーがあります。\nこの食べ物にアレルゲンが含まれていますか?',
  zh: '我有过敏症。\n这种食物含有过敏原吗?',
  es: 'Tengo alergias.\n¿Este alimento contiene alérgenos?',
};

/**
 * Supabase에서 안전카드 데이터를 가져오는 함수
 */
async function fetchSafetyCardFromSupabase() {
  const { getSupabaseClient } = await import('@/lib/supabase');
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('safety_cards')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
  }

  return data;
}

export default function SafetyCardPage() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const [pin, setPin] = useState('');

  // Supabase 연동 PIN 검증 훅 사용
  const {
    verifyPin,
    isVerifying,
    error,
    isUnlocked,
    safetyCardData,
    isLoading,
  } = useSafetyCardVerify();

  // 안전카드 데이터 로드 훅 (React Query 사용)
  const {
    data: safetyCardQueryData,
    isLoading: isQueryLoading,
    isError: isQueryError,
    errorMessage: queryErrorMessage,
    isEmpty: isQueryEmpty,
    getMessage,
  } = useSafetyCardData({ enabled: isUnlocked });

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  /**
   * PIN 제출 핸들러
   */
  const onUnlock = async () => {
    if (pin.length === 4) {
      await verifyPin(pin);
    }
  };

  // 안전카드 데이터에서 메시지 가져오기
  const getCardMessage = (lang: Language): string => {
    const data = (safetyCardData ||
      safetyCardQueryData) as SafetyCardData | null;
    const fieldName = LANGUAGE_FIELD_MAP[lang] || 'message_ko';
    const message = data ? (data[fieldName] as string | null) : null;
    const trimmedMessage = (message || '').trim();

    if (trimmedMessage) {
      return trimmedMessage;
    }

    const fallbackKo = data?.message_ko?.trim();
    if (fallbackKo) {
      return fallbackKo;
    }

    return DEFAULT_MESSAGES[lang] || DEFAULT_MESSAGES.ko;
  };

  // 현재 언어/보조 언어 메시지
  const messagePrimary = getCardMessage(language);
  const secondaryLanguage: Language = language === 'en' ? 'ko' : 'en';
  const messageSecondary = getCardMessage(secondaryLanguage);

  return (
    <RequireAuth>
      <div data-testid="safety-card-page-container">
        {isUnlocked ? (
          // 잠금 해제 상태 - 데이터 로딩/표시
          isQueryLoading || isLoading ? (
            // 데이터 로딩 중
            <div
              className="flex min-h-screen flex-col items-center justify-center bg-white px-4"
              data-testid="safety-card-loading"
            >
              <Loader2 className="h-12 w-12 animate-spin text-red-500" />
              <p className="mt-4 text-gray-500">{t.loadingSafetyCardInfo}</p>
            </div>
          ) : isQueryError ? (
            // 데이터 로드 실패
            <div
              className="flex min-h-screen flex-col items-center justify-center bg-white px-4"
              data-testid="safety-card-error-message"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-12 w-12 text-red-500" />
              </div>
              <p className="mt-6 text-center text-lg text-red-600">
                {queryErrorMessage || t.failedToLoadData}
              </p>
              <button
                onClick={handleBack}
                className="mt-4 rounded-xl bg-gray-200 px-6 py-2 text-gray-700"
              >
                {t.goBack}
              </button>
            </div>
          ) : isQueryEmpty && !safetyCardData ? (
            // 데이터 없음
            <div
              className="flex min-h-screen flex-col items-center justify-center bg-white px-4"
              data-testid="safety-card-empty-message"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <ShieldAlert className="h-12 w-12 text-gray-400" />
              </div>
              <p className="mt-6 text-center text-lg text-gray-600">
                {t.noSafetyCardInfo}
              </p>
              <button
                onClick={handleBack}
                className="mt-4 rounded-xl bg-gray-200 px-6 py-2 text-gray-700"
              >
                {t.goBack}
              </button>
            </div>
          ) : (
            // 데이터 표시
            <div
              className="flex min-h-screen flex-col items-center bg-white px-4 pt-4"
              data-testid="safety-card-content"
            >
              {/* Top bar */}
              <div className="mb-2 flex w-full items-center">
                <button onClick={handleBack} className="mr-2 p-2">
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>

              {/* Icon */}
              <div className="mb-8 mt-12">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/90 shadow-lg shadow-red-500/30">
                  <ShieldAlert className="h-12 w-12 text-white" />
                </div>
              </div>

              {/* Korean message */}
              <div
                className="mb-6 w-full max-w-md rounded-3xl border-2 border-red-400 p-6 text-center"
                data-testid="safety-card-message-ko"
              >
                <p className="whitespace-pre-wrap text-xl font-medium leading-relaxed">
                  {messagePrimary}
                </p>
              </div>

              {/* 보조 언어 메시지 (영어 또는 한국어) */}
              {messageSecondary && messageSecondary !== messagePrimary && (
                <div
                  className="w-full max-w-md rounded-3xl bg-gray-50 p-4 text-center text-gray-700"
                  data-testid="safety-card-message-en"
                >
                  <p className="whitespace-pre-wrap text-base leading-relaxed">
                    {messageSecondary}
                  </p>
                </div>
              )}

              {/* 알레르기 및 식단 데이터 바인딩 */}
              <AllergiesDietsDatabinding />
            </div>
          )
        ) : (
          <div
            className="flex min-h-screen flex-col items-center bg-[#f5fffa] px-4 pt-4"
            data-testid="safety-card-pin-form"
          >
            {/* Top bar */}
            <div className="mb-2 flex w-full items-center">
              <button onClick={handleBack} className="mr-2 p-2">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-medium">
                {t.enterSecurityPin ?? 'Enter PIN'}
              </h1>
            </div>

            {/* Icon */}
            <div className="mb-6 mt-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                <Lock className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Title & description */}
            <h2 className="mb-2 text-xl font-semibold">{t.protectedAccess}</h2>
            <p className="mb-6 max-w-xs text-center text-gray-500">
              {t.pinDescription}
            </p>

            {/* Error message */}
            {error && (
              <div
                className="mb-4 w-full max-w-md rounded-xl bg-red-50 p-3 text-center text-red-600"
                data-testid="pin-error-message"
              >
                {error}
              </div>
            )}

            {/* PIN boxes */}
            <div className="mb-8 flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={pin[i] || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length > 0) {
                      const newPin = pin.split('');
                      newPin[i] = value.slice(-1);
                      setPin(newPin.join('').slice(0, 4));
                      // 다음 입력 필드로 포커스 이동
                      if (i < 3 && value.length > 0) {
                        const nextInput = document.querySelector(
                          `input[data-testid="pin-input-${i + 1}"]`
                        ) as HTMLInputElement;
                        nextInput?.focus();
                      }
                    } else {
                      const newPin = pin.split('');
                      newPin[i] = '';
                      setPin(newPin.join(''));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !pin[i] && i > 0) {
                      const prevInput = document.querySelector(
                        `input[data-testid="pin-input-${i - 1}"]`
                      ) as HTMLInputElement;
                      prevInput?.focus();
                    }
                  }}
                  data-testid={`pin-input-${i}`}
                  data-pin-index={i}
                  className="h-14 w-14 rounded-2xl border-2 border-gray-200 bg-white text-center text-2xl font-medium focus:border-[#2ECC71] focus:outline-none"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <Button
              className="mb-8 h-12 w-full max-w-md rounded-2xl bg-[#2ECC71] font-semibold text-gray-900 hover:bg-[#27AE60] disabled:bg-green-200"
              disabled={pin.length < 4 || isVerifying}
              onClick={onUnlock}
              data-testid="pin-submit-button"
            >
              {isVerifying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t.unlock
              )}
            </Button>

            {/* Info box */}
            <div className="flex w-full max-w-md items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4">
              <ShieldAlert className="mt-1 h-5 w-5 text-green-600" />
              <p className="text-sm leading-relaxed text-gray-700">
                {t.pinSecurityInfo}
              </p>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
