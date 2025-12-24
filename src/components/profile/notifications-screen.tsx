import { ChevronLeft, Bell, AlertTriangle, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '../../lib/translations';

interface NotificationsScreenProps {
  onBack: () => void;
  language: Language;
}

export function NotificationsScreen({ onBack, language }: NotificationsScreenProps) {
  const t = translations[language];
  
  const [notifications, setNotifications] = useState({
    scanAlerts: true,
    allergyWarnings: true,
    nearbyRestaurants: false,
    newFeatures: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationItems = [
    {
      key: 'scanAlerts' as const,
      icon: Bell,
      title: t.scanAlerts || 'Scan Alerts',
      description: t.scanAlertsDesc || 'Get notified when scan results are ready',
      color: '#2ECC71',
    },
    {
      key: 'allergyWarnings' as const,
      icon: AlertTriangle,
      title: t.allergyWarnings || 'Allergy Warnings',
      description: t.allergyWarningsDesc || 'Critical alerts for detected allergens',
      color: '#E74C3C',
    },
    {
      key: 'nearbyRestaurants' as const,
      icon: MapPin,
      title: t.nearbyRestaurants || 'Nearby Restaurants',
      description: t.nearbyRestaurantsDesc || 'Discover safe dining options near you',
      color: '#3B82F6',
    },
    {
      key: 'newFeatures' as const,
      icon: Star,
      title: t.newFeatures || 'New Features',
      description: t.newFeaturesDesc || 'Updates about new app features',
      color: '#F59E0B',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2>{t.notifications}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {notificationItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = notifications[item.key];

          return (
            <div
              key={item.key}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: item.color }} />
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h3 className="mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                    isEnabled ? 'bg-[#2ECC71]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.notificationsInfo || 'You can change these settings at any time. Critical allergy warnings are always enabled for your safety.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
