'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Search, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// 전화번호 유효성 검사 스키마
const findAccountSchema = z.object({
  phone: z
    .string()
    .min(1, '전화번호를 입력해주세요.')
    .regex(/^01[0-9]{8,9}$/, '올바른 전화번호 형식이 아닙니다. (예: 01012345678)')
    .transform((val) => val.replace(/\D/g, '')), // 하이픈 제거
});

type FindAccountInput = z.infer<typeof findAccountSchema>;

interface FindAccountModalProps {
  onClose: () => void;
}

export default function FindAccountModal({ onClose }: FindAccountModalProps) {
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    email?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FindAccountInput>({
    resolver: zodResolver(findAccountSchema),
  });

  const phoneValue = watch('phone', '');

  // 전화번호 포맷팅 (실시간)
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const onSubmit = async (values: FindAccountInput) => {
    try {
      setResult(null);

      const res = await fetch('/api/auth/find-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: values.phone }),
      });

      const data = await res.json();

      // Rate Limit 초과
      if (res.status === 429) {
        setResult({
          type: 'error',
          message: data.message || '너무 많은 요청이 발생했습니다.',
        });
        return;
      }

      // 입력값 오류
      if (res.status === 400) {
        setResult({
          type: 'error',
          message: data.message || '올바른 전화번호를 입력해주세요.',
        });
        return;
      }

      // 서버 오류
      if (!res.ok) {
        setResult({
          type: 'error',
          message: data.message || '일시적인 오류가 발생했습니다.',
        });
        return;
      }

      // 성공
      if (data.success && data.found) {
        setResult({
          type: 'success',
          message: '가입된 이메일을 찾았습니다.',
          email: data.email,
        });
      } else {
        // 이메일을 찾지 못한 경우
        setResult({
          type: 'info',
          message: '입력하신 전화번호로 가입된 이메일이 없습니다.\n회원가입을 진행해주세요.',
        });
      }
    } catch (error) {
      console.error('[Find Account] Error:', error);
      setResult({
        type: 'error',
        message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#2ECC71]" />
            <h2 className="text-lg font-bold text-gray-900">이메일 찾기</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Description */}
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            가입하신 <span className="font-semibold text-gray-900">휴대폰 번호</span>를 입력하시면
            <br />
            등록된 <span className="font-semibold text-gray-900">이메일 주소</span>를 확인해 드립니다.
          </p>

          {/* Phone Input */}
          <div className="mb-4">
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
              휴대폰 번호
            </label>
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              placeholder="01012345678"
              maxLength={13}
              className={`w-full rounded-xl border-2 px-4 py-3 text-base transition focus:outline-none ${
                errors.phone
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-[#2ECC71]'
              }`}
            />
            {errors.phone && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                {errors.phone.message}
              </p>
            )}
            {phoneValue && !errors.phone && (
              <p className="mt-2 text-xs text-gray-500">
                입력: {formatPhoneNumber(phoneValue)}
              </p>
            )}
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`mb-4 rounded-xl p-4 ${
                result.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : result.type === 'error'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.type === 'success' && <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />}
                {result.type === 'error' && <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />}
                {result.type === 'info' && <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="whitespace-pre-line text-sm font-medium leading-relaxed">
                    {result.message}
                  </p>
                  {result.email && (
                    <p className="mt-2 rounded-lg bg-white/50 p-3 text-center font-mono text-base font-semibold">
                      {result.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <p className="text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-700">보안 안내:</span> 악용 방지를 위해 1시간에 3회까지만 조회 가능합니다.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] py-3 text-sm font-semibold text-white shadow-lg shadow-[#2ECC71]/30 transition hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
            >
              {isSubmitting ? '확인 중...' : '이메일 찾기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
