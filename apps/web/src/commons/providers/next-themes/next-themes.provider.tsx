'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

interface NextThemesProviderProps {
  children: ReactNode;
}

export function NextThemesProvider({ children }: NextThemesProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
