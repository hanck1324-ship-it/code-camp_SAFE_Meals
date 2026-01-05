import { ChevronLeft, Lock, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface SafetyCardPinScreenProps {
  onBack: () => void;
  onPinCorrect: () => void;
}

export function SafetyCardPinScreen({
  onBack,
  onPinCorrect,
}: SafetyCardPinScreenProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (index === 3 && value) {
      setTimeout(() => handleSubmit([...newPin.slice(0, 3), value]), 100);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (currentPin: string[] = pin) => {
    const pinString = currentPin.join('');

    // Mock PIN verification (in real app, this would be secure)
    if (pinString === '1234' || pinString.length === 4) {
      onPinCorrect();
    } else {
      setError(true);
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2ECC71]/10 to-white">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white/80 px-6 pb-4 pt-8 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.enterSecurityPin}</h2>
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
            <h2 className="mb-2">{t.protectedAccess || 'Protected Access'}</h2>
            <p className="text-sm text-muted-foreground">
              {t.pinDescription ||
                'Enter your 4-digit PIN to view your safety card'}
            </p>
          </div>

          {/* PIN Input */}
          <div className="mb-6 flex justify-center gap-4">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pin[index]}
                onChange={(e) => handlePinInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-14 w-14 rounded-2xl border-2 text-center text-2xl ${
                  error
                    ? 'border-[#E74C3C] bg-[#E74C3C]/5'
                    : pin[index]
                      ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                      : 'border-gray-300 bg-white'
                } transition-colors focus:border-[#2ECC71] focus:outline-none`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 text-center">
              <p className="text-sm text-[#E74C3C]">
                {t.incorrectPin || 'Incorrect PIN. Please try again.'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={() => handleSubmit()}
            disabled={pin.join('').length !== 4}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
          >
            {t.unlock || 'Unlock'}
          </Button>

          {/* Info Card */}
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white/60 p-4 backdrop-blur-sm">
            <div className="flex gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2ECC71]" />
              <div>
                <p className="text-sm text-gray-700">
                  {t.pinSecurityInfo ||
                    'Your safety card contains sensitive allergy information. The PIN ensures only you can share it with restaurant staff.'}
                </p>
              </div>
            </div>
          </div>

          {/* Demo Hint */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t.demoPin || 'Demo: Use any 4-digit PIN'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
