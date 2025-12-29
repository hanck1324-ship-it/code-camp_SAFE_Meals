import { CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '../types';
import { Language, translations } from '@/lib/translations';

interface DeletePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: PaymentMethod | null;
  onConfirm: () => void;
  language: Language;
}

export function DeletePaymentDialog({
  open,
  onOpenChange,
  method,
  onConfirm,
  language,
}: DeletePaymentDialogProps) {
  const t = translations[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t.deletePaymentMethod || '결제 수단 삭제'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t.deletePaymentMethodConfirm ||
              '이 결제 수단을 삭제하시겠습니까?'}
          </p>
          {method && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1 rounded-2xl border-2 border-gray-200"
            >
              {t.cancel || '취소'}
            </Button>
            <Button
              onClick={onConfirm}
              className="h-12 flex-1 rounded-2xl bg-red-500 text-white hover:bg-red-600"
            >
              {t.delete || '삭제'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

