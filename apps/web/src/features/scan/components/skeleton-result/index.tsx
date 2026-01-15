'use client';

/**
 * 스켈레톤 UI - 분석 결과 로딩 중 표시
 * - 실제 결과 레이아웃을 미리 보여줌
 * - 사용자에게 예상 레이아웃 제공
 */
export function SkeletonResultView() {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Camera Skeleton */}
      <div className="relative h-1/4 min-h-[150px] animate-pulse bg-gray-200" />

      {/* Bottom Section */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* Overall Status Banner Skeleton */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-300" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Filter Buttons Skeleton */}
        <div className="border-b border-gray-200 bg-white px-3 py-3">
          <div className="grid w-full grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
        </div>

        {/* Menu Items Skeleton */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-300" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Button Skeleton */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="h-14 w-full animate-pulse rounded-2xl bg-gray-300" />
        </div>
      </div>
    </div>
  );
}
