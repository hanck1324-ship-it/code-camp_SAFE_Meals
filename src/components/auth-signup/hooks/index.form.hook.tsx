"use client";

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

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
            language: 'ko',
      phone: '',
      name: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    // Supabase Auth 회원가입 (v1: { user, error } 반환)
    const { user, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error || !user) {
      alert(error?.message ?? 'signup error');
      return;
    }

    // signup 테이블에 프로필 정보 저장
    await supabase.from('signup').insert({
      id: user.id,
      email: data.email,
      real_name: data.name,
      phone: data.phone,
      language: data.language,
    });

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
