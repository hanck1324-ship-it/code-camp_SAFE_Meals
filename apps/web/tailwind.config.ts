import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/commons/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './.storybook/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.stories.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        // SafeMeals 안전성 색상 (원칙 6, 7)
        'sm-safe': {
          bg: 'var(--sm-safe-bg)',
          border: 'var(--sm-safe-border)',
          text: 'var(--sm-safe-text)',
          icon: 'var(--sm-safe-icon)',
        },
        'sm-caution': {
          bg: 'var(--sm-caution-bg)',
          border: 'var(--sm-caution-border)',
          text: 'var(--sm-caution-text)',
          icon: 'var(--sm-caution-icon)',
        },
        'sm-danger': {
          bg: 'var(--sm-danger-bg)',
          border: 'var(--sm-danger-border)',
          text: 'var(--sm-danger-text)',
          icon: 'var(--sm-danger-icon)',
        },
      },
      fontSize: {
        // SafeMeals 타이포그래피 (원칙 1, 2)
        'sm-caption': ['var(--sm-font-caption)', { lineHeight: 'var(--sm-line-height-tight)' }],
        'sm-body': ['var(--sm-font-body)', { lineHeight: 'var(--sm-line-height-normal)' }],
        'sm-body-emphasis': ['var(--sm-font-body-emphasis)', { lineHeight: 'var(--sm-line-height-normal)' }],
        'sm-subtitle': ['var(--sm-font-subtitle)', { lineHeight: 'var(--sm-line-height-tight)' }],
        'sm-title': ['var(--sm-font-title)', { lineHeight: 'var(--sm-line-height-tight)' }],
      },
      spacing: {
        // SafeMeals 간격 시스템 (원칙 8)
        'sm-xs': 'var(--sm-spacing-xs)',
        'sm-sm': 'var(--sm-spacing-sm)',
        'sm-md': 'var(--sm-spacing-md)',
        'sm-lg': 'var(--sm-spacing-lg)',
        'sm-xl': 'var(--sm-spacing-xl)',
      },
      minWidth: {
        // SafeMeals 터치 영역 (원칙 4)
        'sm-touch': 'var(--sm-touch-minimum)',
        'sm-button': 'var(--sm-touch-button)',
      },
      minHeight: {
        // SafeMeals 터치 영역 (원칙 4)
        'sm-touch': 'var(--sm-touch-minimum)',
        'sm-button': 'var(--sm-touch-button)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
