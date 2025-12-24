import { Home, Camera, Shield, User } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface BottomNavProps {
  activeTab: 'home' | 'scan' | 'safetyCard' | 'myPage';
  onTabChange: (tab: 'home' | 'scan' | 'safetyCard' | 'myPage') => void;
  language: Language;
}

export function BottomNav({ activeTab, onTabChange, language }: BottomNavProps) {
  const t = translations[language];

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
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
