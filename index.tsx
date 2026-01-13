'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Download, 
  Copy, 
  RefreshCw, 
  AlertCircle, 
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface MenuItem {
  name: string;
  price: string;
  confidence: number;
  rawTexts: string[];
  safetyStatus?: 'SAFE' | 'CAUTION' | 'DANGER';
  reason?: string;
}

export interface MenuGroupingResult {
  menuItems: MenuItem[];
  totalItems: number;
  averageConfidence: number;
  isProcessing: boolean;
  error: string | null;
}

interface ResultSectionProps {
  result: MenuGroupingResult;
  onRetry: () => void;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function ResultSection({ result, onRetry }: ResultSectionProps) {
  const { menuItems, totalItems, averageConfidence, isProcessing, error } = result;
  
  // 선택된 항목 관리 (인덱스 기준)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [copySuccess, setCopySuccess] = useState(false);

  // 데이터가 로드되면 초기 선택 상태 설정 (필요시 전체 선택 등)
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      // UX 편의를 위해 초기에는 아무것도 선택하지 않거나, 필요하면 전체 선택
      setSelectedIndices(new Set());
    }
  }, [menuItems]);

  // 전체 선택 토글
  const toggleSelectAll = () => {
    if (selectedIndices.size === menuItems.length) {
      setSelectedIndices(new Set());
    } else {
      const allIndices = new Set(menuItems.map((_, idx) => idx));
      setSelectedIndices(allIndices);
    }
  };

  // 개별 선택 토글
  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  // JSON 내보내기
  const handleExportJSON = () => {
    const selectedItems = menuItems.filter((_, idx) => selectedIndices.has(idx));
    if (selectedItems.length === 0) return;

    const jsonString = JSON.stringify(selectedItems, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `menu-scan-result-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 클립보드 복사
  const handleCopyClipboard = async () => {
    const selectedItems = menuItems.filter((_, idx) => selectedIndices.has(idx));
    if (selectedItems.length === 0) return;

    const text = selectedItems
      .map(item => `${item.name} - ${item.price}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 신뢰도에 따른 색상 클래스 반환
  const getConfidenceColorClass = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.5) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-500 border-gray-200 opacity-70';
  };

  // 안전 등급에 따른 스타일 및 아이콘 반환 (Tailwind 클래스 정적 매핑)
  const getSafetyStatusInfo = (status?: string) => {
    switch (status) {
      case 'DANGER':
        return {
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          label: '위험'
        };
      case 'CAUTION':
        return {
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <ShieldAlert className="w-4 h-4 text-orange-600" />,
          label: '주의'
        };
      case 'SAFE':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <ShieldCheck className="w-4 h-4 text-green-600" />,
          label: '안전'
        };
      default:
        return null;
    }
  };

  // 1. 로딩 상태
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-gray-500 font-medium">메뉴를 분석하고 있습니다...</p>
      </div>
    );
  }

  // 2. 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px] text-center">
        <div className="p-3 bg-red-100 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">분석 실패</h3>
          <p className="text-gray-500 max-w-md">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>다시 시도</span>
        </button>
      </div>
    );
  }

  // 3. 데이터 없음 상태
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px] text-center border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-500">메뉴를 찾을 수 없습니다.</p>
        <button
          onClick={onRetry}
          className="text-blue-600 hover:underline text-sm mt-2"
        >
          다른 이미지로 시도하기
        </button>
      </div>
    );
  }

  // 4. 결과 표시 상태
  return (
    <div className="space-y-6">
      {/* 헤더: 통계 및 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-900">분석 결과</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>전체 {totalItems}개 항목</span>
            <span>평균 신뢰도 {Math.round(averageConfidence * 100)}%</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyClipboard}
            disabled={selectedIndices.size === 0}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="선택 항목 복사"
          >
            {copySuccess ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            복사
          </button>
          <button
            onClick={handleExportJSON}
            disabled={selectedIndices.size === 0}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="선택 항목 JSON 내보내기"
          >
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </button>
          <button
            onClick={onRetry}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="재분석"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 전체 선택 컨트롤 */}
      <div className="flex items-center px-2">
        <button
          onClick={toggleSelectAll}
          className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {selectedIndices.size === menuItems.length && menuItems.length > 0 ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
          <span>전체 선택 ({selectedIndices.size}/{menuItems.length})</span>
        </button>
      </div>

      {/* 메뉴 리스트 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={`
              relative p-4 border rounded-xl transition-all cursor-pointer group
              ${selectedIndices.has(index) 
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'}
            `}
            onClick={() => toggleSelect(index)}
          >
            {/* 체크박스 (우측 상단) */}
            <div className="absolute top-4 right-4">
              {selectedIndices.has(index) ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
              )}
            </div>

            <div className="pr-8 space-y-3">
              {/* 메뉴명 */}
              <div>
                <h3 className="font-bold text-gray-900 line-clamp-2">{item.name}</h3>
              </div>

              {/* 가격 */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {item.price}
                </span>
                
                {/* 안전 등급 뱃지 */}
                {(() => {
                  const statusInfo = getSafetyStatusInfo(item.safetyStatus);
                  if (statusInfo) {
                    return (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* 신뢰도 뱃지 */}
              <div className="flex flex-col space-y-2 pt-2">
                {item.reason && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {item.reason}
                  </p>
                )}
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                  ${getConfidenceColorClass(item.confidence)}
                `}>
                  신뢰도 {Math.round(item.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}