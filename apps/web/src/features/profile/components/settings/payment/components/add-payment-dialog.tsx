import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PaymentMethodForm } from '../types';
import { Language, translations } from '@/lib/translations';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PaymentMethodForm;
  onFormChange: (form: PaymentMethodForm) => void;
  onAdd: () => void;
  language: Language;
}

export function AddPaymentDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onAdd,
  language,
}: AddPaymentDialogProps) {
  const t = translations[language];

  const isValid =
    form.cardNumber.length >= 16 &&
    form.expiry.length === 5 &&
    form.cvv.length === 3 &&
    form.cardholderName.length > 0;

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16 && /^\d*$/.test(cleaned)) {
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      onFormChange({ ...form, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    onFormChange({ ...form, expiry: cleaned });
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 3);
    onFormChange({ ...form, cvv: cleaned });
  };

  const handleCancel = () => {
    onOpenChange(false);
    onFormChange({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardholderName: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t.addPaymentMethod || '결제 수단 추가'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">
              {t.cardholderName || '카드 소유자 이름'}
            </Label>
            <Input
              id="cardholderName"
              placeholder={t.cardholderNamePlaceholder || '홍길동'}
              value={form.cardholderName}
              onChange={(e) =>
                onFormChange({ ...form, cardholderName: e.target.value })
              }
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cardNumber">
              {t.cardNumber || '카드 번호'}
            </Label>
            <Input
              id="cardNumber"
              placeholder={t.cardNumberPlaceholder || '1234 5678 9012 3456'}
              value={form.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              maxLength={19}
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">
                {t.expiryDate || '만료일'}
              </Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                maxLength={5}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">
                {t.cvv || 'CVV'}
              </Label>
              <Input
                id="cvv"
                placeholder="123"
                type="password"
                value={form.cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                maxLength={3}
                className="h-12 rounded-2xl"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="h-12 flex-1 rounded-2xl border-2 border-gray-200"
            >
              {t.cancel || '취소'}
            </Button>
            <Button
              onClick={onAdd}
              disabled={!isValid}
              className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-sm hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
            >
              {t.add || '추가'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

