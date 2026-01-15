'use client';

import React from 'react';

import { cn } from '@/components/ui/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode;
  error?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, errorMessage, className = '', ...rest }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <input
          ref={ref}
          {...rest}
          className={cn(
            'rounded border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
        />
        {error && errorMessage && (
          <span className="text-xs text-red-500">{errorMessage}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
