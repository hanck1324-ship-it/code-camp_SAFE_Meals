'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Share2,
  RotateCcw
} from 'lucide-react';

// ----------------------------------------------------------------------
// Types & Mock Data
// ----------------------------------------------------------------------

type SafetyLevel = 'SAFE' | 'CAUTION' | 'WARNING';

// 기존 MOCK 데이터를 활용하되, 새로운 구조에 맞게 매핑하여 사용합니다.
const MOCK_RESULT = {
  menuItems: [
    {
      name: '새우 볶음밥',
      price: '12,000원',
      confidence: 0.95,
      rawTexts: ['Shrimp Fried Rice'],
      nameEn: 'Shrimp Fried Rice',
      description: '신선한 새우와 야채를 볶은 밥',
      safetyStatus: 'DANGER',
      reason: '새우가 포함되어 있습니다 (갑각류 알레르기)'
    },
    {
      name: '계란국',
      price: '5,000원',
      confidence: 0.88,
      rawTexts: ['Egg Soup'],
      nameEn: 'Egg Soup',
      description: '부드러운 계란이 들어간 맑은 국',
      safetyStatus: 'CAUTION',
      reason: '계란이 주재료입니다 (계란 알레르기 주의)'
    },
    {
      name: '공기밥',
      price: '1,000원',
      confidence: 0.99,
      rawTexts: ['Rice'],
      nameEn: 'Steamed Rice',
      description: '흰 쌀밥',
      safetyStatus: 'SAFE',
      reason: '알레르기 유발 성분이 없습니다'
    }
  ],
  totalItems: 3,
  averageConfidence: 0.94,
  isProcessing: false,
  error: null
};

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

function formatKRW(price?: number) {
  if (typeof price !== 'number') return '';
  return `${price.toLocaleString('ko-KR')}원`;
}

function levelMeta(level: SafetyLevel) {
  switch (level) {
    case 'SAFE':
      return {
        label: '안전',
        Icon: CheckCircle2,
        badgeBg: 'bg-green-100',
        badgeFg: 'text-green-700',
        btnOn: 'bg-green-600 text-white border-transparent',
        btnOff: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
      };
    case 'CAUTION':
      return {
        label: '주의',
        Icon: AlertTriangle,
        badgeBg: 'bg-orange-100',
        badgeFg: 'text-orange-700',
        btnOn: 'bg-orange-500 text-white border-transparent',
        btnOff: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
      };
    case 'WARNING':
      return {
        label: '위험',
        Icon: XCircle,
        badgeBg: 'bg-red-100',
        badgeFg: 'text-red-700',
        btnOn: 'bg-red-600 text-white border-transparent',
        btnOff: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
      };
  }
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function MenuScanResultPage() {
  const router = useRouter();
  const [active, setActive] = useState<SafetyLevel>('SAFE');
  const [openRiskId, setOpenRiskId] = useState<string | null>(null);

  // 데이터 매핑 (기존 구조 -> 새로운 UI 구조)
  const menuItems = useMemo(() => {
    return MOCK_RESULT.menuItems.map((item, index) => ({
      id: `menu-${index}`,
      menuName: item.name,
      // "12,000원" 문자열에서 숫자만 추출
      price: parseInt(item.price.replace(/[^0-9]/g, ''), 10),
      // DANGER를 WARNING으로 매핑
      safetyLevel: (item.safetyStatus === 'DANGER' ? 'WARNING' : item.safetyStatus || 'SAFE') as SafetyLevel,
      riskReasons: item.reason ? [item.reason] : [],
      description: item.description
    }));
  }, []);

  const counts = useMemo(() => {
    return {
      SAFE: menuItems.filter(i => i.safetyLevel === 'SAFE').length,
      CAUTION: menuItems.filter(i => i.safetyLevel === 'CAUTION').length,
      WARNING: menuItems.filter(i => i.safetyLevel === 'WARNING').length,
      total: menuItems.length,
    };
  }, [menuItems]);

  const filtered = useMemo(() => {
    return menuItems.filter((m) => m.safetyLevel === active);
  }, [menuItems, active]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-xl px-4 pb-20 pt-5">
        {/* 상단 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.back()}
                className="p-1 -ml-1 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold leading-tight">메뉴 안전 진단</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 pl-1">
              총 {counts.total}개 메뉴가 분석되었습니다
            </p>
          </div>
        </header>

        {/* 모드 스위치 버튼 3개 */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {(['SAFE', 'CAUTION', 'WARNING'] as SafetyLevel[]).map((lvl) => {
              const meta = levelMeta(lvl);
              const isOn = active === lvl;
              const count = counts[lvl];

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setActive(lvl)}
                  className={`
                    flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition-all border
                    ${isOn ? meta.btnOn : meta.btnOff}
                  `}
                  aria-pressed={isOn}
                >
                  <span className="flex flex-col items-center justify-center gap-1">
                    <span className="flex items-center gap-1.5">
                      <meta.Icon className="h-4 w-4" />
                      <span>{meta.label}</span>
                    </span>
                    <span className={`text-lg font-bold ${isOn ? 'opacity-100' : 'opacity-60'}`}>
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-center text-gray-400">
            버튼을 눌러 안전 등급별 메뉴를 확인하세요
          </p>
        </div>

        {/* 카드 리스트 영역 */}
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-base font-semibold text-gray-900">
                해당 등급의 메뉴가 없습니다
              </p>
              <p className="mt-1 text-sm text-gray-500">
                다른 등급을 선택해보세요
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const meta = levelMeta(item.safetyLevel);
              const Icon = meta.Icon;
              const hasReasons = (item.riskReasons?.length ?? 0) > 0;
              const isOpen = openRiskId === item.id;

              return (
                <div
                  key={item.id}
                  className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* 배지 (우측 상단) */}
                  <div className={`
                    absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1
                    ${meta.badgeBg} ${meta.badgeFg} text-xs font-bold
                  `}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{meta.label}</span>
                  </div>

                  {/* 메뉴 정보 */}
                  <div className="pr-20 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1">
                      {item.menuName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                      {item.price ? formatKRW(item.price) : '가격 정보 없음'}
                    </div>
                  </div>

                  {/* 간단 설명 */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* 위험 근거 토글 */}
                  {hasReasons && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setOpenRiskId(isOpen ? null : item.id)}
                        className="flex w-full items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        <div className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          <span>위험 분석 결과 보기</span>
                        </div>
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {isOpen && (
                        <div className="mt-2 rounded-lg bg-gray-50 p-3">
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {item.riskReasons!.map((r, idx) => (
                              <li key={`${item.id}-reason-${idx}`} className="leading-relaxed">
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* 하단 액션 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 pb-8">
          <div className="mx-auto flex max-w-xl gap-3">
            <button
              type="button"
              onClick={() => console.log('Retry')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              다시 분석하기
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              결과 공유하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}