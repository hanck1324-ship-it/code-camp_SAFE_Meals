import { useForm } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

export function useAuthLoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginForm>({ mode: 'onChange' });

  const onSubmit = handleSubmit((data) => {
    console.log('login', data);
  });

  return {
    control,
    errors,
    onSubmit,
    isFormFilled: isValid,
    isLoading: isSubmitting,
  };
}

