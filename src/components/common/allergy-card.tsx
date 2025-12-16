import { Check } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AllergyCardProps {
  icon?: LucideIcon;
  emoji?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function AllergyCard({ icon: Icon, emoji, label, selected, onClick }: AllergyCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
        transition-all duration-200 border-2
        ${selected 
          ? 'border-[#2ECC71] bg-[#2ECC71]/5' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2ECC71] flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      {emoji ? (
        <span className="text-4xl">{emoji}</span>
      ) : Icon ? (
        <Icon className={`w-8 h-8 ${selected ? 'text-[#2ECC71]' : 'text-gray-600'}`} />
      ) : null}
      <span className={`text-center ${selected ? 'text-[#2ECC71]' : 'text-gray-900'}`}>
        {label}
      </span>
    </button>
  );
}