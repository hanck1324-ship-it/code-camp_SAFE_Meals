'use client';

import React from 'react';
import styles from './styles.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, errorMessage, className = '', ...rest }, ref) => {
    return (
      <div className={`${styles.wrapper} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          {...rest}
          className={`${styles.input} ${error ? styles.errorBorder : styles.normalBorder}`}
        />
        {error && errorMessage && (
          <span className={styles.error}>{errorMessage}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
