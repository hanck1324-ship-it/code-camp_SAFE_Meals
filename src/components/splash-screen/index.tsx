'use client';

import { useEffect } from 'react';
const logo = '/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#2ECC71] via-[#27AE60] to-[#229954] p-6">
      <div className="animate-pulse">
        <img
          src={logo}
          alt="SafeMeals Logo"
          className="h-48 w-48 object-contain drop-shadow-2xl"
        />
      </div>

      <div className="absolute bottom-12 flex gap-2">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-white"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
}
