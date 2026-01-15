/**
 * 스캔 에러 타입
 * - 에러 원인별 구체적인 타입 정의
 */
export type ScanErrorType =
  | 'NETWORK_ERROR' // 네트워크 연결 실패
  | 'OCR_FAILED' // OCR 추출 실패
  | 'AI_ANALYSIS_FAILED' // AI 분석 실패
  | 'IMAGE_TOO_LARGE' // 이미지 크기 초과
  | 'IMAGE_INVALID' // 잘못된 이미지 형식
  | 'NO_TEXT_DETECTED' // 텍스트 미감지
  | 'AUTH_REQUIRED' // 로그인 필요
  | 'RATE_LIMIT' // 요청 제한 초과
  | 'SERVER_ERROR' // 서버 에러
  | 'UNKNOWN'; // 알 수 없는 에러

/**
 * 에러 정보 인터페이스
 */
export interface ScanError {
  type: ScanErrorType;
  message: string;
  suggestion?: string; // 해결 방법 제안
  retryable: boolean; // 재시도 가능 여부
}

/**
 * 에러 타입별 메시지 및 해결책
 */
export const SCAN_ERROR_INFO: Record<
  ScanErrorType,
  {
    ko: { title: string; message: string; suggestion: string };
    en: { title: string; message: string; suggestion: string };
    retryable: boolean;
  }
> = {
  NETWORK_ERROR: {
    ko: {
      title: '네트워크 연결 실패',
      message: '인터넷 연결을 확인해주세요.',
      suggestion: 'Wi-Fi나 모바일 데이터가 켜져 있는지 확인하세요.',
    },
    en: {
      title: 'Network Connection Failed',
      message: 'Please check your internet connection.',
      suggestion: 'Make sure Wi-Fi or mobile data is turned on.',
    },
    retryable: true,
  },
  OCR_FAILED: {
    ko: {
      title: '텍스트 추출 실패',
      message: '메뉴판의 텍스트를 인식할 수 없습니다.',
      suggestion:
        '조명이 밝은 곳에서 글자가 선명하게 보이도록 다시 촬영해주세요.',
    },
    en: {
      title: 'Text Extraction Failed',
      message: 'Unable to recognize text from the menu.',
      suggestion: 'Please retake in good lighting with clear text visible.',
    },
    retryable: true,
  },
  AI_ANALYSIS_FAILED: {
    ko: {
      title: 'AI 분석 실패',
      message: '메뉴 분석 중 문제가 발생했습니다.',
      suggestion: '잠시 후 다시 시도해주세요.',
    },
    en: {
      title: 'AI Analysis Failed',
      message: 'An error occurred during menu analysis.',
      suggestion: 'Please try again in a moment.',
    },
    retryable: true,
  },
  IMAGE_TOO_LARGE: {
    ko: {
      title: '이미지 크기 초과',
      message: '이미지 파일이 너무 큽니다.',
      suggestion: '카메라 설정을 낮추거나 다른 이미지를 사용해주세요.',
    },
    en: {
      title: 'Image Too Large',
      message: 'The image file is too large.',
      suggestion: 'Lower camera settings or use a different image.',
    },
    retryable: true,
  },
  IMAGE_INVALID: {
    ko: {
      title: '잘못된 이미지',
      message: '지원하지 않는 이미지 형식입니다.',
      suggestion: 'JPG, PNG 형식의 이미지를 사용해주세요.',
    },
    en: {
      title: 'Invalid Image',
      message: 'Unsupported image format.',
      suggestion: 'Please use JPG or PNG format images.',
    },
    retryable: true,
  },
  NO_TEXT_DETECTED: {
    ko: {
      title: '텍스트 미감지',
      message: '이미지에서 메뉴 텍스트를 찾을 수 없습니다.',
      suggestion: '메뉴판이 화면 중앙에 오도록 다시 촬영해주세요.',
    },
    en: {
      title: 'No Text Detected',
      message: 'Could not find menu text in the image.',
      suggestion: 'Please retake with the menu centered in frame.',
    },
    retryable: true,
  },
  AUTH_REQUIRED: {
    ko: {
      title: '로그인 필요',
      message: '이 기능을 사용하려면 로그인이 필요합니다.',
      suggestion: '로그인 후 다시 시도해주세요.',
    },
    en: {
      title: 'Login Required',
      message: 'You need to login to use this feature.',
      suggestion: 'Please login and try again.',
    },
    retryable: false,
  },
  RATE_LIMIT: {
    ko: {
      title: '요청 제한 초과',
      message: '너무 많은 요청을 보냈습니다.',
      suggestion: '잠시 후 다시 시도해주세요. (1분 대기)',
    },
    en: {
      title: 'Rate Limit Exceeded',
      message: 'Too many requests sent.',
      suggestion: 'Please wait a moment and try again. (Wait 1 minute)',
    },
    retryable: true,
  },
  SERVER_ERROR: {
    ko: {
      title: '서버 에러',
      message: '서버에서 문제가 발생했습니다.',
      suggestion:
        '잠시 후 다시 시도해주세요. 문제가 지속되면 고객센터에 문의하세요.',
    },
    en: {
      title: 'Server Error',
      message: 'A server error occurred.',
      suggestion:
        'Please try again later. Contact support if the problem persists.',
    },
    retryable: true,
  },
  UNKNOWN: {
    ko: {
      title: '알 수 없는 에러',
      message: '예상치 못한 문제가 발생했습니다.',
      suggestion: '다시 시도해주세요. 문제가 계속되면 고객센터에 문의하세요.',
    },
    en: {
      title: 'Unknown Error',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again. Contact support if the issue continues.',
    },
    retryable: true,
  },
};

/**
 * 에러 타입 감지 헬퍼 함수
 */
export function detectErrorType(error: unknown): ScanErrorType {
  if (!error) return 'UNKNOWN';

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  if (errorMessage.includes('ocr')) {
    return 'OCR_FAILED';
  }
  if (errorMessage.includes('no text') || errorMessage.includes('텍스트')) {
    return 'NO_TEXT_DETECTED';
  }
  if (errorMessage.includes('too large') || errorMessage.includes('크기')) {
    return 'IMAGE_TOO_LARGE';
  }
  if (errorMessage.includes('invalid') || errorMessage.includes('형식')) {
    return 'IMAGE_INVALID';
  }
  if (errorMessage.includes('auth') || errorMessage.includes('login')) {
    return 'AUTH_REQUIRED';
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return 'RATE_LIMIT';
  }
  if (errorMessage.includes('server') || errorMessage.includes('500')) {
    return 'SERVER_ERROR';
  }
  if (errorMessage.includes('ai') || errorMessage.includes('analysis')) {
    return 'AI_ANALYSIS_FAILED';
  }

  return 'UNKNOWN';
}
