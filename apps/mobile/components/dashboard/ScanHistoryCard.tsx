/**
 * 스캔 이력 카드 컴포넌트
 * - 개별 스캔 결과를 카드 형태로 표시
 * - 안전 등급별 색상 및 다크모드 대응
 */

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecentScan, SafetyLevel } from '@/types/scan';
import { getSafetyColors, getSafetyLabel, getSafetyIconName } from '@/lib/utils/safetyColors';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

interface ScanHistoryCardProps {
  scan: RecentScan;
  onPress: () => void;
}

/**
 * 안전 등급 아이콘 컴포넌트
 */
function SafetyIcon({ level, size = 32 }: { level: SafetyLevel; size?: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getSafetyColors(level, isDark);
  const iconName = getSafetyIconName(level);

  return <Ionicons name={iconName} size={size} color={colors.text} />;
}

/**
 * 안전 등급 배지 컴포넌트
 */
function SafetyBadge({
  level,
  size = 'sm',
}: {
  level: SafetyLevel;
  size?: 'sm' | 'md';
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getSafetyColors(level, isDark);
  const label = getSafetyLabel(level);

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          size === 'md' && styles.badgeTextMd,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * 스캔 이력 카드 컴포넌트
 */
export function ScanHistoryCard({ scan, onPress }: ScanHistoryCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const safetyColors = getSafetyColors(scan.representativeItem.safetyLevel, isDark);
  const timeAgo = formatRelativeTime(scan.scannedAt);

  // 접근성 레이블 구성
  const accessibilityLabel = `${scan.restaurantName || '메뉴'} 스캔 결과. ${getSafetyLabel(
    scan.representativeItem.safetyLevel
  )}. ${scan.representativeItem.totalCount}개 메뉴. ${timeAgo}`;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' },
        { borderColor: safetyColors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="탭하여 상세 결과를 확인합니다"
    >
      {/* 썸네일 영역 */}
      <View style={[styles.thumbnail, { backgroundColor: safetyColors.background }]}>
        {scan.imageUrl ? (
          <Image
            source={{ uri: scan.imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <SafetyIcon level={scan.representativeItem.safetyLevel} size={32} />
        )}
      </View>

      {/* 정보 영역 */}
      <View style={styles.info}>
        <Text
          style={[styles.restaurantName, { color: isDark ? '#F9FAFB' : '#111827' }]}
          numberOfLines={1}
        >
          {scan.restaurantName || '메뉴 스캔'}
        </Text>

        {/* 대표 메뉴 + 안전 등급 */}
        <View style={styles.menuRow}>
          <SafetyBadge level={scan.representativeItem.safetyLevel} size="sm" />
          <Text
            style={[styles.menuName, { color: isDark ? '#D1D5DB' : '#4B5563' }]}
            numberOfLines={1}
          >
            {scan.representativeItem.itemName}
          </Text>
        </View>

        {/* 결과 개수 표시 (2개 이상인 경우) */}
        {scan.representativeItem.totalCount > 1 && (
          <Text style={[styles.countBadge, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            총 {scan.representativeItem.totalCount}개 메뉴
          </Text>
        )}

        <Text style={[styles.timeAgo, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 12,
    gap: 4,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuName: {
    fontSize: 12,
    flex: 1,
  },
  countBadge: {
    fontSize: 11,
  },
  timeAgo: {
    fontSize: 11,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextMd: {
    fontSize: 12,
  },
});

export default ScanHistoryCard;
