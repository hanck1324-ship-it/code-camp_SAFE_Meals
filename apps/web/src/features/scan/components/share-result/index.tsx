'use client';

import html2canvas from 'html2canvas';
import {
  Share2,
  Download,
  Copy,
  MessageCircle,
  Mail,
  Check,
} from 'lucide-react';
import { useState } from 'react';

interface ShareResultProps {
  resultElementId: string; // 캡처할 결과 영역의 ID
  language?: 'ko' | 'en';
}

/**
 * 결과 공유 및 저장 컴포넌트
 * - 이미지로 저장
 * - SNS 공유 (카카오톡, 페이스북, 트위터)
 * - 링크 복사
 */
export function ShareResult({
  resultElementId,
  language = 'ko',
}: ShareResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * 결과를 이미지로 캡처하여 다운로드
   */
  const handleDownloadImage = async () => {
    setIsCapturing(true);
    try {
      const element = document.getElementById(resultElementId);
      if (!element) {
        throw new Error('Result element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `safe-meals-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // 성공 알림
      alert(language === 'ko' ? '이미지가 저장되었습니다!' : 'Image saved!');
    } catch (error) {
      console.error('Failed to capture image:', error);
      alert(
        language === 'ko'
          ? '이미지 저장에 실패했습니다.'
          : 'Failed to save image.'
      );
    } finally {
      setIsCapturing(false);
      setIsOpen(false);
    }
  };

  /**
   * 현재 URL 복사
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  /**
   * SNS 공유 (카카오톡)
   */
  const handleShareKakao = () => {
    if (typeof window !== 'undefined' && (window as any).Kakao) {
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title:
            language === 'ko'
              ? 'SAFE Meals 스캔 결과'
              : 'SAFE Meals Scan Result',
          description:
            language === 'ko'
              ? '메뉴 스캔 결과를 확인해보세요!'
              : 'Check out my menu scan result!',
          imageUrl: 'https://your-app-url.com/og-image.png',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      });
    } else {
      alert(
        language === 'ko'
          ? '카카오톡 공유를 사용할 수 없습니다.'
          : 'KakaoTalk sharing is not available.'
      );
    }
    setIsOpen(false);
  };

  /**
   * 이메일 공유
   */
  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      language === 'ko' ? 'SAFE Meals 스캔 결과' : 'SAFE Meals Scan Result'
    );
    const body = encodeURIComponent(
      `${language === 'ko' ? '메뉴 스캔 결과를 확인해보세요' : 'Check out my menu scan result'}: ${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsOpen(false);
  };

  /**
   * 네이티브 공유 (모바일)
   */
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title:
            language === 'ko'
              ? 'SAFE Meals 스캔 결과'
              : 'SAFE Meals Scan Result',
          text:
            language === 'ko'
              ? '메뉴 스캔 결과를 확인해보세요!'
              : 'Check out my menu scan result!',
          url: window.location.href,
        });
        setIsOpen(false);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // 네이티브 공유 미지원 시 공유 옵션 표시
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => {
          // 모바일에서는 네이티브 공유, 데스크톱에서는 옵션 표시
          if (typeof navigator.share === 'function') {
            handleNativeShare();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="hover:bg-primary/5 flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-white font-semibold text-primary shadow-sm transition-colors active:scale-95"
        style={{ minHeight: '52px', paddingLeft: '20px', paddingRight: '20px' }}
        disabled={isCapturing}
      >
        <Share2 style={{ width: '20px', height: '20px' }} />
        <span style={{ fontSize: '15px' }}>
          {language === 'ko' ? '결과 공유' : 'Share Result'}
        </span>
      </button>

      {/* Share Options Modal */}
      {isOpen && typeof navigator.share !== 'function' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setIsOpen(false)}
          />

          {/* Options Panel */}
          <div className="absolute bottom-full right-0 z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Download as Image */}
            <button
              onClick={handleDownloadImage}
              disabled={isCapturing}
              className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Download
                style={{ width: '20px', height: '20px' }}
                className="text-gray-700"
              />
              <span className="text-sm font-medium text-gray-900">
                {isCapturing
                  ? language === 'ko'
                    ? '저장 중...'
                    : 'Saving...'
                  : language === 'ko'
                    ? '이미지로 저장'
                    : 'Save as Image'}
              </span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              {isCopied ? (
                <Check
                  style={{ width: '20px', height: '20px' }}
                  className="text-green-600"
                />
              ) : (
                <Copy
                  style={{ width: '20px', height: '20px' }}
                  className="text-gray-700"
                />
              )}
              <span className="text-sm font-medium text-gray-900">
                {isCopied
                  ? language === 'ko'
                    ? '링크 복사됨!'
                    : 'Link Copied!'
                  : language === 'ko'
                    ? '링크 복사'
                    : 'Copy Link'}
              </span>
            </button>

            {/* Share via KakaoTalk */}
            <button
              onClick={handleShareKakao}
              className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <MessageCircle
                style={{ width: '20px', height: '20px' }}
                className="text-yellow-500"
              />
              <span className="text-sm font-medium text-gray-900">
                {language === 'ko' ? '카카오톡 공유' : 'Share via KakaoTalk'}
              </span>
            </button>

            {/* Share via Email */}
            <button
              onClick={handleShareEmail}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <Mail
                style={{ width: '20px', height: '20px' }}
                className="text-gray-700"
              />
              <span className="text-sm font-medium text-gray-900">
                {language === 'ko' ? '이메일 공유' : 'Share via Email'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

