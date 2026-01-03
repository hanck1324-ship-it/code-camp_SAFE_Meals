import { Stack } from 'expo-router';
import WebViewScreen from '@/components/WebViewScreen';

/**
 * 결제 탭 화면
 * 웹뷰를 통해 결제 페이지를 표시
 */
export default function PaymentScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <WebViewScreen path="/payment" />
    </>
  );
}
