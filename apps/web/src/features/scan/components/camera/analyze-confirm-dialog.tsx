/**
 * 이미지 분석 확인 모달 컴포넌트
 * 
 * 사용자가 촬영한 이미지를 분석하기 전 확인을 받는 다이얼로그입니다.
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/useTranslation';

interface AnalyzeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  onConfirm: () => void;
}

export function AnalyzeConfirmDialog({
  open,
  onOpenChange,
  imageSrc,
  onConfirm,
}: AnalyzeConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            {t.analyzeConfirmTitle || '이미지 분석하시겠습니까?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {t.analyzeConfirmDescription || 
              '촬영한 이미지를 AI로 분석하여 메뉴 정보를 확인합니다.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* 이미지 썸네일 */}
        {imageSrc && (
          <div className="my-4 flex justify-center">
            <img
              src={imageSrc}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
            />
          </div>
        )}

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="rounded-2xl">
            {t.cancel || '취소'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60]"
          >
            {t.analyzeButton || '분석하기'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

