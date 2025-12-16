"use client";

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

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
      language: '',
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
