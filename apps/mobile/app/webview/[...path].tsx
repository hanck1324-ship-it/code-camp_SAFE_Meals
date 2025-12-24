import { useLocalSearchParams } from 'expo-router';
import WebViewScreen from '@/components/WebViewScreen';

export default function WebViewPage() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  
  // path 배열을 URL 경로로 변환
  const webPath = path ? `/${path.join('/')}` : '/';
  
  return <WebViewScreen path={webPath} showHeader />;
}
