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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={onClick || (() => setExpanded(!expanded))}
        className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="mb-1">
            <span className="text-gray-600 text-sm">{originalName}</span>
          </div>
          <h3 className="mb-2">{translatedName}</h3>
          <SafetyBadge level={safetyLevel} text={safetyText} size="sm" />
        </div>
        {(ingredients || description) && (
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {expanded && (ingredients || description) && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
          {ingredients && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Ingredients:</p>
              <p className="text-sm">{ingredients.join(', ')}</p>
            </div>
          )}
          {description && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Description:</p>
              <p className="text-sm">{description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
