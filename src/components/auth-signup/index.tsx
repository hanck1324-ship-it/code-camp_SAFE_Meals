"use client";

import React from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/commons/components/input";
import { Button } from "@/commons/components/button";
import { useAuthSignupForm } from "./hooks/index.form.hook";
import styles from "./styles.module.css";

export interface AuthSignupProps {
  className?: string;
}

export const AuthSignup: React.FC<AuthSignupProps> = ({ className = "" }) => {
  const { control, errors, onSubmit, isFormFilled, isLoading } =
    useAuthSignupForm();

  return (
    <div className={`${styles.container} ${className}`} data-testid="auth-signup-container">
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>회원가입</h1>
          <p className={styles.subtitle}>새로운 계정을 만들어 서비스를 시작해보세요</p>
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
          <div className={styles.inputGroup}>
            <Controller
              name="passwordConfirm"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="비밀번호 재입력"
                  placeholder="비밀번호를 다시 입력해주세요"
                  type="password"
                  required
                  className={styles.input}
                  error={!!errors.passwordConfirm}
                  errorMessage={errors.passwordConfirm?.message}
                />
              )}
            />
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <div className={styles.selectWrapper}>
                  <label className={styles.selectLabel}>언어</label>
                  <select
                    className={styles.select}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option value="ko">한글</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              )}
            />
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="휴대폰번호"
                  placeholder="휴대폰번호를 입력해주세요"
                  type="tel"
                  className={styles.input}
                  error={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />
              )}
            />
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="이름"
                  placeholder="이름을 입력해주세요"
                  className={styles.input}
                  error={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
          </div>
          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!isFormFilled || isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </Button>
          </div>
        </form>
        <div className={styles.footer}>
          <p className={styles.footerText}>
            이미 계정이 있으신가요? {" "}
            <a href="/auth/login" className={styles.loginLink}>
              로그인하기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

AuthSignup.displayName = "AuthSignup";

export default AuthSignup;

