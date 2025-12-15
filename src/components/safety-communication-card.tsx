import { useState } from 'react';
import { Lock, AlertTriangle, X } from 'lucide-react';
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

export function SafetyCommunicationCard({ userProfile, language }: SafetyCommunicationCardProps) {
  const [showPinOverlay, setShowPinOverlay] = useState(true);
  const [pin, setPin] = useState('');
  const t = translations[language];
  const tKo = translations['ko']; // 한국어 번역 추가

  const handlePinSubmit = () => {
    if (pin.length === 4) {
      setShowPinOverlay(false);
      setPin('');
    }
  };

  // Get primary allergy for display
  const primaryAllergy = userProfile.allergies[0] || 'peanuts';
  const allergyText = t[primaryAllergy as keyof typeof t] || primaryAllergy;
  const allergyTextKo = tKo[primaryAllergy as keyof typeof tKo] || primaryAllergy;

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {/* Emergency-style Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Warning Symbol */}
        <div className="w-32 h-32 bg-gradient-to-br from-[#E74C3C] to-[#C0392B] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#E74C3C]/40 animate-pulse">
          <AlertTriangle className="w-16 h-16 text-white" />
        </div>

        {/* Large Korean Text - Always displayed first */}
        <div className="bg-white border-4 border-[#E74C3C] rounded-3xl p-8 shadow-2xl mb-6 max-w-md">
          <div className="text-center space-y-6">
            <p className="text-3xl leading-relaxed">
              {tKo.iHaveAllergy} <span className="text-[#E74C3C]">{allergyTextKo}</span> {tKo.allergyText}
            </p>
            <p className="text-3xl leading-relaxed">
              {tKo.doesThisFoodContain} <span className="text-[#E74C3C]">{allergyTextKo}</span>{tKo.containQuestion}
            </p>
          </div>
        </div>

        {/* User's Selected Language Translation */}
        {language !== 'ko' && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 max-w-md">
            <p className="text-center text-muted-foreground text-lg">
              {t.iHaveAllergy} <span className="text-[#E74C3C]">{allergyText}</span> {t.allergyText}.
              {t.doesThisFoodContain} <span className="text-[#E74C3C]">{allergyText}</span>{t.containQuestion}
            </p>
          </div>
        )}

        {/* Additional Allergies */}
        {userProfile.allergies.length > 1 && (
          <div className="mt-8 max-w-md w-full">
            {/* Korean Label */}
            <h3 className="text-center mb-3 text-muted-foreground">
              {tKo.otherAllergies}
            </h3>
            {/* User Language Label (if different) */}
            {language !== 'ko' && (
              <h3 className="text-center mb-3 text-muted-foreground text-sm">
                {t.otherAllergies}
              </h3>
            )}
            <div className="flex flex-wrap gap-2 justify-center">
              {userProfile.allergies.slice(1).map((allergy, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-[#E74C3C]/10 border-2 border-[#E74C3C] rounded-full"
                >
                  <div className="text-[#E74C3C] text-center">
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

      {/* PIN Overlay */}
      {showPinOverlay && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-6">
          <div className="w-full max-w-sm">
            <div className="w-20 h-20 bg-[#2ECC71] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-center mb-2">{t.enterSecurityPin}</h2>
            <p className="text-center text-muted-foreground mb-8">
              {t.pinDescription}
            </p>

            <div className="mb-6">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.enterPin}
                className="h-16 text-center text-3xl tracking-widest rounded-2xl border-2"
                autoFocus
              />
            </div>

            <Button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className="w-full h-14 rounded-full bg-[#2ECC71] hover:bg-[#27AE60] text-white text-lg"
            >
              {t.confirm}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {t.sensitiveHealthInfo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}