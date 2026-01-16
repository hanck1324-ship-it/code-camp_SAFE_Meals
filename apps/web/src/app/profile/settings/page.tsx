'use client';

import { Loader2, Lock, ChevronLeft, Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button';
import { useSafetyCardAllergiesDietsLoad } from '@/features/profile/components/settings/hooks/index.submit-allergies-diets.hook';
import { useSafetyCardVerify } from '@/features/profile/components/safety-card/hooks/useSafetyCard';
import { SafetyProfileEditScreen } from '@/features/profile/components/settings/safety-profile-edit-screen';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * PIN 인증 화면 컴포넌트
 */
function PinVerificationScreen({
  onVerified,
  onBack,
}: {
  onVerified: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const { verifyPin, isVerifying, error, isLoading } = useSafetyCardVerify();

  const handlePinChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 0) {
      const newPin = pin.split('');
      newPin[index] = numericValue.slice(-1);
      setPin(newPin.join('').slice(0, 4));

      if (index < 3 && numericValue.length > 0) {
        const nextInput = document.querySelector(
          `input[data-settings-pin-index="${index + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      const newPin = pin.split('');
      newPin[index] = '';
      setPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[data-settings-pin-index="${index - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    if (pin.length === 4) {
      const success = await verifyPin(pin);
      if (success) {
        onVerified();
      } else {
        setPin('');
        const firstInput = document.querySelector(
          `input[data-settings-pin-index="0"]`
        ) as HTMLInputElement;
        firstInput?.focus();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2ECC71]/10 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 px-6 pb-4 pt-8 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">{t.enterSecurityPin || 'Enter PIN'}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <div className="mx-auto max-w-sm">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] shadow-lg shadow-[#2ECC71]/30">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-xl font-bold">{t.protectedAccess || 'Protected Access'}</h2>
            <p className="text-sm text-gray-500">
              {t.pinDescription || 'Enter your PIN to access safety settings'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-3 text-center text-red-600">
              {error}
            </div>
          )}

          {/* PIN Input */}
          <div className="mb-6 flex justify-center gap-4">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pin[index] || ''}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                data-settings-pin-index={index}
                className={`h-14 w-14 rounded-2xl border-2 text-center text-2xl ${
                  error
                    ? 'border-red-400 bg-red-50'
                    : pin[index]
                      ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                      : 'border-gray-300 bg-white'
                } transition-colors focus:border-[#2ECC71] focus:outline-none`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || isVerifying}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
          >
            {isVerifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t.unlock || 'Unlock'
            )}
          </Button>

          {/* Info Card */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white/60 p-4 backdrop-blur-sm">
            <div className="flex gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2ECC71]" />
              <p className="text-sm text-gray-700">
                {t.pinSecurityInfo || 'Your safety settings are protected. Enter your PIN to view or modify allergy and dietary preferences.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Supabase에서 알레르기/식단 데이터 로드
  const { loadAllergiesAndDiets, isLoading, allergies, diets } =
    useSafetyCardAllergiesDietsLoad();

  // 페이지 로드 시 및 편집 후 돌아왔을 때 데이터 가져오기
  // refresh 파라미터가 변경될 때마다 데이터 재로드
  const refreshKey = searchParams.get('refresh');

  useEffect(() => {
    if (isAuthenticated) {
      loadAllergiesAndDiets();
    }
  }, [loadAllergiesAndDiets, refreshKey, isAuthenticated]);

  // Supabase 데이터를 userProfile 형식으로 변환
  const userProfile = {
    allergies: allergies.map((a) => a.allergy_code),
    diets: diets.map((d) => d.diet_code),
  };

  // PIN 인증 전
  if (!isAuthenticated) {
    return (
      <RequireAuth>
        <PinVerificationScreen
          onVerified={() => setIsAuthenticated(true)}
          onBack={() => router.back()}
        />
      </RequireAuth>
    );
  }

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <SafetyProfileEditScreen
        userProfile={userProfile}
        onBack={() => router.back()}
        onEditAllergies={() => router.push('/onboarding/allergy?mode=edit')}
        onEditDiets={() => router.push('/onboarding/diet?mode=edit')}
        onEditSafetyCardPin={() =>
          router.push('/onboarding/safety-card?mode=edit')
        }
      />
    </RequireAuth>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
