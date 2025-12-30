import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // TODO: AsyncStorage에서 온보딩 완료 여부 확인
    const checkOnboarding = async () => {
      try {
        // const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        // setIsOnboarded(hasOnboarded === 'true');
        setIsOnboarded(true); // 임시로 true 설정
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
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

  if (!isOnboarded) {
    return <Redirect href="/(auth)/onboarding" />;
  }

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
