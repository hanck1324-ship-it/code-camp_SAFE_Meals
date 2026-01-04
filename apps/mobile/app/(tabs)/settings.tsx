import WebViewScreen from '@/components/WebViewScreen';

export default function SettingsTab() {
  // 설정 페이지: 웹뷰로 프로필/설정 화면 표시
  // 웹 앱의 다국어 시스템을 그대로 활용
  return <WebViewScreen path="/profile" />;
}
