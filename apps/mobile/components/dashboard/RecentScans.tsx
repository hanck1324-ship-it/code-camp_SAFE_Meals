/**
 * 최근 스캔 섹션 컴포넌트
 * - 대시보드에 사용자의 최근 스캔 이력을 표시
 * - 로딩/에러/빈 상태 처리
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';

import { useRecentScans } from '@/hooks/useRecentScans';

import { ScanHistoryCard } from './ScanHistoryCard';

/**
 * 로딩 스켈레톤 컴포넌트
 */
function RecentScansLoading() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.skeletonTitle,
            { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
          ]}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.skeletonCard,
              { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={isDark ? '#6B7280' : '#9CA3AF'}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * 빈 상태 컴포넌트
 */
function RecentScansEmpty() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleScanPress = () => {
    router.push('/(tabs)/scan');
  };

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="camera-outline"
        size={48}
        color={isDark ? '#6B7280' : '#9CA3AF'}
      />
      <Text
        style={[styles.emptyTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}
      >
        아직 스캔 기록이 없어요
      </Text>
      <Text
        style={[
          styles.emptyDescription,
          { color: isDark ? '#9CA3AF' : '#6B7280' },
        ]}
      >
        메뉴판을 스캔해서 안전한 음식을 확인해보세요
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleScanPress}
        accessibilityLabel="첫 스캔 시작하기"
        accessibilityRole="button"
      >
        <Text style={styles.scanButtonText}>첫 스캔 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function RecentScansError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
      <Text
        style={[styles.errorText, { color: isDark ? '#FECACA' : '#B91C1C' }]}
      >
        {message}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityLabel="다시 시도"
        accessibilityRole="button"
      >
        <Text style={styles.retryButtonText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * 최근 스캔 섹션 메인 컴포넌트
 */
export function RecentScans() {
  const { recentScans, isLoading, error, isEmpty, refetch } = useRecentScans();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSeeAll = () => {
    // TODO: 추후 네이티브 스캔 히스토리 페이지 구현 시 라우트 변경
    router.push({
      pathname: '/webview/[...path]',
      params: { path: ['scan', 'history'] },
    });
  };

  const handleCardPress = (scanId: string) => {
    // 웹앱의 /scan/[scanId] 동적 라우트로 이동
    router.push({
      pathname: '/webview/[...path]',
      params: { path: ['scan', scanId] },
    });
  };

  if (isLoading) {
    return <RecentScansLoading />;
  }

  if (error) {
    return <RecentScansError message={error} onRetry={refetch} />;
  }

  if (isEmpty) {
    return <RecentScansEmpty />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
          최근 스캔
        </Text>
        <TouchableOpacity
          onPress={handleSeeAll}
          accessibilityLabel="전체 스캔 기록 보기"
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>전체 보기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recentScans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScanHistoryCard
            scan={item}
            onPress={() => handleCardPress(item.id)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  // 스켈레톤 스타일
  skeletonTitle: {
    width: 80,
    height: 20,
    borderRadius: 4,
  },
  skeletonCard: {
    width: 200,
    height: 180,
    marginRight: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 빈 상태 스타일
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 에러 상태 스타일
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RecentScans;
