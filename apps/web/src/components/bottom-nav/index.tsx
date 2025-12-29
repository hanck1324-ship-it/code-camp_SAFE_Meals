'use client';
import { Home, Camera, Shield, User } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface BottomNavProps {
  activeTab?: 'home' | 'scan' | 'safetyCard' | 'myPage';
  onTabChange?: (tab: 'home' | 'scan' | 'safetyCard' | 'myPage') => void;
  language?: Language;
}

export function BottomNav({
  activeTab,
  onTabChange,
  language = 'ko',
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = translations[language];

  // 경로에 따라 activeTab 결정
  const currentTab = useMemo(() => {
    if (activeTab) return activeTab;
    if (pathname === '/dashboard' || pathname === '/') return 'home' as const;
    if (pathname === '/scan') return 'scan' as const;
    if (pathname === '/profile/safety-card') return 'safetyCard' as const;
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
      else if (tab === 'safetyCard') router.push('/profile/safety-card');
      else if (tab === 'myPage') router.push('/profile');
    }
  };

  const tabs = [
    { id: 'home' as const, icon: Home, label: t.home },
    { id: 'scan' as const, icon: Camera, label: t.scan },
    { id: 'safetyCard' as const, icon: Shield, label: t.safetyCard },
    { id: 'myPage' as const, icon: User, label: t.myPage },
  ];

  return (
    <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white">
      <div className="mx-auto flex h-20 max-w-md items-center justify-around">
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
              <Icon
                className={`h-6 w-6 ${isActive ? 'fill-[#2ECC71]/20' : ''}`}
              />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
