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
    <div className="min-h-screen bg-gradient-to-br from-[#2ECC71] via-[#27AE60] to-[#229954] flex flex-col items-center justify-center p-6">
      <div className="animate-pulse">
        <img src={logo} alt="SafeMeals Logo" className="w-48 h-48 object-contain drop-shadow-2xl" />
      </div>
      
      <div className="absolute bottom-12 flex gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}