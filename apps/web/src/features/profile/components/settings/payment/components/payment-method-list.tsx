import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '../types';
import { Language, translations } from '@/lib/translations';
import { PaymentMethodCard } from './payment-method-card';

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  language: Language;
  onAdd: () => void;
  onDelete: (method: PaymentMethod) => void;
}

export function PaymentMethodList({
  paymentMethods,
  language,
  onAdd,
  onDelete,
}: PaymentMethodListProps) {
  const t = translations[language];

  return (
    <div className="px-6 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t.savedPaymentMethods || '저장된 결제 수단'}
        </h3>
        <Button
          onClick={onAdd}
          className="h-10 rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] px-4 text-white shadow-sm hover:from-[#27AE60] hover:to-[#229954]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t.addPaymentMethod || '결제 수단 추가'}
        </Button>
      </div>

      {paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              language={language}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="mb-2 text-sm font-medium text-gray-600">
            {t.noPaymentMethods || '저장된 결제 수단이 없습니다'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.addPaymentMethodToGetStarted || '결제 수단을 추가하여 시작하세요'}
          </p>
        </div>
      )}
    </div>
  );
}

