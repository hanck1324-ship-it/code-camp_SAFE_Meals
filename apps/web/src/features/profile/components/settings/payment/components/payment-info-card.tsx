import { Language, translations } from '@/lib/translations';

interface PaymentInfoCardProps {
  language: Language;
}

export function PaymentInfoCard({ language }: PaymentInfoCardProps) {
  const t = translations[language];

  return (
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
  );
}

