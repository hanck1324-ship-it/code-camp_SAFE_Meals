'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';

import { useSignup } from './useSignup';

/**
 * Zod 스키마를 사용한 회원가입 폼 검증
 */
const signupSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  language: z.string().default('ko'), // 기본값 설정으로 필수 검증 완화
  phone: z.string().optional(),
  name: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function useAuthSignupForm() {
  const currentLanguage = useLanguageStore((state) => state.language);
  const {
    signupWithEmail,
    signupWithGoogle,
    errorMessage,
    isLoading,
    clearError,
  } = useSignup();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SignupFormData>({
    mode: 'all',
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      language: currentLanguage || 'ko',
      phone: '',
      name: '',
    },
  });

  // 필드 값 실시간 감시 (useWatch 사용으로 반응성 보장)
  const email = useWatch({ control, name: 'email' });
  const password = useWatch({ control, name: 'password' });
  const passwordConfirm = useWatch({ control, name: 'passwordConfirm' });
  const selectedLanguage = useWatch({ control, name: 'language' });

  // 비밀번호 일치 여부 확인
  const isPasswordMismatch =
    (passwordConfirm?.length ?? 0) > 0 && password !== passwordConfirm;

  // 언어 필드의 실제 값 (폼 값이 없으면 현재 언어 사용)
  const effectiveLanguage = selectedLanguage || currentLanguage || 'ko';

  // 필수 필드 채움 여부 확인 (isValid 대신 수동 체크)
  const isRequiredFieldsFilled =
    (email?.length ?? 0) > 0 &&
    (password?.length ?? 0) >= 6 &&
    (passwordConfirm?.length ?? 0) > 0 &&
    effectiveLanguage.length > 0 &&
    !isPasswordMismatch &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''); // 이메일 형식 검증

  const onSubmit = handleSubmit(
    async (data) => {
      await signupWithEmail({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        language: data.language || effectiveLanguage,
      });
    },
    (errors) => {
      // 유효성 검사 실패 시 에러 로깅 (디버깅용)
      console.error('Form validation errors:', errors);
    }
  );

  const onGoogleSignup = async () => {
    const language = selectedLanguage || currentLanguage || 'ko';
    await signupWithGoogle(language);
  };

  return {
    control,
    errors,
    onSubmit,
    onGoogleSignup,
    isFormFilled: isRequiredFieldsFilled,
    isLoading: isSubmitting || isLoading,
    errorMessage,
    clearError,
    isPasswordMismatch,
  };
}
