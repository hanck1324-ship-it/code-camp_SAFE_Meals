import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SafetyCommunicationCardProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  language: Language;
}

export function SafetyCommunicationCard({
  userProfile,
  language,
}: SafetyCommunicationCardProps) {
  const [showPinOverlay, setShowPinOverlay] = useState(true);
  const [pin, setPin] = useState('');
  const t = translations[language];
  const tKo = translations['ko'];

  const handlePinSubmit = () => {
    if (pin.length === 4) {
      setShowPinOverlay(false);
      setPin('');
    }
  };

  const primaryAllergy = userProfile.allergies[0] || 'peanuts';
  const allergyText = t[primaryAllergy as keyof typeof t] || primaryAllergy;
  const allergyTextKo =
    tKo[primaryAllergy as keyof typeof tKo] || primaryAllergy;

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      {/* Card */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="mb-8 flex h-32 w-32 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-[#E74C3C] to-[#C0392B] shadow-2xl shadow-[#E74C3C]/40">
          <AlertTriangle className="h-16 w-16 text-white" />
        </div>

        <div className="mb-6 max-w-md rounded-3xl border-4 border-[#E74C3C] bg-white p-8 shadow-2xl">
          <div className="space-y-6 text-center">
            <p className="text-3xl leading-relaxed">
              {tKo.iHaveAllergy}{' '}
              <span className="text-[#E74C3C]">{allergyTextKo}</span>{' '}
              {tKo.allergyText}
            </p>
            <p className="text-3xl leading-relaxed">
              {tKo.doesThisFoodContain}{' '}
              <span className="text-[#E74C3C]">{allergyTextKo}</span>
              {tKo.containQuestion}
            </p>
          </div>
        </div>

        {language !== 'ko' && (
          <div className="max-w-md rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
            <p className="text-center text-lg text-muted-foreground">
              {t.iHaveAllergy}{' '}
              <span className="text-[#E74C3C]">{allergyText}</span>{' '}
              {t.allergyText}.{t.doesThisFoodContain}{' '}
              <span className="text-[#E74C3C]">{allergyText}</span>
              {t.containQuestion}
            </p>
          </div>
        )}

        {userProfile.allergies.length > 1 && (
          <div className="mt-8 w-full max-w-md">
            <h3 className="mb-3 text-center text-muted-foreground">
              {tKo.otherAllergies}
            </h3>
            {language !== 'ko' && (
              <h3 className="mb-3 text-center text-sm text-muted-foreground">
                {t.otherAllergies}
              </h3>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {userProfile.allergies.slice(1).map((allergy, index) => (
                <div
                  key={index}
                  className="rounded-full border-2 border-[#E74C3C] bg-[#E74C3C]/10 px-4 py-2"
                >
                  <div className="text-center text-[#E74C3C]">
                    <div>{tKo[allergy as keyof typeof tKo] || allergy}</div>
                    {language !== 'ko' && (
                      <div className="text-sm opacity-70">
                        {t[allergy as keyof typeof t] || allergy}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPinOverlay && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2ECC71] shadow-lg">
              <Lock className="h-10 w-10 text-white" />
            </div>

            <h2 className="mb-2 text-center">{t.enterSecurityPin}</h2>
            <p className="mb-8 text-center text-muted-foreground">
              {t.pinDescription}
            </p>

            <div className="mb-6">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                }
                placeholder={t.enterPin}
                className="h-16 rounded-2xl border-2 text-center text-3xl tracking-widest"
                autoFocus
              />
            </div>

            <Button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className="h-14 w-full rounded-full bg-[#2ECC71] text-lg text-white hover:bg-[#27AE60]"
            >
              {t.confirm}
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {t.sensitiveHealthInfo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
