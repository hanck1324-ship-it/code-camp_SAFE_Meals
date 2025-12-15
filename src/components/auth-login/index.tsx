"use client";

import React from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/commons/components/input";
import { Button } from "@/commons/components/button";
import { useAuthLoginForm } from "./hooks/index.form.hook";
import styles from "./styles.module.css";

export interface AuthLoginProps {
  className?: string;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({ className = "" }) => {
  const { control, errors, onSubmit, isFormFilled, isLoading } =
    useAuthLoginForm();

  return (
    <div className={`${styles.container} ${className}`} data-testid="auth-login-container">
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>로그인</h1>
          <p className={styles.subtitle}>계정에 로그인하여 서비스를 이용해보세요</p>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.inputGroup}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="이메일"
                  placeholder="이메일을 입력해주세요"
                  type="email"
                  required
                  className={styles.input}
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="비밀번호"
                  placeholder="비밀번호를 입력해주세요"
                  type="password"
                  required
                  className={styles.input}
                  error={!!errors.password}
                  errorMessage={errors.password?.message}
                />
              )}
            />
          </div>
          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              fullWidth
              disabled={!isFormFilled || isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>
        <div className={styles.footer}>
          <p className={styles.footerText}>
            아직 계정이 없으신가요? {" "}
            <a href="/auth/signup" className={styles.signupLink}>
              회원가입하기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

AuthLogin.displayName = "AuthLogin";

export default AuthLogin;

