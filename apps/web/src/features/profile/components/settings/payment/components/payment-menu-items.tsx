import { ChevronLeft, CreditCard, Wallet, Receipt, Shield } from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface PaymentMenuItemsProps {
  language: Language;
}

export function PaymentMenuItems({ language }: PaymentMenuItemsProps) {
  const t = translations[language];

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
  );
}

