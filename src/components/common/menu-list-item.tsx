import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SafetyBadge, SafetyLevel } from './safety-badge';

interface MenuListItemProps {
  originalName: string;
  translatedName: string;
  safetyLevel: SafetyLevel;
  safetyText: string;
  ingredients?: string[];
  description?: string;
  onClick?: () => void;
}

export function MenuListItem({
  originalName,
  translatedName,
  safetyLevel,
  safetyText,
  ingredients,
  description,
  onClick,
}: MenuListItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        onClick={onClick || (() => setExpanded(!expanded))}
        className="flex w-full items-start gap-3 p-4 transition-colors hover:bg-gray-50"
      >
        <div className="flex-1 text-left">
          <div className="mb-1">
            <span className="text-sm text-gray-600">{originalName}</span>
          </div>
          <h3 className="mb-2">{translatedName}</h3>
          <SafetyBadge level={safetyLevel} text={safetyText} size="sm" />
        </div>
        {(ingredients || description) && (
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {expanded && (ingredients || description) && (
        <div className="space-y-2 border-t border-gray-100 px-4 pb-4 pt-2">
          {ingredients && (
            <div>
              <p className="mb-1 text-sm text-gray-500">Ingredients:</p>
              <p className="text-sm">{ingredients.join(', ')}</p>
            </div>
          )}
          {description && (
            <div>
              <p className="mb-1 text-sm text-gray-500">Description:</p>
              <p className="text-sm">{description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
