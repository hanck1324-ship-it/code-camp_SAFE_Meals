'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

interface SignupForm {
  email: string;
  password: string;
  passwordConfirm: string;
  language: string;
  phone: string;
  name: string;
}

export function useAuthSignupForm() {
  const router = useRouter();
  const currentLanguage = useLanguageStore((state) => state.language);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<SignupForm>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      language: currentLanguage, // 현재 전역 언어 상태로 초기화
      phone: '',
      name: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    console.log('signup', data);
    router.replace('/onboarding/allergy');
  });

  return {
    control,
    errors,
    onSubmit,
    isFormFilled: isValid,
    isLoading: isSubmitting,
  };
}
