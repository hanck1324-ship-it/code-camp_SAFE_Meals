import { X, CreditCard, Check } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '@/lib/translations';
import { issueBillingKey } from '@/lib/portone';
import { getSupabaseClient } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

interface PaymentMethodRegistrationProps {
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

export function PaymentMethodRegistration({
  onClose,
  onSuccess,
  language,
}: PaymentMethodRegistrationProps) {
  const t = translations[language];
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState('');

  const handleRegisterCard = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);

      showToast('info', language === 'ko' ? '카드 등록을 시작합니다...' : 'Starting card registration...');

      // 1. 사용자 정보 가져오기
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showToast('error', t.loginRequired || '로그인이 필요합니다.');
        return;
      }

      // 2. 빌링키 발급 (카드 등록)
      const response = await issueBillingKey(
        user.id,
        user.email || '',
        cardName || undefined
      );

      console.log('[Card Registration] Response:', response);

      // 3. 빌링키 발급 성공 처리
      if (response && response.code === 'ISSUED') {
        // 빌링키가 발급되었으면 서버에 저장
        const registerResponse = await fetch('/api/payment/methods/register-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billingKey: response.billingKey,
            cardInfo: {
              cardName: cardName || '카드',
            },
          }),
        });

        if (!registerResponse.ok) {
          throw new Error('카드 정보 저장 실패');
        }

        showToast(
          'success',
          language === 'ko'
            ? '카드가 성공적으로 등록되었습니다!'
            : 'Card registered successfully!'
        );

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else if (response && response.code === 'BILLING_KEY_ALREADY_EXISTS') {
        showToast(
          'warning',
          language === 'ko'
            ? '이미 등록된 카드입니다.'
            : 'This card is already registered.'
        );
      } else if (response && response.code === 'PAYMENT_CANCELLED') {
        showToast(
          'info',
          language === 'ko'
            ? '카드 등록이 취소되었습니다.'
            : 'Card registration was cancelled.'
        );
      } else {
        showToast(
          'error',
          language === 'ko'
            ? '카드 등록에 실패했습니다.'
            : 'Card registration failed.'
        );
        console.log('[Card Registration] Failed:', response);
      }
    } catch (error) {
      console.error('[Card Registration] Error:', error);
      showToast(
        'error',
        language === 'ko'
          ? '카드 등록 중 오류가 발생했습니다.'
          : 'An error occurred during card registration.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-[#2ECC71]" />
              <h2 className="text-lg sm:text-xl font-bold">
                {language === 'ko' ? '카드 등록' : 'Register Card'}
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
          <div className="rounded-2xl border-2 border-[#2ECC71] bg-gradient-to-br from-[#2ECC71]/10 to-white p-4">
            <div className="flex items-center gap-3 mb-2">
              <Check className="h-5 w-5 text-[#2ECC71]" />
              <h3 className="font-semibold text-[#2ECC71]">
                {language === 'ko' ? '안전한 카드 등록' : 'Secure Card Registration'}
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {language === 'ko'
                ? '카드 정보는 포트원을 통해 안전하게 암호화되어 저장됩니다. 카드 번호는 저장되지 않으며, 안전한 결제를 위한 토큰만 생성됩니다.'
                : 'Card information is securely encrypted and stored through PortOne. Card numbers are not stored, only secure payment tokens are generated.'}
            </p>
          </div>

          {/* 카드 이름 입력 (선택사항) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {language === 'ko' ? '카드 별칭 (선택사항)' : 'Card Nickname (Optional)'}
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder={language === 'ko' ? '예: 내 신한카드' : 'e.g., My Visa Card'}
              className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base focus:border-[#2ECC71] focus:outline-none"
              style={{ minHeight: '48px' }}
              disabled={isProcessing}
            />
            <p className="mt-1 text-xs text-gray-500">
              {language === 'ko'
                ? '등록한 카드를 쉽게 구분하기 위한 이름을 입력하세요.'
                : 'Enter a name to easily identify your registered card.'}
            </p>
          </div>

          {/* 등록 절차 안내 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {language === 'ko' ? '등록 절차' : 'Registration Process'}
            </h3>
            <div className="space-y-2">
              <div className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71] text-xs font-bold text-white">
                  1
                </div>
                <p className="text-sm text-gray-700">
                  {language === 'ko'
                    ? '아래 버튼을 클릭하여 카드 등록을 시작합니다'
                    : 'Click the button below to start card registration'}
                </p>
              </div>
              <div className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71] text-xs font-bold text-white">
                  2
                </div>
                <p className="text-sm text-gray-700">
                  {language === 'ko'
                    ? '포트원 결제 창에서 카드 정보를 입력합니다'
                    : 'Enter your card information in the PortOne payment window'}
                </p>
              </div>
              <div className="flex gap-3 rounded-xl bg-gray-50 p-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71] text-xs font-bold text-white">
                  3
                </div>
                <p className="text-sm text-gray-700">
                  {language === 'ko'
                    ? '등록 완료 후 결제에 사용할 수 있습니다'
                    : 'After registration, you can use it for payments'}
                </p>
              </div>
            </div>
          </div>

          {/* 등록 버튼 */}
          <button
            onClick={handleRegisterCard}
            disabled={isProcessing}
            className="w-full rounded-xl bg-[#2ECC71] px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-[#27AE60] active:bg-[#27AE60] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight: '48px' }}
          >
            {isProcessing
              ? language === 'ko'
                ? '처리 중...'
                : 'Processing...'
              : language === 'ko'
                ? '카드 등록하기'
                : 'Register Card'}
          </button>

          {/* 보안 안내 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <span className="text-xs text-white">i</span>
              </div>
              <div className="text-sm text-blue-900 space-y-1">
                <p>
                  • {language === 'ko'
                    ? '카드 정보는 포트원에 안전하게 암호화되어 저장됩니다.'
                    : 'Card information is securely encrypted and stored by PortOne.'}
                </p>
                <p>
                  • {language === 'ko'
                    ? '실제 카드 번호는 저장되지 않으며, 안전한 토큰만 생성됩니다.'
                    : 'Actual card numbers are not stored, only secure tokens are generated.'}
                </p>
                <p>
                  • {language === 'ko'
                    ? '언제든지 등록된 카드를 삭제할 수 있습니다.'
                    : 'You can delete registered cards at any time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
