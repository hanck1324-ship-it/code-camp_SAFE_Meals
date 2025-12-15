"use client";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  fullWidth,
  className = "",
  ...rest
}) => {
  return (
    <button
      {...rest}
      className={`rounded bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

Button.displayName = "Button";

