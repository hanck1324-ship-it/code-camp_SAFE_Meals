import { CreditCard, Trash2 } from 'lucide-react';
import { PaymentMethod } from '../types';
import { Language, translations } from '@/lib/translations';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  language: Language;
  onDelete: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({
  method,
  language,
  onDelete,
}: PaymentMethodCardProps) {
  const t = translations[language];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2ECC71]/10">
            <CreditCard className="h-6 w-6 text-[#2ECC71]" />
          </div>
          <div>
            <p className="font-medium">
              {method.name} •••• {method.last4}
            </p>
            <p className="text-sm text-muted-foreground">
              {t.expires || '만료'} {method.expiry}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {method.isDefault && (
            <span className="rounded-full bg-[#2ECC71]/10 px-3 py-1 text-xs font-medium text-[#2ECC71]">
              {t.default || '기본'}
            </span>
          )}
          {!method.isDefault && (
            <button
              onClick={() => onDelete(method)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

