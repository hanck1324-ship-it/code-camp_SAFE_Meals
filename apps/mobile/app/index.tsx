import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);

  useEffect(() => {
    const checkInitialState = async () => {
      try {
        console.log('[Index] 초기 상태 확인 시작');

        // 인증 상태 확인 (로그인 토큰 체크)
        const authToken = await AsyncStorage.getItem('authToken');
        console.log('[Index] authToken 존재 여부:', !!authToken);

        // Supabase 세션 여부 확인 (웹뷰 주입용)
        const supabaseSession = await AsyncStorage.getItem('supabaseSession');
        console.log('[Index] supabaseSession 존재 여부:', !!supabaseSession);

        // 온보딩 완료 여부 확인
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        console.log('[Index] hasOnboarded:', hasOnboarded);

        setIsAuthenticated(!!authToken && !!supabaseSession);
        setHasSupabaseSession(!!supabaseSession);
        setIsOnboarded(hasOnboarded === 'true');

        console.log('[Index] 최종 상태:', {
          isAuthenticated: !!authToken && !!supabaseSession,
          hasSupabaseSession: !!supabaseSession,
          isOnboarded: hasOnboarded === 'true',
        });
      } catch (error) {
        console.error('Error checking initial state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialState();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>SafeMeals</Text>
        <ActivityIndicator size="large" color="#22c55e" style={styles.loader} />
      </View>
    );
  }

  // 토큰이 없거나 세션이 없으면 로그인 페이지로
  if (!isAuthenticated || !hasSupabaseSession) {
    return <Redirect href="/(auth)/login" />;
  }

  // 로그인은 되어 있지만 온보딩을 안 했으면 온보딩으로
  if (!isOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // 로그인도 했고 온보딩도 했으면 메인으로
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  loader: {
    position: 'absolute',
    bottom: 100,
  },
});
