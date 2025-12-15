import { Camera, Shield, MapPin, Star, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Language, translations } from '../lib/translations';
import { LanguageSelector } from './language-selector';

interface HomeScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onScanMenu: () => void;
  onOpenProfile: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function HomeScreen({ userProfile, onScanMenu, onOpenProfile, language, onLanguageChange }: HomeScreenProps) {
  const t = translations[language];
  
  const restaurants = [
    {
      name: t.kimchiHouse,
      cuisine: t.korean,
      distance: '0.3 mi',
      rating: 4.8,
      safeItems: 12,
    },
    {
      name: t.pastaBella,
      cuisine: t.italian,
      distance: '0.5 mi',
      rating: 4.6,
      safeItems: 8,
    },
    {
      name: t.spiceGarden,
      cuisine: t.indian,
      distance: '0.7 mi',
      rating: 4.9,
      safeItems: 15,
    },
  ];

  const profileCount = userProfile.allergies.length + userProfile.diets.length;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl mb-1">{t.appName}</h1>
            <p className="text-sm text-muted-foreground">{t.eatFearlessly}</p>
          </div>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 rounded-full"
          >
            <Shield className="w-5 h-5 text-[#10B981]" />
            <span className="text-sm text-[#10B981]">{profileCount} {t.active}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        <div className="w-32 h-32 bg-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#10B981]/20">
          <Camera className="w-16 h-16 text-white" />
        </div>
        <h2 className="mb-2">{t.readyToScan}</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xs">
          {t.scanDescription}
        </p>
        <Button
          onClick={onScanMenu}
          className="w-64 h-14 rounded-full bg-[#10B981] hover:bg-[#059669] text-white text-lg"
        >
          {t.scanMenu}
        </Button>
      </div>

      {/* Restaurant Recommendations */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#10B981]" />
            <h3>{t.safeNearby}</h3>
          </div>
          <button className="text-sm text-[#10B981]">{t.viewAll}</button>
        </div>
        <div className="space-y-3">
          {restaurants.map((restaurant, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4>{restaurant.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{restaurant.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {restaurant.cuisine} · {restaurant.distance}
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#10B981]/10 rounded-full">
                  <Shield className="w-3 h-3 text-[#10B981]" />
                  <span className="text-xs text-[#10B981]">
                    {restaurant.safeItems} {t.safeItems}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
