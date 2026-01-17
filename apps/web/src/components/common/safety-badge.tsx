import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export type SafetyLevel = 'safe' | 'warning' | 'danger';

interface SafetyBadgeProps {
  level: SafetyLevel;
  text: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SafetyBadge({ level, text, size = 'md' }: SafetyBadgeProps) {
  const configs = {
    safe: {
      bg: 'bg-sm-safe-icon',
      text: 'text-white',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-sm-caution-icon',
      text: 'text-gray-900',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-sm-danger-icon',
      text: 'text-white',
      icon: XCircle,
    },
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const config = configs[level];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center rounded-full ${config.bg} ${config.text} ${sizes[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{text}</span>
    </div>
  );
}
