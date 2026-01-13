import { useState, useCallback } from 'react';
import { AnalysisLoadingStage } from '@/features/scan/types/loading';

export type SafetyLevel = 'SAFE' | 'CAUTION' | 'WARNING';

export interface MenuAnalysisItem {
  id: string;
  menuName: string;
  price?: number;
  safetyLevel: SafetyLevel;
  riskReasons: string[];
  description?: string;
  confidence: number;
}

export interface MenuGroupingResult {
  menuItems: MenuAnalysisItem[];
  totalItems: number;
  loadingStage: AnalysisLoadingStage;
  error: string | null;
  analyzeMenu: (imageFile: File, language?: string) => Promise<void>;
}

export const useMenuGrouping = (): MenuGroupingResult => {
  const [menuItems, setMenuItems] = useState<MenuAnalysisItem[]>([]);
  const [loadingStage, setLoadingStage] = useState<AnalysisLoadingStage>('idle');
  const [error, setError] = useState<string | null>(null);

  const analyzeMenu = useCallback(async (imageFile: File, language: string = 'ko') => {
    setLoadingStage('compressing'); // 1. 압축 시작
    setError(null);
    setMenuItems([]); // 이전 결과 초기화

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('language', language);

      // UI에서 진행 상태를 보여주기 위한 가상 지연
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingStage('fetching-context'); // 2. 사용자 정보 조회
      await new Promise(resolve => setTimeout(resolve, 300));
      setLoadingStage('analyzing-ocr'); // 3. OCR 분석
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStage('analyzing-ai'); // 4. AI 상세 분석

      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `분석 실패 (${response.status})`);
      }

      const data = await response.json();
      
      // AI 응답 데이터(31prompts 기준)를 UI 모델로 변환
      // data.results: Array<{ id, original_name, translated_name, price, safety_status, reason, description, confidence }>
      
      const parsedItems: MenuAnalysisItem[] = (data.results || []).map((item: any, index: number) => {
        // 가격 파싱: "12,000 KRW" -> 12000
        const priceString = item.price || '';
        const priceNumber = parseInt(priceString.replace(/[^0-9]/g, ''), 10);

        // safety_status 매핑: DANGER -> WARNING
        let safetyLevel: SafetyLevel = 'SAFE';
        if (item.safety_status === 'DANGER') safetyLevel = 'WARNING';
        else if (item.safety_status === 'CAUTION') safetyLevel = 'CAUTION';

        return {
          id: item.id || `menu-${index}`,
          menuName: item.translated_name || item.original_name || '이름 없음',
          price: isNaN(priceNumber) ? undefined : priceNumber,
          safetyLevel,
          riskReasons: item.reason ? [item.reason] : [],
          description: item.description,
          confidence: item.confidence || 0
        };
      });

      setMenuItems(parsedItems);
    } catch (err) {
      console.error('Menu analysis error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoadingStage('complete');
    }
  }, []);

  return {
    menuItems,
    totalItems: menuItems.length,
    loadingStage,
    error,
    analyzeMenu
  };
};