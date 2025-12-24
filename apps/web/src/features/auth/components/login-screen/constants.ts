import { Language } from '@/lib/translations';

export const LOGIN_TEXT: Record<
  Language,
  {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    login: string;
    or: string;
    signup: string;
    forgot: string;
    forgotEmail: string;
    continueWithGoogle: string;
    continueWithApple: string;
    continueWithFacebook: string;
  }
> = {
  ko: {
    title: 'SafeMeals에 로그인',
    subtitle: '안전한 식사를 시작하세요',
    email: '이메일',
    password: '비밀번호',
    login: '로그인',
    or: '또는',
    signup: '회원가입',
    forgot: '비밀번호를 잊으셨나요?',
    forgotEmail: '이메일을 잊으셨나요?',
    continueWithGoogle: 'Google로 계속하기',
    continueWithApple: 'Apple로 계속하기',
    continueWithFacebook: 'Facebook으로 계속하기',
  },
  en: {
    title: 'Login to SafeMeals',
    subtitle: 'Start your safe dining experience',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    or: 'or',
    signup: 'Sign Up',
    forgot: 'Forgot password?',
    forgotEmail: 'Forgot email?',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    continueWithFacebook: 'Continue with Facebook',
  },
  ja: {
    title: 'SafeMealsにログイン',
    subtitle: '安全な食事体験を始めましょう',
    email: 'メールアドレス',
    password: 'パスワード',
    login: 'ログイン',
    or: 'または',
    signup: '新規登録',
    forgot: 'パスワードをお忘れですか？',
    forgotEmail: 'メールアドレスをお忘れですか？',
    continueWithGoogle: 'Googleで続ける',
    continueWithApple: 'Appleで続ける',
    continueWithFacebook: 'Facebookで続ける',
  },
  zh: {
    title: '登录SafeMeals',
    subtitle: '开始您的安全用餐体验',
    email: '电子邮件',
    password: '密码',
    login: '登录',
    or: '或',
    signup: '注册',
    forgot: '忘记密码？',
    forgotEmail: '忘记电子邮件？',
    continueWithGoogle: '使用Google继续',
    continueWithApple: '使用Apple继续',
    continueWithFacebook: '使用Facebook继续',
  },
  es: {
    title: 'Iniciar sesión en SafeMeals',
    subtitle: 'Comienza tu experiencia gastronómica segura',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    or: 'o',
    signup: 'Registrarse',
    forgot: '¿Olvidaste tu contraseña?',
    forgotEmail: '¿Olvidaste tu correo electrónico?',
    continueWithGoogle: 'Continuar con Google',
    continueWithApple: 'Continuar con Apple',
    continueWithFacebook: 'Continuar con Facebook',
  },
} as const;

