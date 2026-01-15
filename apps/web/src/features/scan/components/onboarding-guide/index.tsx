'use client';

import { X, Camera, Sun, Maximize, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface OnboardingGuideProps {
  language?: 'ko' | 'en';
  onComplete: () => void;
}

/**
 * 온보딩 가이드 컴포넌트
 * - 첫 사용자에게 메뉴 스캔 사용법 안내
 * - 좋은 사진 촬영 팁 제공
 * - localStorage로 표시 여부 관리
 */
export function OnboardingGuide({
  language = 'ko',
  onComplete,
}: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Camera,
      titleKo: '메뉴판을 촬영하세요',
      titleEn: 'Take a photo of the menu',
      descKo: '카메라로 식당 메뉴판을 촬영하면 AI가 자동으로 분석해드립니다.',
      descEn:
        'Take a photo of the restaurant menu and AI will analyze it automatically.',
      image: '📸',
    },
    {
      icon: Sun,
      titleKo: '조명이 밝은 곳에서',
      titleEn: 'Use good lighting',
      descKo:
        '자연광이나 밝은 조명 아래에서 촬영하면 더 정확한 결과를 얻을 수 있어요.',
      descEn: 'Natural or bright lighting helps achieve more accurate results.',
      image: '💡',
    },
    {
      icon: Maximize,
      titleKo: '메뉴가 화면에 가득 차도록',
      titleEn: 'Fill the frame with menu',
      descKo:
        '메뉴판이 화면 중앙에 크게 오도록 촬영하고, 글자가 선명하게 보이는지 확인하세요.',
      descEn:
        'Center the menu in the frame and ensure text is clearly visible.',
      image: '🎯',
    },
    {
      icon: CheckCircle,
      titleKo: '준비 완료!',
      titleEn: 'Ready!',
      descKo: '이제 메뉴를 스캔하고 안전한 식사를 즐기세요!',
      descEn: 'Now scan menus and enjoy safe dining!',
      image: '✅',
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // 온보딩 완료 - localStorage에 저장
      localStorage.setItem('scan_onboarding_completed', 'true');
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('scan_onboarding_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Skip/Close Button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 flex items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          style={{ width: '36px', height: '36px' }}
          aria-label={language === 'ko' ? '건너뛰기' : 'Skip'}
        >
          <X
            style={{ width: '20px', height: '20px' }}
            className="text-gray-600"
          />
        </button>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                    ? 'bg-primary/50 w-2'
                    : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Icon/Emoji */}
        <div className="mb-6 flex justify-center">
          <div
            className="bg-primary/10 flex items-center justify-center rounded-full"
            style={{ width: '100px', height: '100px' }}
          >
            <span style={{ fontSize: '48px' }}>{currentStepData.image}</span>
          </div>
        </div>

        {/* Title */}
        <h2
          className="mb-3 text-center font-bold text-gray-900"
          style={{ fontSize: '24px', lineHeight: '1.3' }}
        >
          {language === 'ko'
            ? currentStepData.titleKo
            : currentStepData.titleEn}
        </h2>

        {/* Description */}
        <p
          className="mb-8 text-center leading-relaxed text-gray-600"
          style={{ fontSize: '16px' }}
        >
          {language === 'ko' ? currentStepData.descKo : currentStepData.descEn}
        </p>

        {/* Examples Section (Step 2만) */}
        {currentStep === 1 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-green-500 bg-green-50 p-3 text-center">
              <div className="mb-2 text-2xl">✅</div>
              <p className="text-xs font-medium text-green-700">
                {language === 'ko' ? '좋은 예시' : 'Good'}
              </p>
              <p className="mt-1 text-xs text-green-600">
                {language === 'ko' ? '밝고 선명' : 'Bright & Clear'}
              </p>
            </div>
            <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3 text-center">
              <div className="mb-2 text-2xl">❌</div>
              <p className="text-xs font-medium text-red-700">
                {language === 'ko' ? '나쁜 예시' : 'Bad'}
              </p>
              <p className="mt-1 text-xs text-red-600">
                {language === 'ko' ? '어둡고 흐림' : 'Dark & Blurry'}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="flex-1 rounded-xl bg-gray-100 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              style={{ minHeight: '52px', fontSize: '15px' }}
            >
              {language === 'ko' ? '건너뛰기' : 'Skip'}
            </button>
          )}
          <button
            onClick={handleNext}
            className={`hover:bg-primary/90 rounded-xl bg-primary font-semibold text-white shadow-md transition-colors active:scale-95 ${
              isLastStep ? 'flex-1' : 'flex-1'
            }`}
            style={{ minHeight: '52px', fontSize: '15px' }}
          >
            {isLastStep
              ? language === 'ko'
                ? '시작하기'
                : 'Get Started'
              : language === 'ko'
                ? '다음'
                : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 온보딩 완료 여부 확인 Hook
 */
export function useOnboardingStatus() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // localStorage 확인
    const completed = localStorage.getItem('scan_onboarding_completed');
    setShouldShowOnboarding(completed !== 'true');
    setIsChecking(false);
  }, []);

  const markAsCompleted = () => {
    localStorage.setItem('scan_onboarding_completed', 'true');
    setShouldShowOnboarding(false);
  };

  return { shouldShowOnboarding, isChecking, markAsCompleted };
}
