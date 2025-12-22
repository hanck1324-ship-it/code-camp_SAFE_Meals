'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, ChevronLeft } from 'lucide-react';
import { Button } from '@/commons/components/button';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { translations } from '@/lib/translations';
import { RequireAuth } from '@/components/auth/require-auth';

export default function SafetyCardPage() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const t = translations[language] || translations['en'];

  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const onUnlock = () => {
    if (pin.length === 4) {
      setUnlocked(true);
    }
  };

  const allergy = '쌀'; // TODO: fetch from user profile
  const allergyEn = 'Rice';

  return (
    <RequireAuth>
      {unlocked ? (
        <div className="flex min-h-screen flex-col items-center bg-white px-4 pt-4">
          {/* Top bar */}
          <div className="mb-2 flex w-full items-center">
            <button onClick={() => router.back()} className="mr-2 p-2">
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
          <div className="mb-6 w-full max-w-md rounded-3xl border-2 border-red-400 p-6 text-center">
            <p className="whitespace-pre-wrap text-xl font-medium leading-relaxed">
              저는 <span className="font-semibold text-red-500">{allergy}</span>{' '}
              알레르기가 있습니다{'\n'}이 음식에{' '}
              <span className="font-semibold text-red-500">{allergy}</span>가
              들어있나요?
            </p>
          </div>

          {/* English message */}
          <div className="w-full max-w-md rounded-3xl bg-gray-50 p-4 text-center text-gray-700">
            I have{' '}
            <span className="font-semibold text-red-500">{allergyEn}</span>{' '}
            allergies. Does this food contain{' '}
            <span className="font-semibold text-red-500">{allergyEn}</span>?
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen flex-col items-center bg-[#f5fffa] px-4 pt-4">
          {/* Top bar */}
          <div className="mb-2 flex w-full items-center">
            <button onClick={() => router.back()} className="mr-2 p-2">
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
                        `input[data-pin-index="${i + 1}"]`
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
                      `input[data-pin-index="${i - 1}"]`
                    ) as HTMLInputElement;
                    prevInput?.focus();
                  }
                }}
                data-pin-index={i}
                className="h-14 w-14 rounded-2xl border-2 border-gray-200 bg-white text-center text-2xl font-medium focus:border-[#2ECC71] focus:outline-none"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <Button
            className="mb-8 h-12 w-full max-w-md rounded-2xl bg-[#2ECC71] font-semibold text-gray-900 hover:bg-[#27AE60] disabled:bg-green-200"
            disabled={pin.length < 4}
            onClick={onUnlock}
          >
            {t.unlock}
          </Button>

          {/* Info box */}
          <div className="flex w-full max-w-md items-start gap-2 rounded-2xl border border-gray-200 bg-white p-4">
            <ShieldAlert className="mt-1 h-5 w-5 text-green-600" />
            <p className="text-sm leading-relaxed text-gray-700">
              {t.pinSecurityInfo}
            </p>
          </div>

          <p className="mt-8 text-sm text-gray-400">{t.demoPin}</p>
        </div>
      )}
    </RequireAuth>
  );
}
