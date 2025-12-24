import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Language } from '../../lib/translations';

interface AllergyDetailScreenProps {
  category: string;
  onComplete: (selected: string[]) => void;
  onBack: () => void;
  language: Language;
}

const allergyDetails = {
  shellfish: {
    ko: '해산물',
    en: 'Shellfish',
    items: [
      { id: 'shrimp', ko: '새우', en: 'Shrimp' },
      { id: 'squid', ko: '오징어', en: 'Squid' },
      { id: 'mackerel', ko: '고등어', en: 'Mackerel' },
      { id: 'crab', ko: '게', en: 'Crab' },
      { id: 'clam', ko: '조개류', en: 'Clams' },
      { id: 'octopus', ko: '문어', en: 'Octopus' },
    ],
  },
  meat: {
    ko: '육류',
    en: 'Meat',
    items: [
      { id: 'beef', ko: '소고기', en: 'Beef' },
      { id: 'pork', ko: '돼지고기', en: 'Pork' },
      { id: 'chicken', ko: '닭고기', en: 'Chicken' },
      { id: 'lamb', ko: '양고기', en: 'Lamb' },
      { id: 'duck', ko: '오리고기', en: 'Duck' },
    ],
  },
  peanuts: {
    ko: '견과류',
    en: 'Nuts',
    items: [
      { id: 'peanut', ko: '땅콩', en: 'Peanuts' },
      { id: 'almond', ko: '아몬드', en: 'Almonds' },
      { id: 'walnut', ko: '호두', en: 'Walnuts' },
      { id: 'cashew', ko: '캐슈넛', en: 'Cashews' },
      { id: 'pistachio', ko: '피스타치오', en: 'Pistachios' },
    ],
  },
  grains: {
    ko: '곡류',
    en: 'Grains',
    items: [
      { id: 'wheat', ko: '밀', en: 'Wheat' },
      { id: 'barley', ko: '보리', en: 'Barley' },
      { id: 'rye', ko: '호밀', en: 'Rye' },
      { id: 'oats', ko: '귀리', en: 'Oats' },
    ],
  },
  soy: {
    ko: '콩류',
    en: 'Soy',
    items: [
      { id: 'soybean', ko: '대두', en: 'Soybeans' },
      { id: 'tofu', ko: '두부', en: 'Tofu' },
      { id: 'soymilk', ko: '두유', en: 'Soy Milk' },
    ],
  },
  fruits: {
    ko: '과일',
    en: 'Fruits',
    items: [
      { id: 'strawberry', ko: '딸기', en: 'Strawberry' },
      { id: 'peach', ko: '복숭아', en: 'Peach' },
      { id: 'kiwi', ko: '키위', en: 'Kiwi' },
      { id: 'apple', ko: '사과', en: 'Apple' },
    ],
  },
  dairy: {
    ko: '유제품',
    en: 'Dairy',
    items: [
      { id: 'milk', ko: '우유', en: 'Milk' },
      { id: 'cheese', ko: '치즈', en: 'Cheese' },
      { id: 'yogurt', ko: '요거트', en: 'Yogurt' },
      { id: 'butter', ko: '버터', en: 'Butter' },
    ],
  },
  eggs: {
    ko: '난류',
    en: 'Eggs',
    items: [
      { id: 'chickenegg', ko: '계란', en: 'Chicken Eggs' },
      { id: 'duckEgg', ko: '오리알', en: 'Duck Eggs' },
      { id: 'quailEgg', ko: '메추리알', en: 'Quail Eggs' },
    ],
  },
};

export function AllergyDetailScreen({ category, onComplete, onBack, language }: AllergyDetailScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  
  const details = allergyDetails[category as keyof typeof allergyDetails];
  
  if (!details) {
    return null;
  }

  const toggleItem = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelected(details.items.map(item => item.id));
  };

  const clearAll = () => {
    setSelected([]);
  };

  const getText = {
    ko: {
      title: '세부 알레르기 선택',
      subtitle: `${details.ko} 알레르기 항목을 선택하세요`,
      selectAll: '전체 선택',
      clearAll: '전체 해제',
      continue: '계속하기',
      selected: '선택됨',
    },
    en: {
      title: 'Select Specific Allergies',
      subtitle: `Choose ${details.en} allergies`,
      selectAll: 'Select All',
      clearAll: 'Clear All',
      continue: 'Continue',
      selected: 'selected',
    },
    ja: {
      title: '詳細アレルギー選択',
      subtitle: `${details.en}アレルギーを選択`,
      selectAll: 'すべて選択',
      clearAll: 'すべてクリア',
      continue: '続ける',
      selected: '選択済み',
    },
    zh: {
      title: '选择具体过敏原',
      subtitle: `选择${details.en}过敏`,
      selectAll: '全选',
      clearAll: '清除全部',
      continue: '继续',
      selected: '已选择',
    },
    es: {
      title: 'Seleccionar alergias específicas',
      subtitle: `Elegir alergias de ${details.en}`,
      selectAll: 'Seleccionar todo',
      clearAll: 'Limpiar todo',
      continue: 'Continuar',
      selected: 'seleccionado',
    },
  };

  const t = getText[language];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center">
            <h2>{t.title}</h2>
          </div>
          <div className="w-10" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{t.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={selectAll}
            variant="outline"
            className="flex-1 h-10 rounded-full border-2 border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71]/10"
          >
            {t.selectAll}
          </Button>
          <Button
            onClick={clearAll}
            variant="outline"
            className="flex-1 h-10 rounded-full"
          >
            {t.clearAll}
          </Button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 gap-3">
          {details.items.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all text-left
                  ${isSelected
                    ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2ECC71] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <p className={`${isSelected ? 'text-[#2ECC71]' : 'text-gray-900'} mb-1`}>
                  {language === 'ko' ? item.ko : item.en}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ko' ? item.en : item.ko}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selection Count */}
        {selected.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {selected.length} {t.selected}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      <div className="p-6">
        <Button
          onClick={() => onComplete(selected)}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30"
          disabled={selected.length === 0}
        >
          {t.continue}
        </Button>
      </div>
    </div>
  );
}
