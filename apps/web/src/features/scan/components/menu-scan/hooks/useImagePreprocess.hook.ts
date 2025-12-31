'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * 이미지 전처리 결과 인터페이스
 */
export interface ImagePreprocessResult {
  /** 전처리된 이미지 Blob */
  preprocessedImage: Blob | null;
  /** Base64 인코딩된 이미지 */
  base64: string | null;
  /** 처리 중 상태 */
  isProcessing: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * 크롭 영역 인터페이스
 */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 이미지 차원 인터페이스
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 이미지 전처리 훅 반환 타입
 */
export interface UseImagePreprocessReturn extends ImagePreprocessResult {
  /** 이미지 전처리 시작 */
  processImage: (file: File | Blob) => Promise<void>;
  /** 이미지 회전 (90도 단위) */
  rotate: (degrees?: number) => Promise<void>;
  /** 이미지 크롭 */
  crop: (area: CropArea) => Promise<void>;
  /** 자동 크롭 (경계 감지) */
  autoCrop: () => Promise<void>;
  /** 대비 조정 */
  adjustContrast: (contrast: number) => Promise<void>;
  /** OCR 최적화 */
  optimizeForOCR: () => Promise<void>;
  /** 이미지 차원 */
  dimensions: ImageDimensions | null;
  /** 원본 이미지 보존 여부 */
  originalPreserved: boolean;
  /** 원본 이미지 */
  originalImage: Blob | null;
  /** 리셋 */
  reset: () => void;
}

/**
 * 허용된 이미지 MIME 타입
 */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Canvas API를 활용한 이미지 전처리 커스텀 훅
 *
 * 기능:
 * 1) 이미지 회전 보정 (EXIF 기반 자동 회전, 수동 90도 단위 회전)
 * 2) 이미지 크롭 (자동 경계 감지, 수동 영역 선택)
 * 3) 대비 보정 (명암 조정, 선명도 향상, OCR 최적화)
 * 4) 결과 반환 (Blob, Base64, 원본 보존)
 */
export function useImagePreprocess(): UseImagePreprocessReturn {
  const [preprocessedImage, setPreprocessedImage] = useState<Blob | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [originalPreserved, setOriginalPreserved] = useState(false);
  const [originalImage, setOriginalImage] = useState<Blob | null>(null);

  // 현재 캔버스 참조 (내부 처리용)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  /**
   * Blob을 Base64로 변환
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Canvas를 Blob으로 변환
   */
  const canvasToBlob = useCallback(
    (
      canvas: HTMLCanvasElement,
      mimeType: string = 'image/png'
    ): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob 변환 실패'));
            }
          },
          mimeType,
          0.92
        );
      });
    },
    []
  );

  /**
   * 이미지 로드 헬퍼
   */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /**
   * EXIF 방향 데이터 읽기
   */
  const getExifOrientation = useCallback(
    async (file: File | Blob): Promise<number> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const view = new DataView(e.target?.result as ArrayBuffer);

          if (view.getUint16(0, false) !== 0xffd8) {
            resolve(1); // Not JPEG
            return;
          }

          let offset = 2;
          while (offset < view.byteLength) {
            if (view.getUint16(offset + 2, false) <= 8) {
              resolve(1);
              return;
            }
            const marker = view.getUint16(offset, false);
            offset += 2;

            if (marker === 0xffe1) {
              const exifIdCode = view.getUint32(offset + 2, false);
              if (exifIdCode !== 0x45786966) {
                resolve(1);
                return;
              }

              const little = view.getUint16(offset + 8, false) === 0x4949;
              offset += 8;

              const tags = view.getUint16(offset + 2, little);
              offset += 4;

              for (let i = 0; i < tags; i++) {
                if (view.getUint16(offset + i * 12, little) === 0x0112) {
                  resolve(view.getUint16(offset + i * 12 + 8, little));
                  return;
                }
              }
            } else if ((marker & 0xff00) !== 0xff00) {
              break;
            } else {
              offset += view.getUint16(offset, false);
            }
          }
          resolve(1);
        };
        reader.onerror = () => resolve(1);
        reader.readAsArrayBuffer(file.slice(0, 65536));
      });
    },
    []
  );

  /**
   * EXIF 방향에 따른 캔버스 변환 적용
   */
  const applyExifOrientation = useCallback(
    (
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
      orientation: number
    ): void => {
      const { width, height } = img;

      switch (orientation) {
        case 2: // 수평 뒤집기
          canvas.width = width;
          canvas.height = height;
          ctx.scale(-1, 1);
          ctx.drawImage(img, -width, 0);
          break;
        case 3: // 180도 회전
          canvas.width = width;
          canvas.height = height;
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -width, -height);
          break;
        case 4: // 수직 뒤집기
          canvas.width = width;
          canvas.height = height;
          ctx.scale(1, -1);
          ctx.drawImage(img, 0, -height);
          break;
        case 5: // 90도 시계방향 + 수평 뒤집기
          canvas.width = height;
          canvas.height = width;
          ctx.rotate(Math.PI / 2);
          ctx.scale(1, -1);
          ctx.drawImage(img, 0, -height);
          break;
        case 6: // 90도 시계방향
          canvas.width = height;
          canvas.height = width;
          ctx.rotate(Math.PI / 2);
          ctx.drawImage(img, 0, -height);
          break;
        case 7: // 90도 반시계방향 + 수평 뒤집기
          canvas.width = height;
          canvas.height = width;
          ctx.rotate(-Math.PI / 2);
          ctx.scale(1, -1);
          ctx.drawImage(img, -width, 0);
          break;
        case 8: // 90도 반시계방향
          canvas.width = height;
          canvas.height = width;
          ctx.rotate(-Math.PI / 2);
          ctx.drawImage(img, -width, 0);
          break;
        default: // 1 또는 알 수 없음
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0);
          break;
      }
    },
    []
  );

  /**
   * 현재 상태 업데이트 헬퍼
   */
  const updateState = useCallback(
    async (canvas: HTMLCanvasElement) => {
      const blob = await canvasToBlob(canvas);
      const b64 = await blobToBase64(blob);

      setPreprocessedImage(blob);
      setBase64(b64);
      setDimensions({ width: canvas.width, height: canvas.height });
    },
    [canvasToBlob, blobToBase64]
  );

  /**
   * 이미지 전처리 시작
   */
  const processImage = useCallback(
    async (file: File | Blob) => {
      setIsProcessing(true);
      setError(null);

      try {
        // 파일 형식 검증
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(
            '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 지원)'
          );
        }

        // 원본 저장
        setOriginalImage(file instanceof Blob ? file : file);
        setOriginalPreserved(true);

        // 이미지 로드
        const imageUrl = URL.createObjectURL(file);
        const img = await loadImage(imageUrl);
        imageRef.current = img;

        // 캔버스 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
        }

        // EXIF 방향 적용
        const orientation = await getExifOrientation(file);
        applyExifOrientation(canvas, ctx, img, orientation);

        canvasRef.current = canvas;

        // 결과 업데이트
        await updateState(canvas);

        URL.revokeObjectURL(imageUrl);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '이미지 처리 중 오류가 발생했습니다.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [loadImage, getExifOrientation, applyExifOrientation, updateState]
  );

  /**
   * 이미지 회전 (90도 단위)
   */
  const rotate = useCallback(
    async (degrees: number = 90) => {
      if (!canvasRef.current) {
        setError('처리할 이미지가 없습니다.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const oldCanvas = canvasRef.current;
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
        }

        const radians = (degrees * Math.PI) / 180;
        const isOddRotation = Math.abs(degrees) % 180 !== 0;

        // 90도 또는 270도 회전 시 width와 height 교체
        if (isOddRotation) {
          newCanvas.width = oldCanvas.height;
          newCanvas.height = oldCanvas.width;
        } else {
          newCanvas.width = oldCanvas.width;
          newCanvas.height = oldCanvas.height;
        }

        // 캔버스 중심으로 이동 후 회전
        ctx.translate(newCanvas.width / 2, newCanvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(oldCanvas, -oldCanvas.width / 2, -oldCanvas.height / 2);

        canvasRef.current = newCanvas;
        await updateState(newCanvas);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '이미지 회전 중 오류가 발생했습니다.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [updateState]
  );

  /**
   * 이미지 크롭
   */
  const crop = useCallback(
    async (area: CropArea) => {
      if (!canvasRef.current) {
        setError('처리할 이미지가 없습니다.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const oldCanvas = canvasRef.current;
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
        }

        // 영역 검증
        const { x, y, width, height } = area;
        if (
          x < 0 ||
          y < 0 ||
          width <= 0 ||
          height <= 0 ||
          x + width > oldCanvas.width ||
          y + height > oldCanvas.height
        ) {
          throw new Error('유효하지 않은 크롭 영역입니다.');
        }

        newCanvas.width = width;
        newCanvas.height = height;

        ctx.drawImage(oldCanvas, x, y, width, height, 0, 0, width, height);

        canvasRef.current = newCanvas;
        await updateState(newCanvas);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '이미지 크롭 중 오류가 발생했습니다.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [updateState]
  );

  /**
   * 자동 크롭 (경계 감지) - 간단한 엣지 감지 기반
   */
  const autoCrop = useCallback(async () => {
    if (!canvasRef.current) {
      setError('처리할 이미지가 없습니다.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const oldCanvas = canvasRef.current;
      const ctx = oldCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
      }

      const imageData = ctx.getImageData(
        0,
        0,
        oldCanvas.width,
        oldCanvas.height
      );
      const data = imageData.data;

      // 배경색 임계값 (흰색에 가까운 픽셀 감지)
      const threshold = 250;
      let minX = oldCanvas.width;
      let minY = oldCanvas.height;
      let maxX = 0;
      let maxY = 0;

      // 비흰색 픽셀 영역 찾기
      for (let y = 0; y < oldCanvas.height; y++) {
        for (let x = 0; x < oldCanvas.width; x++) {
          const idx = (y * oldCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // 흰색이 아닌 픽셀
          if (r < threshold || g < threshold || b < threshold) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      // 유효한 영역이 있는 경우에만 크롭
      if (maxX > minX && maxY > minY) {
        // 약간의 패딩 추가
        const padding = 10;
        const cropX = Math.max(0, minX - padding);
        const cropY = Math.max(0, minY - padding);
        const cropWidth = Math.min(
          oldCanvas.width - cropX,
          maxX - minX + padding * 2
        );
        const cropHeight = Math.min(
          oldCanvas.height - cropY,
          maxY - minY + padding * 2
        );

        const newCanvas = document.createElement('canvas');
        const newCtx = newCanvas.getContext('2d');

        if (!newCtx) {
          throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
        }

        newCanvas.width = cropWidth;
        newCanvas.height = cropHeight;

        newCtx.drawImage(
          oldCanvas,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        canvasRef.current = newCanvas;
        await updateState(newCanvas);
      } else {
        // 변경 없음
        await updateState(oldCanvas);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '자동 크롭 중 오류가 발생했습니다.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [updateState]);

  /**
   * 대비 조정
   */
  const adjustContrast = useCallback(
    async (contrast: number) => {
      if (!canvasRef.current) {
        setError('처리할 이미지가 없습니다.');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // 대비 조정 계산
        const factor =
          (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128)); // R
          data[i + 1] = Math.min(
            255,
            Math.max(0, factor * (data[i + 1] - 128) + 128)
          ); // G
          data[i + 2] = Math.min(
            255,
            Math.max(0, factor * (data[i + 2] - 128) + 128)
          ); // B
        }

        ctx.putImageData(imageData, 0, 0);
        await updateState(canvas);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : '대비 조정 중 오류가 발생했습니다.'
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [updateState]
  );

  /**
   * OCR 최적화 (명암 조정 + 선명도 향상 + 이진화)
   */
  const optimizeForOCR = useCallback(async () => {
    if (!canvasRef.current) {
      setError('처리할 이미지가 없습니다.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 1. 그레이스케일 변환
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      // 2. 대비 향상 (히스토그램 스트레칭)
      let min = 255;
      let max = 0;
      for (let i = 0; i < data.length; i += 4) {
        min = Math.min(min, data[i]);
        max = Math.max(max, data[i]);
      }

      const range = max - min || 1;
      for (let i = 0; i < data.length; i += 4) {
        const normalized = ((data[i] - min) / range) * 255;
        data[i] = normalized;
        data[i + 1] = normalized;
        data[i + 2] = normalized;
      }

      // 3. 선명도 향상 (언샤프 마스킹 효과 - 간단 버전)
      // 이미지 데이터를 복사하여 선명도 적용
      const tempData = new Uint8ClampedArray(data);
      const sharpness = 0.5;

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;

          // 3x3 라플라시안 필터
          const center = tempData[idx];
          const top = tempData[((y - 1) * canvas.width + x) * 4];
          const bottom = tempData[((y + 1) * canvas.width + x) * 4];
          const left = tempData[(y * canvas.width + (x - 1)) * 4];
          const right = tempData[(y * canvas.width + (x + 1)) * 4];

          const laplacian = 4 * center - top - bottom - left - right;
          const sharpened = Math.min(
            255,
            Math.max(0, center + sharpness * laplacian)
          );

          data[idx] = sharpened;
          data[idx + 1] = sharpened;
          data[idx + 2] = sharpened;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      await updateState(canvas);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'OCR 최적화 중 오류가 발생했습니다.'
      );
    } finally {
      setIsProcessing(false);
    }
  }, [updateState]);

  /**
   * 상태 리셋
   */
  const reset = useCallback(() => {
    setPreprocessedImage(null);
    setBase64(null);
    setIsProcessing(false);
    setError(null);
    setDimensions(null);
    setOriginalPreserved(false);
    setOriginalImage(null);
    canvasRef.current = null;
    imageRef.current = null;
  }, []);

  return {
    preprocessedImage,
    base64,
    isProcessing,
    error,
    dimensions,
    originalPreserved,
    originalImage,
    processImage,
    rotate,
    crop,
    autoCrop,
    adjustContrast,
    optimizeForOCR,
    reset,
  };
}

export default useImagePreprocess;
