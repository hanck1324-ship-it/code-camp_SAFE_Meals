import { ChevronLeft, CreditCard, Wallet, Receipt, Shield } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '@/lib/translations';

interface PaymentScreenProps {
  onBack: () => void;
  language: Language;
}

export function PaymentScreen({
  onBack,
  language,
}: PaymentScreenProps) {
  const t = translations[language];

  const [paymentMethods] = useState([
    {
      id: '1',
      type: 'card',
      name: t.paymentCard || '신용카드',
      last4: '1234',
      expiry: '12/25',
      isDefault: true,
    },
  ]);

  const paymentItems = [
    {
      icon: CreditCard,
      title: t.paymentMethods || '결제 수단',
      description: t.paymentMethodsDesc || '결제 수단 관리',
      color: '#2ECC71',
    },
    {
      icon: Wallet,
      title: t.paymentHistory || '결제 내역',
      description: t.paymentHistoryDesc || '최근 결제 내역 확인',
      color: '#3B82F6',
    },
    {
      icon: Receipt,
      title: t.invoices || '청구서',
      description: t.invoicesDesc || '청구서 다운로드 및 관리',
      color: '#F59E0B',
    },
    {
      icon: Shield,
      title: t.paymentSecurity || '결제 보안',
      description: t.paymentSecurityDesc || '결제 정보 보안 설정',
      color: '#E74C3C',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.payment || '결제'}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 px-6 py-6">
        {paymentItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <div
              key={index}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: item.color }} />
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h3 className="mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronLeft className="h-5 w-5 flex-shrink-0 rotate-180 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t.savedPaymentMethods || '저장된 결제 수단'}
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="font-medium">
                        {method.name} •••• {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t.expires || '만료'} {method.expiry}
                      </p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <span className="rounded-full bg-[#2ECC71]/10 px-3 py-1 text-xs font-medium text-[#2ECC71]">
                      {t.default || '기본'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs text-white">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.paymentInfo ||
                  '결제 정보는 안전하게 암호화되어 저장됩니다. 언제든지 결제 수단을 추가하거나 제거할 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
