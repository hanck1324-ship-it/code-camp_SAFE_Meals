import { Camera, Shield, MapPin, Star, ChevronRight } from 'lucide-react';

import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface HomeScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onScanMenu: () => void;
  onOpenProfile: () => void;
}

export function HomeScreen({
  userProfile,
  onScanMenu,
  onOpenProfile,
}: HomeScreenProps) {
  const { t } = useTranslation();

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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="px-6 pb-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <LanguageSelector />
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-2xl">{t.appName}</h1>
            <p className="text-sm text-muted-foreground">{t.eatFearlessly}</p>
          </div>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 rounded-full bg-[#10B981]/10 px-4 py-2"
          >
            <Shield className="h-5 w-5 text-[#10B981]" />
            <span className="text-sm text-[#10B981]">
              {profileCount} {t.active}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mt-20 flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#10B981] shadow-lg shadow-[#10B981]/20">
          <Camera className="h-16 w-16 text-white" />
        </div>
        <h2 className="mb-2">{t.readyToScan}</h2>
        <p className="mb-8 max-w-xs text-center text-muted-foreground">
          {t.scanDescription}
        </p>
        <Button
          onClick={onScanMenu}
          className="h-14 w-64 rounded-full bg-[#10B981] text-lg text-white hover:bg-[#059669]"
        >
          {t.scanMenu}
        </Button>
      </div>

      {/* Restaurant Recommendations */}
      <div className="px-6 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#10B981]" />
            <h3>{t.safeNearby}</h3>
          </div>
          <button className="text-sm text-[#10B981]">{t.viewAll}</button>
        </div>
        <div className="space-y-3">
          {restaurants.map((restaurant, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4>{restaurant.name}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm">{restaurant.rating}</span>
                  </div>
                </div>
                <p className="mb-2 text-sm text-muted-foreground">
                  {restaurant.cuisine} · {restaurant.distance}
                </p>
                <div className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-1">
                  <Shield className="h-3 w-3 text-[#10B981]" />
                  <span className="text-xs text-[#10B981]">
                    {restaurant.safeItems} {t.safeItems}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
