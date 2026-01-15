'use client';

import { Star, TrendingUp, History } from 'lucide-react';

interface PersonalizedInsight {
  type: 'recommendation' | 'similar' | 'history';
  message: string;
  icon: 'star' | 'trending' | 'history';
}

interface PersonalizedInsightsProps {
  insights: PersonalizedInsight[];
  language?: 'ko' | 'en';
}

/**
 * 개인화 인사이트 컴포넌트
 * - 사용자 프로필 기반 추천
 * - 과거 이력 기반 유사 메뉴 표시
 * - 선호도 분석 결과 제공
 */
export function PersonalizedInsights({
  insights,
  language = 'ko',
}: PersonalizedInsightsProps) {
  if (insights.length === 0) return null;

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'star':
        return (
          <Star
            style={{ width: '16px', height: '16px' }}
            className="text-yellow-500"
          />
        );
      case 'trending':
        return (
          <TrendingUp
            style={{ width: '16px', height: '16px' }}
            className="text-green-500"
          />
        );
      case 'history':
        return (
          <History
            style={{ width: '16px', height: '16px' }}
            className="text-blue-500"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-3 space-y-2">
      {insights.map((insight, index) => (
        <div
          key={index}
          className="flex items-start gap-2 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3"
        >
          <div className="mt-0.5 flex-shrink-0">{getIcon(insight.icon)}</div>
          <p className="text-sm leading-relaxed text-gray-800">
            {insight.message}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * 추천 배지 컴포넌트
 * - 메뉴 카드에 표시되는 개인화 배지
 */
interface RecommendationBadgeProps {
  type: 'recommended' | 'tried_before' | 'similar';
  language?: 'ko' | 'en';
}

export function RecommendationBadge({
  type,
  language = 'ko',
}: RecommendationBadgeProps) {
  const badges = {
    recommended: {
      ko: '추천',
      en: 'Recommended',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      emoji: '⭐',
    },
    tried_before: {
      ko: '이전 선택',
      en: 'Tried Before',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      emoji: '🔄',
    },
    similar: {
      ko: '유사 메뉴',
      en: 'Similar',
      color: 'bg-green-100 text-green-800 border-green-300',
      emoji: '👍',
    },
  };

  const badge = badges[type];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${badge.color}`}
    >
      <span>{badge.emoji}</span>
      <span>{language === 'ko' ? badge.ko : badge.en}</span>
    </div>
  );
}

/**
 * 개인화 인사이트 생성 헬퍼 함수
 * - 사용자 알레르기, 식단, 과거 이력 기반으로 인사이트 생성
 */
interface UserProfile {
  allergies: string[];
  diets: string[];
  recentScans?: Array<{
    itemName: string;
    safetyLevel: string;
  }>;
}

interface MenuItem {
  translated_name: string;
  safety_status: string;
  allergy_risk?: {
    matched_allergens?: string[];
  };
}

export function generatePersonalizedInsights(
  menuItem: MenuItem,
  userProfile: UserProfile,
  language: 'ko' | 'en' = 'ko'
): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = [];

  // 1. 알레르기 기반 추천
  if (
    menuItem.safety_status === 'SAFE' &&
    userProfile.allergies.length > 0 &&
    (!menuItem.allergy_risk?.matched_allergens ||
      menuItem.allergy_risk.matched_allergens.length === 0)
  ) {
    insights.push({
      type: 'recommendation',
      message:
        language === 'ko'
          ? `${userProfile.allergies.join(', ')} 알레르기가 있는 당신에게 안전한 메뉴입니다`
          : `Safe for you with ${userProfile.allergies.join(', ')} allergies`,
      icon: 'star',
    });
  }

  // 2. 식단 기반 추천
  if (menuItem.safety_status === 'SAFE' && userProfile.diets.length > 0) {
    insights.push({
      type: 'recommendation',
      message:
        language === 'ko'
          ? `${userProfile.diets.join(', ')} 식단에 적합합니다`
          : `Suitable for ${userProfile.diets.join(', ')} diet`,
      icon: 'trending',
    });
  }

  // 3. 과거 이력 기반
  if (userProfile.recentScans && userProfile.recentScans.length > 0) {
    const similarItem = userProfile.recentScans.find(
      (scan) =>
        scan.itemName
          .toLowerCase()
          .includes(menuItem.translated_name.toLowerCase().split(' ')[0]) ||
        menuItem.translated_name
          .toLowerCase()
          .includes(scan.itemName.toLowerCase().split(' ')[0])
    );

    if (similarItem) {
      insights.push({
        type: 'history',
        message:
          language === 'ko'
            ? `이전에 안전했던 "${similarItem.itemName}"와 유사한 메뉴입니다`
            : `Similar to "${similarItem.itemName}" which was safe before`,
        icon: 'history',
      });
    }
  }

  return insights;
}
