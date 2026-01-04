import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 지원 언어 타입
 */
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';

/**
 * 네이티브 앱용 번역 데이터
 */
const translations: Record<Language, Record<string, string>> = {
  ko: {
    // 공통
    loading: '로딩 중...',
    error: '오류',
    cancel: '취소',
    confirm: '확인',
    retry: '다시 시도',

    // 탭 바
    tabHome: '홈',
    tabScan: '스캔',
    tabSafetyCard: '안전카드',
    tabProfile: '마이',

    // 스캔 화면
    cameraPermissionChecking: '카메라 권한 확인 중...',
    cameraPermissionRequired: '카메라 권한 필요',
    cameraPermissionDescription:
      '메뉴판을 촬영하려면 카메라 권한이 필요합니다.',
    allowPermission: '권한 허용하기',
    changeInSettings: '설정에서 변경하기',
    capturePhoto: '촬영',
    gallery: '갤러리',
    retake: '다시 촬영',
    analyze: '분석하기',
    photoCaptureFailed: '사진 촬영에 실패했습니다. 다시 시도해주세요.',
    imageProcessingFailed: '이미지 처리에 실패했습니다. 다시 시도해주세요.',
    pointCameraAtMenu: '메뉴판을 향해 카메라를 맞춰주세요',
    menuPreview: '메뉴판 미리보기',
    proceedWithThisImage: '이 이미지로 분석을 진행할까요?',
    menuCapture: '메뉴판 촬영',
    alignMenuToScreen: '메뉴판을 화면에 맞춰 촬영해주세요',

    // 설정
    settings: '설정',
    notifications: '알림',
    pushNotifications: '푸시 알림',
    allergyAlertsAndUpdates: '알레르기 경고 및 업데이트',
    appSettings: '앱 설정',
    darkMode: '다크 모드',
    useDarkTheme: '어두운 테마 사용',
    language: '언어',
    korean: '한국어',
    information: '정보',
    privacyPolicy: '개인정보 처리방침',
    termsOfService: '이용약관',
    appVersion: '앱 버전',
    account: '계정',
    logout: '로그아웃',
    logoutConfirm: '정말 로그아웃 하시겠습니까?',
  },
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
    retry: 'Retry',

    // Tab bar
    tabHome: 'Home',
    tabScan: 'Scan',
    tabSafetyCard: 'Safety Card',
    tabProfile: 'My',

    // Scan screen
    cameraPermissionChecking: 'Checking camera permission...',
    cameraPermissionRequired: 'Camera Permission Required',
    cameraPermissionDescription: 'Camera access is required to scan the menu.',
    allowPermission: 'Allow Permission',
    changeInSettings: 'Change in Settings',
    capturePhoto: 'Capture',
    gallery: 'Gallery',
    retake: 'Retake',
    analyze: 'Analyze',
    photoCaptureFailed: 'Failed to capture photo. Please try again.',
    imageProcessingFailed: 'Failed to process image. Please try again.',
    pointCameraAtMenu: 'Point the camera at the menu',
    menuPreview: 'Menu Preview',
    proceedWithThisImage: 'Proceed with this image?',
    menuCapture: 'Capture Menu',
    alignMenuToScreen: 'Align the menu to the screen',

    // Settings
    settings: 'Settings',
    notifications: 'Notifications',
    pushNotifications: 'Push Notifications',
    allergyAlertsAndUpdates: 'Allergy alerts and updates',
    appSettings: 'App Settings',
    darkMode: 'Dark Mode',
    useDarkTheme: 'Use dark theme',
    language: 'Language',
    korean: 'Korean',
    information: 'Information',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    appVersion: 'App Version',
    account: 'Account',
    logout: 'Log Out',
    logoutConfirm: 'Are you sure you want to log out?',
  },
  ja: {
    // 共通
    loading: '読み込み中...',
    error: 'エラー',
    cancel: 'キャンセル',
    confirm: '確認',
    retry: '再試行',

    // タブバー
    tabHome: 'ホーム',
    tabScan: 'スキャン',
    tabSafetyCard: '安全カード',
    tabProfile: 'マイ',

    // スキャン画面
    cameraPermissionChecking: 'カメラ権限を確認中...',
    cameraPermissionRequired: 'カメラの許可が必要',
    cameraPermissionDescription:
      'メニューをスキャンするにはカメラへのアクセスが必要です。',
    allowPermission: '許可する',
    changeInSettings: '設定で変更',
    capturePhoto: '撮影',
    gallery: 'ギャラリー',
    retake: '再撮影',
    analyze: '分析',
    photoCaptureFailed: '撮影に失敗しました。もう一度お試しください。',
    imageProcessingFailed: '画像処理に失敗しました。もう一度お試しください。',
    pointCameraAtMenu: 'カメラをメニューに向けてください',
    menuPreview: 'メニュープレビュー',
    proceedWithThisImage: 'この画像で分析を進めますか？',
    menuCapture: 'メニュー撮影',
    alignMenuToScreen: 'メニューを画面に合わせてください',

    // 設定
    settings: '設定',
    notifications: '通知',
    pushNotifications: 'プッシュ通知',
    allergyAlertsAndUpdates: 'アレルギー警告と更新',
    appSettings: 'アプリ設定',
    darkMode: 'ダークモード',
    useDarkTheme: 'ダークテーマを使用',
    language: '言語',
    korean: '韓国語',
    information: '情報',
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約',
    appVersion: 'アプリバージョン',
    account: 'アカウント',
    logout: 'ログアウト',
    logoutConfirm: '本当にログアウトしますか？',
  },
  zh: {
    // 通用
    loading: '加载中...',
    error: '错误',
    cancel: '取消',
    confirm: '确认',
    retry: '重试',

    // 标签栏
    tabHome: '首页',
    tabScan: '扫描',
    tabSafetyCard: '安全卡',
    tabProfile: '我的',

    // 扫描页面
    cameraPermissionChecking: '正在检查相机权限...',
    cameraPermissionRequired: '需要相机权限',
    cameraPermissionDescription: '扫描菜单需要相机访问权限。',
    allowPermission: '允许权限',
    changeInSettings: '在设置中更改',
    capturePhoto: '拍照',
    gallery: '相册',
    retake: '重拍',
    analyze: '分析',
    photoCaptureFailed: '拍照失败，请重试。',
    imageProcessingFailed: '图片处理失败，请重试。',
    pointCameraAtMenu: '将相机对准菜单',
    menuPreview: '菜单预览',
    proceedWithThisImage: '用这张图片进行分析吗？',
    menuCapture: '拍摄菜单',
    alignMenuToScreen: '将菜单对准屏幕',

    // 设置
    settings: '设置',
    notifications: '通知',
    pushNotifications: '推送通知',
    allergyAlertsAndUpdates: '过敏警报和更新',
    appSettings: '应用设置',
    darkMode: '深色模式',
    useDarkTheme: '使用深色主题',
    language: '语言',
    korean: '韩语',
    information: '信息',
    privacyPolicy: '隐私政策',
    termsOfService: '服务条款',
    appVersion: '应用版本',
    account: '账户',
    logout: '退出登录',
    logoutConfirm: '确定要退出登录吗？',
  },
  es: {
    // Común
    loading: 'Cargando...',
    error: 'Error',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    retry: 'Reintentar',

    // Barra de pestañas
    tabHome: 'Inicio',
    tabScan: 'Escanear',
    tabSafetyCard: 'Tarjeta de Seguridad',
    tabProfile: 'Mi',

    // Pantalla de escaneo
    cameraPermissionChecking: 'Verificando permiso de cámara...',
    cameraPermissionRequired: 'Permiso de Cámara Requerido',
    cameraPermissionDescription:
      'Se requiere acceso a la cámara para escanear el menú.',
    allowPermission: 'Permitir',
    changeInSettings: 'Cambiar en Configuración',
    capturePhoto: 'Capturar',
    gallery: 'Galería',
    retake: 'Volver a tomar',
    analyze: 'Analizar',
    photoCaptureFailed:
      'Error al capturar la foto. Por favor, inténtelo de nuevo.',
    imageProcessingFailed:
      'Error al procesar la imagen. Por favor, inténtelo de nuevo.',
    pointCameraAtMenu: 'Apunte la cámara al menú',
    menuPreview: 'Vista previa del menú',
    proceedWithThisImage: '¿Proceder con esta imagen?',
    menuCapture: 'Capturar menú',
    alignMenuToScreen: 'Alinee el menú a la pantalla',

    // Configuración
    settings: 'Configuración',
    notifications: 'Notificaciones',
    pushNotifications: 'Notificaciones Push',
    allergyAlertsAndUpdates: 'Alertas de alergia y actualizaciones',
    appSettings: 'Configuración de la App',
    darkMode: 'Modo Oscuro',
    useDarkTheme: 'Usar tema oscuro',
    language: 'Idioma',
    korean: 'Coreano',
    information: 'Información',
    privacyPolicy: 'Política de Privacidad',
    termsOfService: 'Términos de Servicio',
    appVersion: 'Versión de la App',
    account: 'Cuenta',
    logout: 'Cerrar Sesión',
    logoutConfirm: '¿Está seguro de que desea cerrar sesión?',
  },
};

const STORAGE_KEY = 'app_language';

/**
 * 네이티브 앱용 번역 훅
 */
export function useNativeTranslation() {
  const [language, setLanguageState] = useState<Language>('ko');
  const [isLoaded, setIsLoaded] = useState(false);

  // AsyncStorage에서 언어 로드하는 함수
  const loadLanguage = useCallback(async () => {
    try {
      const savedLang = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLang && isValidLanguage(savedLang)) {
        setLanguageState(savedLang as Language);
      }
    } catch (error) {
      console.error('언어 로드 실패:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  // 앱이 포그라운드로 돌아올 때 언어 다시 로드
  // (다른 탭에서 언어 변경 시 동기화)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log(
          '[useNativeTranslation] App became active, reloading language...'
        );
        loadLanguage();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [loadLanguage]);

  // 언어 변경 함수
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('언어 저장 실패:', error);
    }
  }, []);

  // 번역 함수
  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] || translations['ko'][key] || key;
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
    isLoaded,
    refreshLanguage: loadLanguage,
  };
}

/**
 * 유효한 언어인지 확인
 */
function isValidLanguage(lang: string): lang is Language {
  return ['ko', 'en', 'ja', 'zh', 'es'].includes(lang);
}

export { translations };
