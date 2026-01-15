'use client';

import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

export default function TestImageFallbackPage() {
  return (
    <div className="container mx-auto p-8" data-testid="page-loaded">
      <h1 className="mb-8 text-2xl font-bold">
        ImageWithFallback 컴포넌트 테스트
      </h1>

      <div className="space-y-8">
        {/* 정상 이미지 */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">정상 이미지</h2>
          <ImageWithFallback
            src="https://picsum.photos/200/300"
            alt="정상 이미지"
            className="h-[300px] w-[200px]"
            data-testid="valid-image"
          />
        </section>

        {/* 에러 이미지 */}
        <section data-testid="error-section">
          <h2 className="mb-4 text-xl font-semibold">
            에러 이미지 (존재하지 않는 URL)
          </h2>
          <ImageWithFallback
            src="https://invalid-url-that-does-not-exist.com/image.jpg"
            alt="에러 이미지"
            className="h-[300px] w-[200px]"
            data-testid="error-image"
          />
        </section>

        {/* 스타일 적용 테스트 */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">스타일 적용 테스트</h2>
          <ImageWithFallback
            src="https://picsum.photos/150/150"
            alt="스타일 테스트"
            className="rounded-lg border-2 border-blue-500"
            style={{ width: '150px', height: '150px' }}
            data-testid="styled-image"
          />
        </section>

        {/* 추가 속성 테스트 */}
        <section>
          <h2 className="mb-4 text-xl font-semibold">추가 속성 테스트</h2>
          <ImageWithFallback
            src="https://picsum.photos/100/100"
            alt="추가 속성 테스트"
            className="h-[100px] w-[100px]"
            loading="lazy"
            data-testid="lazy-image"
            data-custom-attr="test-value"
          />
        </section>
      </div>
    </div>
  );
}
