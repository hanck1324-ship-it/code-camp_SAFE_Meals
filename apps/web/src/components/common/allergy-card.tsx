import { Check } from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

interface AllergyCardProps {
  icon?: LucideIcon;
  emoji?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function AllergyCard({
  icon: Icon,
  emoji,
  label,
  selected,
  onClick,
}: AllergyCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 ${
        selected
          ? 'border-sm-safe-icon bg-sm-safe-bg'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } `}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sm-safe-icon">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      {emoji ? (
        <span className="text-4xl">{emoji}</span>
      ) : Icon ? (
        <Icon
          className={`h-8 w-8 ${selected ? 'text-sm-safe-icon' : 'text-gray-600'}`}
        />
      ) : null}
      <span
        className={`text-center ${selected ? 'text-sm-safe-icon' : 'text-gray-900'}`}
      >
        {label}
      </span>
    </button>
  );
}
