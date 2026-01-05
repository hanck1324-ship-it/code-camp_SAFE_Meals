import { X, Smartphone, Check } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '@/lib/translations';
import { showToast } from '@/components/ui/toast';

interface EasyPaySelectionProps {
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

// 간편결제 제공자 목록
const EASY_PAY_PROVIDERS = {
  // 포트원 실제 연동 가능
  KAKAO: {
    id: 'KAKAO',
    name: '카카오페이',
    nameEn: 'Kakao Pay',
    icon: '💛',
    color: '#FEE500',
    textColor: '#000000',
    available: true, // 포트원 연동 가능
    portoneSupported: true,
  },
  NAVER: {
    id: 'NAVER',
    name: '네이버페이',
    nameEn: 'Naver Pay',
    icon: '🟢',
    color: '#03C75A',
    textColor: '#FFFFFF',
    available: true,
    portoneSupported: true,
  },
  TOSS: {
    id: 'TOSS',
    name: '토스페이',
    nameEn: 'Toss Pay',
    icon: '💙',
    color: '#0064FF',
    textColor: '#FFFFFF',
    available: true,
    portoneSupported: true,
  },
  PAYCO: {
    id: 'PAYCO',
    name: '페이코',
    nameEn: 'PAYCO',
    icon: '🔴',
    color: '#E64938',
    textColor: '#FFFFFF',
    available: true,
    portoneSupported: true,
  },

  // UI만 준비 (나중에 연동)
  SAMSUNG: {
    id: 'SAMSUNG',
    name: '삼성페이',
    nameEn: 'Samsung Pay',
    icon: '🔵',
    color: '#1428A0',
    textColor: '#FFFFFF',
    available: false, // 아직 연동 안 됨
    portoneSupported: false,
  },
  APPLE: {
    id: 'APPLE',
    name: 'Apple Pay',
    nameEn: 'Apple Pay',
    icon: '',
    color: '#000000',
    textColor: '#FFFFFF',
    available: false,
    portoneSupported: false,
  },
  GOOGLE: {
    id: 'GOOGLE',
    name: 'Google Pay',
    nameEn: 'Google Pay',
    icon: '🔵',
    color: '#4285F4',
    textColor: '#FFFFFF',
    available: false,
    portoneSupported: false,
  },
} as const;

type EasyPayProviderId = keyof typeof EASY_PAY_PROVIDERS;

export function EasyPaySelection({
  onClose,
  onSuccess,
  language,
}: EasyPaySelectionProps) {
  const t = translations[language];
  const [selectedProvider, setSelectedProvider] = useState<EasyPayProviderId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRegisterEasyPay = async () => {
    if (!selectedProvider || isProcessing) return;

    const provider = EASY_PAY_PROVIDERS[selectedProvider];

    // 포트원 연동 불가능한 경우
    if (!provider.portoneSupported) {
      showToast(
        'info',
        language === 'ko'
          ? `${provider.name}는 곧 지원 예정입니다.`
          : `${provider.nameEn} will be supported soon.`
      );
      return;
    }

    try {
      setIsProcessing(true);

      showToast(
        'info',
        language === 'ko'
          ? `${provider.name} 연동을 시작합니다...`
          : `Starting ${provider.nameEn} integration...`
      );

      // TODO: 포트원 간편결제 연동 구현
      // 현재는 데모 모드
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 임시로 성공 처리 (실제로는 포트원 API 호출)
      const registerResponse = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType: 'EASY_PAY',
          easyPayProvider: selectedProvider,
          easyPayAccount: `${provider.name} 계정`, // 실제로는 포트원에서 받아옴
        }),
      });

      if (!registerResponse.ok) {
        throw new Error('간편결제 등록 실패');
      }

      showToast(
        'success',
        language === 'ko'
          ? `${provider.name}가 등록되었습니다!`
          : `${provider.nameEn} has been registered!`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('[Easy Pay Registration] Error:', error);
      showToast(
        'error',
        language === 'ko'
          ? '간편결제 등록 중 오류가 발생했습니다.'
          : 'An error occurred during easy pay registration.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-[#2ECC71]" />
              <h2 className="text-lg sm:text-xl font-bold">
                {language === 'ko' ? '간편결제 선택' : 'Select Easy Pay'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 안내 메시지 */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-900">
              {language === 'ko'
                ? '사용하실 간편결제 서비스를 선택하세요. 선택 후 해당 서비스에서 인증을 진행합니다.'
                : 'Select your preferred easy pay service. Authentication will be processed through the selected service.'}
            </p>
          </div>

          {/* 포트원 연동 가능한 서비스 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>{language === 'ko' ? '🇰🇷 한국 간편결제' : '🇰🇷 Korean Easy Pay'}</span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                {language === 'ko' ? '연동 가능' : 'Available'}
              </span>
            </h3>
            <div className="space-y-2">
              {Object.values(EASY_PAY_PROVIDERS)
                .filter(provider => provider.portoneSupported)
                .map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id as EasyPayProviderId)}
                    disabled={isProcessing}
                    className={`w-full rounded-xl border-2 p-3 sm:p-4 text-left transition-all active:scale-[0.98] ${
                      selectedProvider === provider.id
                        ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                        style={{ backgroundColor: provider.color }}
                      >
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">
                          {language === 'ko' ? provider.name : provider.nameEn}
                        </p>
                        <p className="text-xs text-gray-600">
                          {language === 'ko' ? '즉시 연동 가능' : 'Ready to connect'}
                        </p>
                      </div>
                      {selectedProvider === provider.id && (
                        <Check className="h-6 w-6 flex-shrink-0 text-[#2ECC71]" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* 준비 중인 서비스 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>{language === 'ko' ? '🌍 글로벌 간편결제' : '🌍 Global Easy Pay'}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {language === 'ko' ? '준비 중' : 'Coming Soon'}
              </span>
            </h3>
            <div className="space-y-2">
              {Object.values(EASY_PAY_PROVIDERS)
                .filter(provider => !provider.portoneSupported)
                .map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id as EasyPayProviderId)}
                    disabled={isProcessing}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 p-3 sm:p-4 text-left opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                        style={{ backgroundColor: provider.color }}
                      >
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-600">
                          {language === 'ko' ? provider.name : provider.nameEn}
                        </p>
                        <p className="text-xs text-gray-500">
                          {language === 'ko' ? '곧 지원 예정' : 'Coming soon'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* 등록 버튼 */}
          {selectedProvider && (
            <button
              onClick={handleRegisterEasyPay}
              disabled={isProcessing || !EASY_PAY_PROVIDERS[selectedProvider].portoneSupported}
              className="w-full rounded-xl bg-[#2ECC71] px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-[#27AE60] active:bg-[#27AE60] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: '48px' }}
            >
              {isProcessing
                ? language === 'ko'
                  ? '처리 중...'
                  : 'Processing...'
                : language === 'ko'
                  ? `${EASY_PAY_PROVIDERS[selectedProvider].name} 연동하기`
                  : `Connect ${EASY_PAY_PROVIDERS[selectedProvider].nameEn}`}
            </button>
          )}

          {/* 안내 사항 */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-400">
                <span className="text-xs text-white">i</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  • {language === 'ko'
                    ? '간편결제 서비스 연동 시 해당 서비스의 인증이 필요합니다.'
                    : 'Authentication is required when connecting easy pay services.'}
                </p>
                <p>
                  • {language === 'ko'
                    ? '한 번 연동하면 다음부터 빠르게 결제할 수 있습니다.'
                    : 'Once connected, you can pay quickly next time.'}
                </p>
                <p>
                  • {language === 'ko'
                    ? '언제든지 연동을 해제할 수 있습니다.'
                    : 'You can disconnect at any time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
