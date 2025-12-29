'use client';

import { useState, useEffect, useRef } from 'react';
import { CalendarIcon, Plane, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Language, translations } from '@/lib/translations';
import { DateRange } from 'react-day-picker';
import { TravelPassConfirmDialog } from './travel-pass-confirm-dialog';

interface TravelPassProps {
  language: Language;
  onPurchase: (startDate: Date, endDate: Date, totalPrice: number) => void;
}

const DAILY_PRICE = 1000; // 1일 1,000원

export function TravelPass({ language, onPurchase }: TravelPassProps) {
  const t = translations[language];
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 외부 클릭 감지를 위한 ref
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 달력 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        calendarRef.current &&
        buttonRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // 날짜 범위 계산
  const calculateDays = (start?: Date, end?: Date): number => {
    if (!start || !end) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 시작일과 종료일 포함
    return diffDays;
  };

  const days = calculateDays(dateRange?.from, dateRange?.to);
  const totalPrice = days * DAILY_PRICE;

  const handlePurchase = () => {
    if (dateRange?.from && dateRange?.to) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmPurchase = () => {
    if (dateRange?.from && dateRange?.to) {
      onPurchase(dateRange.from, dateRange.to, totalPrice);
      setShowConfirmDialog(false);
      setDateRange(undefined);
    }
  };

  return (
    <div className="mx-6 mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60]">
          <Plane className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {t.travelPass || '여행 기간권'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t.travelPassDescription || '여행 기간 동안만 안전하게 이용하세요'}
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {t.selectTravelPeriod || '여행 기간 선택'}
          </span>
        </div>

        <div className="relative">
          <Button
            ref={buttonRef}
            type="button"
            variant="outline"
            className="h-12 w-full justify-start rounded-2xl border-2 border-gray-200 text-left font-normal hover:border-[#2ECC71] hover:bg-[#2ECC71]/5 active:bg-[#2ECC71]/10 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {dateRange.from.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {' - '}
                  {dateRange.to.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </>
              ) : (
                dateRange.from.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              )
            ) : (
              <span className="text-muted-foreground">
                {t.selectStartDate || '시작일을 선택하세요'}
              </span>
            )}
          </Button>

          {isOpen && (
            <div 
              ref={calendarRef}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-auto rounded-3xl bg-white shadow-lg border border-gray-200 p-0 z-[1000]"
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from || new Date()}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  // 범위 선택 완료 시 달력 닫기
                  if (range?.from && range?.to) {
                    setTimeout(() => setIsOpen(false), 100);
                  }
                }}
                numberOfMonths={1}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                className="p-4"
              />
            </div>
          )}
        </div>
      </div>

      {/* Price Calculation */}
      {dateRange?.from && dateRange?.to && (
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t.travelPeriod || '여행 기간'}
              </span>
              <span className="text-sm font-medium">
                {dateRange.from.toLocaleDateString('ko-KR', {
                  month: '2-digit',
                  day: '2-digit',
                })}{' '}
                -{' '}
                {dateRange.to.toLocaleDateString('ko-KR', {
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t.days || '일수'}
              </span>
              <span className="text-sm font-medium">{days}일</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {t.dailyPrice || '일일 가격'}
              </span>
              <span className="text-sm font-medium">
                {DAILY_PRICE.toLocaleString()}원
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {t.totalPrice || '총 결제 금액'}
                </span>
                <span className="text-lg font-bold text-[#2ECC71]">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <Button
        onClick={handlePurchase}
        disabled={!dateRange?.from || !dateRange?.to}
        className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plane className="mr-2 h-5 w-5" />
        {t.purchaseTravelPass || '여행 기간권 구매하기'}
      </Button>

      {/* Info */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t.travelPassInfo ||
          '여행 기간이 끝나면 자동으로 해지됩니다. 별도의 해지 절차가 필요 없습니다.'}
      </p>

      {/* Confirm Dialog */}
      {dateRange?.from && dateRange?.to && (
        <TravelPassConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          startDate={dateRange.from}
          endDate={dateRange.to}
          totalPrice={totalPrice}
          days={days}
          onConfirm={handleConfirmPurchase}
          language={language}
        />
      )}
    </div>
  );
}

