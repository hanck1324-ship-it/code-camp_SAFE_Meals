'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { PaymentMethod, PaymentMethodForm } from './types';
import { PaymentMethodList } from './components/payment-method-list';
import { AddPaymentDialog } from './components/add-payment-dialog';
import { DeletePaymentDialog } from './components/delete-payment-dialog';
import { PaymentMenuItems } from './components/payment-menu-items';
import { PaymentInfoCard } from './components/payment-info-card';
import { TravelPass } from './components/travel-pass';

interface PaymentScreenProps {
  onBack: () => void;
  language: Language;
}

export function PaymentScreen({
  onBack,
  language,
}: PaymentScreenProps) {
  const t = translations[language];

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: t.paymentCard || '신용카드',
      last4: '1234',
      expiry: '12/25',
      isDefault: true,
    },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  
  const [newMethod, setNewMethod] = useState<PaymentMethodForm>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: '',
  });

  const handleAddPaymentMethod = () => {
    if (
      newMethod.cardNumber.length >= 16 &&
      newMethod.expiry.length === 5 &&
      newMethod.cvv.length === 3 &&
      newMethod.cardholderName
    ) {
      const last4 = newMethod.cardNumber.slice(-4);
      const newId = String(Date.now());
      const newPaymentMethod: PaymentMethod = {
        id: newId,
        type: 'card',
        name: t.paymentCard || '신용카드',
        last4: last4,
        expiry: newMethod.expiry,
        isDefault: paymentMethods.length === 0,
      };
      setPaymentMethods([...paymentMethods, newPaymentMethod]);
      setShowAddDialog(false);
      setNewMethod({
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardholderName: '',
      });
    }
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (methodToDelete) {
      setPaymentMethods(
        paymentMethods.filter((m) => m.id !== methodToDelete.id)
      );
      setShowDeleteDialog(false);
      setMethodToDelete(null);
    }
  };

  const handlePurchaseTravelPass = (
    startDate: Date,
    endDate: Date,
    totalPrice: number
  ) => {
    // TODO: 실제 결제 API 호출
    console.log('Travel Pass Purchase:', {
      startDate,
      endDate,
      totalPrice,
    });
    // 결제 성공 후 처리
    alert(
      `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')} 기간권이 구매되었습니다. (${totalPrice.toLocaleString()}원)`
    );
  };

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

      {/* Travel Pass Section */}
      <TravelPass
        language={language}
        onPurchase={handlePurchaseTravelPass}
      />

      {/* Payment Menu Items */}
      <PaymentMenuItems language={language} />

      {/* Payment Methods List */}
      <PaymentMethodList
        paymentMethods={paymentMethods}
        language={language}
        onAdd={() => setShowAddDialog(true)}
        onDelete={handleDeletePaymentMethod}
      />

      {/* Info Card */}
      <PaymentInfoCard language={language} />

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        form={newMethod}
        onFormChange={setNewMethod}
        onAdd={handleAddPaymentMethod}
        language={language}
      />

      {/* Delete Payment Dialog */}
      <DeletePaymentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        method={methodToDelete}
        onConfirm={handleConfirmDelete}
        language={language}
      />
    </div>
  );
}

