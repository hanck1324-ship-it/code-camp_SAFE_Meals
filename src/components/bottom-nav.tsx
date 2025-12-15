"use client";
import { Home, Camera, Shield, User } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface BottomNavProps {
  activeTab?: 'home' | 'scan' | 'safetyCard' | 'myPage';
  onTabChange?: (tab: 'home' | 'scan' | 'safetyCard' | 'myPage') => void;
  language?: Language;
}

export function BottomNav({ activeTab, onTabChange, language = 'ko' }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = translations[language];

  // 경로에 따라 activeTab 결정
  const currentTab = useMemo(() => {
    if (activeTab) return activeTab;
    if (pathname === '/dashboard' || pathname === '/') return 'home' as const;
    if (pathname === '/scan') return 'scan' as const;
    if (pathname?.includes('/profile')) return 'myPage' as const;
    return 'home' as const;
  }, [pathname, activeTab]);

  const handleTabChange = (tab: 'home' | 'scan' | 'safetyCard' | 'myPage') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // 기본 라우팅 동작
      if (tab === 'home') router.push('/dashboard');
      else if (tab === 'scan') router.push('/scan');
      else if (tab === 'myPage') router.push('/profile');
      // safetyCard는 나중에 구현
    }
  };

  const tabs = [
    { id: 'home' as const, icon: Home, label: t.home },
    { id: 'scan' as const, icon: Camera, label: t.scan },
    { id: 'safetyCard' as const, icon: Shield, label: t.safetyCard },
    { id: 'myPage' as const, icon: User, label: t.myPage },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                isActive ? 'text-[#2ECC71]' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-[#2ECC71]/20' : ''}`} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
