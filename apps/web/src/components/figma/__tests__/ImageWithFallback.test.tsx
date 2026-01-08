import { render, screen, waitFor, act } from '@testing-library/react';
import { ImageWithFallback } from '../ImageWithFallback';
import React from 'react';

describe('ImageWithFallback 컴포넌트', () => {
  it('정상 이미지가 올바르게 렌더링되어야 함', () => {
    render(
      <ImageWithFallback
        src="https://example.com/valid-image.jpg"
        alt="테스트 이미지"
        data-testid="test-image"
      />
    );

    const image = screen.getByTestId('test-image') as HTMLImageElement;
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/valid-image.jpg');
    expect(image).toHaveAttribute('alt', '테스트 이미지');
    expect(image.tagName).toBe('IMG');
  });

  it('이미지 로드 에러 시 폴백 UI를 표시해야 함', async () => {
    render(
      <ImageWithFallback
        src="https://invalid-url.com/broken-image.jpg"
        alt="에러 이미지"
        data-testid="error-image"
      />
    );

    const image = screen.getByTestId('error-image') as HTMLImageElement;

    // 이미지 에러 이벤트 발생시키기
    act(() => {
      image.dispatchEvent(new Event('error'));
    });

    // 폴백 이미지가 표시될 때까지 대기
    await waitFor(() => {
      const fallbackImage = screen.getByAltText('Error loading image') as HTMLImageElement;
      expect(fallbackImage).toBeInTheDocument();
      expect(fallbackImage.src).toContain('data:image/svg+xml;base64');
    });
  });

  it('폴백 UI에 원본 URL이 data 속성으로 저장되어야 함', async () => {
    const originalUrl = 'https://broken-image.com/image.jpg';

    render(
      <ImageWithFallback
        src={originalUrl}
        alt="에러 이미지"
        data-testid="error-image"
      />
    );

    const image = screen.getByTestId('error-image') as HTMLImageElement;
    act(() => {
      image.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      const fallbackImage = screen.getByAltText('Error loading image') as HTMLImageElement;
      expect(fallbackImage).toHaveAttribute('data-original-url', originalUrl);
    });
  });

  it('className prop이 올바르게 적용되어야 함', () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="테스트"
        className="custom-class rounded-lg"
        data-testid="styled-image"
      />
    );

    const image = screen.getByTestId('styled-image');
    expect(image).toHaveClass('custom-class', 'rounded-lg');
  });

  it('style prop이 올바르게 적용되어야 함', () => {
    const customStyle = { width: '200px', height: '200px' };

    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="테스트"
        style={customStyle}
        data-testid="styled-image"
      />
    );

    const image = screen.getByTestId('styled-image');
    expect(image).toHaveStyle(customStyle);
  });

  it('에러 발생 후 폴백 컨테이너에 className이 적용되어야 함', async () => {
    render(
      <ImageWithFallback
        src="https://broken.com/image.jpg"
        alt="에러"
        className="test-class"
        data-testid="error-image"
      />
    );

    const image = screen.getByTestId('error-image') as HTMLImageElement;
    act(() => {
      image.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      const fallbackImage = screen.getByTestId('error-image');
      const fallbackContainer = fallbackImage.parentElement?.parentElement;
      expect(fallbackContainer).toHaveClass('test-class');
    });
  });

  it('에러 발생 후 폴백 컨테이너에 style이 적용되어야 함', async () => {
    const customStyle = { width: '300px', height: '300px' };

    render(
      <ImageWithFallback
        src="https://broken.com/image.jpg"
        alt="에러"
        style={customStyle}
        data-testid="error-image"
      />
    );

    const image = screen.getByTestId('error-image') as HTMLImageElement;
    act(() => {
      image.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      const fallbackImage = screen.getByTestId('error-image');
      const fallbackContainer = fallbackImage.parentElement?.parentElement;
      expect(fallbackContainer).toHaveStyle(customStyle);
    });
  });

  it('추가 HTML 속성이 이미지에 전달되어야 함', () => {
    render(
      <ImageWithFallback
        src="https://example.com/image.jpg"
        alt="테스트"
        loading="lazy"
        data-testid="lazy-image"
        data-custom="custom-value"
      />
    );

    const image = screen.getByTestId('lazy-image');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('data-custom', 'custom-value');
  });

  it('폴백 UI의 구조가 올바른지 확인', async () => {
    render(
      <ImageWithFallback
        src="https://broken.com/image.jpg"
        alt="에러"
        className="error-class"
        data-testid="error-image"
      />
    );

    const image = screen.getByTestId('error-image') as HTMLImageElement;
    act(() => {
      image.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      // 폴백 이미지 확인
      const fallbackImage = screen.getByAltText('Error loading image');
      expect(fallbackImage).toBeInTheDocument();

      // 내부 flex 컨테이너 확인 (폴백 이미지의 부모)
      const flexContainer = fallbackImage.parentElement;
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer?.tagName).toBe('DIV');
      expect(flexContainer).toHaveClass('flex', 'h-full', 'w-full', 'items-center', 'justify-center');

      // 폴백 컨테이너 확인 (flex의 부모)
      const fallbackContainer = flexContainer?.parentElement;
      expect(fallbackContainer).toBeInTheDocument();
      expect(fallbackContainer?.tagName).toBe('DIV');
      expect(fallbackContainer).toHaveClass('bg-gray-100', 'text-center', 'error-class');
    });
  });

  it('여러 이미지가 독립적으로 동작해야 함', async () => {
    render(
      <>
        <ImageWithFallback
          src="https://valid.com/image1.jpg"
          alt="정상 이미지 1"
          data-testid="valid-image-1"
        />
        <ImageWithFallback
          src="https://broken.com/image2.jpg"
          alt="에러 이미지"
          data-testid="error-image"
        />
        <ImageWithFallback
          src="https://valid.com/image3.jpg"
          alt="정상 이미지 2"
          data-testid="valid-image-2"
        />
      </>
    );

    // 에러 이미지만 에러 발생
    const errorImage = screen.getByTestId('error-image') as HTMLImageElement;
    act(() => {
      errorImage.dispatchEvent(new Event('error'));
    });

    // 정상 이미지는 여전히 img 태그로 존재
    const validImage1 = screen.getByTestId('valid-image-1');
    const validImage2 = screen.getByTestId('valid-image-2');
    expect(validImage1.tagName).toBe('IMG');
    expect(validImage2.tagName).toBe('IMG');

    // 에러 이미지만 폴백 표시
    await waitFor(() => {
      const fallbackImage = screen.getByAltText('Error loading image');
      expect(fallbackImage).toBeInTheDocument();
    });
  });
});
