import { X, Zap, Check } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '@/lib/translations';
import { PREMIUM_PRODUCTS, requestPayment } from '@/lib/portone';
import { getSupabaseClient } from '@/lib/supabase';

interface PremiumProductsModalProps {
  onClose: () => void;
  language: Language;
}

export function PremiumProductsModal({
  onClose,
  language,
}: PremiumProductsModalProps) {
  const t = translations[language];
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const products = [
    {
      ...PREMIUM_PRODUCTS.AD_FREE_MONTH,
      icon: '📱',
      features: [
        t.adFreeFeature1 || '모든 광고 제거',
        t.adFreeFeature2 || '빠른 로딩 속도',
        t.adFreeFeature3 || '깔끔한 인터페이스',
      ],
    },
    {
      ...PREMIUM_PRODUCTS.AD_FREE_YEAR,
      icon: '🎯',
      features: [
        t.adFreeFeature1 || '모든 광고 제거',
        t.adFreeFeature2 || '빠른 로딩 속도',
        t.adFreeFeature3 || '깔끔한 인터페이스',
        t.yearlyDiscount || '월 구독 대비 17% 할인',
      ],
      badge: t.bestValue || '최고 가치',
    },
    {
      ...PREMIUM_PRODUCTS.PREMIUM_FEATURES,
      icon: '⭐',
      features: [
        t.premiumFeature1 || 'AI 영양 분석',
        t.premiumFeature2 || '맞춤 식단 추천',
        t.premiumFeature3 || '상세 알레르기 정보',
        t.premiumFeature4 || '영구 사용 가능',
      ],
      badge: t.permanent || '영구',
    },
  ];

  const handlePurchase = async (productId: string) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setSelectedProduct(productId);

      // 1. 사용자 정보 가져오기
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert(t.loginRequired || '로그인이 필요합니다.');
        return;
      }

      // 2. 결제 요청
      const product = Object.values(PREMIUM_PRODUCTS).find(
        (p) => p.id === productId
      );
      if (!product) {
        throw new Error('상품 정보를 찾을 수 없습니다.');
      }

      const response = await requestPayment({
        productId: product.id,
        productName: product.name,
        amount: product.amount,
        buyerEmail: user.email || '',
        buyerName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      });

      // 3. 결제 성공 처리
      if (response.success && response.paymentId) {
        // 서버에 결제 검증 요청
        const verifyResponse = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: response.paymentId,
            amount: product.amount,
            productId: product.id,
          }),
        });

        if (!verifyResponse.ok) {
          throw new Error('결제 검증에 실패했습니다.');
        }

        const verifyData = await verifyResponse.json();

        alert(
          t.paymentSuccess ||
            `결제가 완료되었습니다.\n${product.name}\n만료일: ${new Date(verifyData.expiresAt).toLocaleDateString()}`
        );

        // 모달 닫기 및 페이지 새로고침
        onClose();
        window.location.reload();
      } else {
        // 결제 취소 또는 실패
        console.log('[Payment] Cancelled or failed:', response);
      }
    } catch (error) {
      console.error('[Payment] Error:', error);
      alert(
        t.paymentError || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsProcessing(false);
      setSelectedProduct(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-[#2ECC71]" />
              <h2 className="text-xl font-bold">
                {t.premiumProducts || '프리미엄 상품'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-4 p-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 transition-all hover:border-[#2ECC71] hover:shadow-lg"
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-[#2ECC71] px-3 py-1 text-xs font-bold text-white">
                    {product.badge}
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/5 text-4xl">
                  {product.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-bold">{product.name}</h3>

                  {/* Price */}
                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#2ECC71]">
                      ₩{product.amount.toLocaleString()}
                    </span>
                    {product.id === 'ad_free_month' && (
                      <span className="text-sm text-gray-500">/ 월</span>
                    )}
                    {product.id === 'ad_free_year' && (
                      <span className="text-sm text-gray-500">/ 년</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-4 space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 flex-shrink-0 text-[#2ECC71]" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchase(product.id)}
                    disabled={isProcessing}
                    className="w-full rounded-xl bg-[#2ECC71] px-6 py-3 font-semibold text-white transition-all hover:bg-[#27AE60] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing && selectedProduct === product.id
                      ? t.processing || '처리 중...'
                      : t.purchaseNow || '구매하기'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs text-white">i</span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                {t.paymentNotice1 ||
                  '• 결제는 포트원(구 아임포트)을 통해 안전하게 처리됩니다.'}
              </p>
              <p className="mb-2">
                {t.paymentNotice2 ||
                  '• 구매 후 즉시 프리미엄 기능이 활성화됩니다.'}
              </p>
              <p>
                {t.paymentNotice3 ||
                  '• 환불 정책은 고객센터를 통해 확인하실 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
