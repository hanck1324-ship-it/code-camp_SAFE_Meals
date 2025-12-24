import { Star, MapPin, Clock } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { LanguageSelector } from './language-selector';

interface HomeDashboardProps {
  onScanMenu: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function HomeDashboard({ onScanMenu, language, onLanguageChange }: HomeDashboardProps) {
  const t = translations[language];

  const recentScans = [
    {
      id: 1,
      name: t.bibimbap,
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmb29kJTIwYmliaW1iYXB8ZW58MXx8fHwxNzY1Njc0NDAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      time: '10 min ago',
    },
    {
      id: 2,
      name: t.kimchiJjigae,
      image: 'https://images.unsplash.com/photo-1760228865341-675704c22a5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBraW1jaGklMjBzdGV3fGVufDF8fHx8MTc2NTc2MDk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
      time: '1 hour ago',
    },
    {
      id: 3,
      name: t.bulgogi,
      image: 'https://images.unsplash.com/photo-1584278858536-52532423b9ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBidWxnb2dpfGVufDF8fHx8MTc2NTc2MDk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
      time: '2 hours ago',
    },
  ];

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

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[#2ECC71]">{t.appName}</h1>
            <p className="text-sm text-muted-foreground">{t.tagline}</p>
          </div>
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </div>

      {/* Recent Scans */}
      <div className="px-6 mb-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2>{t.recentScans}</h2>
          <button className="text-sm text-[#2ECC71]">{t.seeAll}</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {recentScans.map((scan) => (
            <div key={scan.id} className="flex-shrink-0 w-32">
              <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md mb-2">
                <img
                  src={scan.image}
                  alt={scan.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm truncate">{scan.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{scan.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safe Restaurants Nearby */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2>{t.safeRestaurantsNearby}</h2>
          <button className="text-sm text-[#2ECC71]">{t.viewAll}</button>
        </div>
        <div className="space-y-3">
          {restaurants.map((restaurant, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3>{restaurant.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">{restaurant.rating}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <span>{restaurant.cuisine}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{restaurant.distance}</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2ECC71]/10 rounded-full">
                <span className="w-2 h-2 bg-[#2ECC71] rounded-full"></span>
                <span className="text-sm text-[#2ECC71]">
                  {restaurant.safeItems} {t.safeItems}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}