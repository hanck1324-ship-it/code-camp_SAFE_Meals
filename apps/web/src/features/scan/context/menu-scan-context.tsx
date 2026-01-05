'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

/**
 * 허용된 파일 형식
 */
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 최대 파일 크기 (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface MenuScanContextValue {
  /** 선택된 이미지 파일 */
  selectedImage: File | null;
  /** 이미지 미리보기 URL */
  previewUrl: string | null;
  /** 에러 메시지 */
  errorMessage: string | null;
  /** 이미지 선택 핸들러 */
  handleImageSelect: (file: File) => void;
  /** 이미지 삭제 핸들러 */
  handleImageRemove: () => void;
  /** 에러 메시지 초기화 */
  clearError: () => void;
}

const MenuScanContext = createContext<MenuScanContextValue | null>(null);

interface MenuScanProviderProps {
  children: ReactNode;
}

export function MenuScanProvider({ children }: MenuScanProviderProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Base64 데이터 URL을 File 객체로 변환
   */
  const dataUrlToFile = useCallback(
    async (dataUrl: string, filename: string): Promise<File> => {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    },
    []
  );

  /**
   * 파일 유효성 검사
   */
  const validateFile = useCallback((file: File): string | null => {
    // 파일 형식 검사
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)';
    }

    // 파일 크기 검사
    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기가 10MB를 초과했습니다.';
    }

    return null;
  }, []);

  /**
   * 이미지 선택 핸들러
   */
  const handleImageSelect = useCallback(
    (file: File) => {
      // 이전 에러 초기화
      setErrorMessage(null);

      // 파일 유효성 검사
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      // 이전 미리보기 URL 해제
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // 새 이미지 설정
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, validateFile]
  );

  /**
   * 이미지 삭제 핸들러
   */
  const handleImageRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  }, [previewUrl]);

  /**
   * 에러 메시지 초기화
   */
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  /**
   * 앱에서 촬영한 이미지 로드 (네이티브 카메라 → 웹뷰)
   */
  useEffect(() => {
    const loadPendingImage = async () => {
      if (typeof window === 'undefined') return;

      const pendingImage = (window as any).pendingAnalyzeImage;
      if (pendingImage && typeof pendingImage === 'string') {
        try {
          // Base64 데이터 URL을 File 객체로 변환
          const file = await dataUrlToFile(
            pendingImage,
            `menu-scan-${Date.now()}.jpg`
          );

          // 이미지 설정 (유효성 검사 포함)
          handleImageSelect(file);

          // 사용 후 삭제 (메모리 누수 방지)
          delete (window as any).pendingAnalyzeImage;
        } catch (error) {
          console.error('앱 이미지 로드 실패:', error);
          setErrorMessage('이미지를 불러오는데 실패했습니다.');
        }
      }
    };

    loadPendingImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 한 번만 실행

  const value: MenuScanContextValue = {
    selectedImage,
    previewUrl,
    errorMessage,
    handleImageSelect,
    handleImageRemove,
    clearError,
  };

  return (
    <MenuScanContext.Provider value={value}>
      {children}
    </MenuScanContext.Provider>
  );
}

export function useMenuScan() {
  const context = useContext(MenuScanContext);
  if (!context) {
    throw new Error('useMenuScan must be used within a MenuScanProvider');
  }
  return context;
}
