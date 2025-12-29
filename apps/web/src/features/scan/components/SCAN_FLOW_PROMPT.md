# 📸 스캔 기능 플로우 및 구현 가이드

## 🎯 전체 플로우 개요

스캔 기능은 다음과 같은 6단계 플로우로 구성됩니다:

```
1. 스캔창 진입
   ↓
2. 카메라 켜짐
   ↓
3. 카메라 버튼 클릭 (촬영)
   ↓
4. 찍힌 이미지 확인 (미리보기)
   ↓
5. 모달창 표시 ("이미지 분석하시겠습니까?")
   ↓
6. 확인 시 OCR/AI API 호출 → 결과 페이지 이동
```

---

## 📋 단계별 상세 설명

### 1️⃣ 스캔창 진입 (`/scan`)

**파일**: `apps/web/src/app/scan/page.tsx`

**동작**:
- 사용자가 스캔 메뉴를 클릭하여 스캔 페이지로 이동
- `CameraScreen` 컴포넌트 렌더링
- 인증 확인 (`RequireAuth`)

**상태**:
- `isProcessing: false` (초기 상태)

---

### 2️⃣ 카메라 켜짐

**파일**: `apps/web/src/features/scan/components/camera/hooks/useCamera.ts`

**동작**:
- `useCamera` 훅이 자동으로 카메라 권한 요청
- `navigator.mediaDevices.getUserMedia()` 호출
- 비디오 스트림 시작
- 카메라 비디오가 화면에 표시됨

**UI 표시**:
- 카메라 비디오 스트림
- 상단 헤더 ("메뉴를 촬영하세요")
- 스캔 프레임 (녹색 테두리)
- 하단 컨트롤 (플래시 토글, 촬영 버튼)

**상태**:
- `hasPermission: true | false | null`
- `isStreaming: true` (스트림 시작 후)
- `capturedImage: null`

---

### 3️⃣ 카메라 버튼 클릭 (촬영)

**파일**: 
- `apps/web/src/features/scan/components/camera/camera-controls.tsx` (버튼 UI)
- `apps/web/src/features/scan/components/camera-view.tsx` (이벤트 처리)

**구현 방식**: **이벤트 버블링 (Event Bubbling)**

**동작**:
1. 사용자가 하단의 녹색 촬영 버튼 클릭
2. 이벤트가 버블링되어 최상위 `div`의 `onClick` 핸들러로 전달
3. `handleCaptureAreaClick()` 함수에서 `closest('[data-action="capture"]')`로 촬영 버튼 클릭 감지
4. 확인되면 `handleCapture()` 함수 실행
5. Canvas를 사용하여 현재 비디오 프레임을 이미지로 캡처
6. Base64 형식으로 변환 (`canvas.toDataURL('image/jpeg', 0.8)`)
7. 카메라 스트림 일시 중지 (배터리 절약)

**이벤트 버블링 구현 코드**:
```tsx
// camera-view.tsx
const handleCaptureAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  if (isProcessing) return;
  
  const target = e.target as HTMLElement;
  const captureButton = target.closest('[data-action="capture"]');
  
  if (captureButton) {
    e.preventDefault();
    e.stopPropagation();
    handleCapture();
  }
}, [isProcessing, handleCapture]);

// 최상위 div에 onClick 핸들러 연결
<div className="relative min-h-screen bg-black" onClick={handleCaptureAreaClick}>
```

**버튼 구조**:
```tsx
// camera-controls.tsx
<button
  data-action="capture"  // 이벤트 버블링 식별자
  data-testid="capture-button"
  disabled={isProcessing}
  // onClick 제거 - 이벤트 버블링으로 처리
>
  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60]" />
</button>
```

**이벤트 버블링의 장점**:
- ✅ 디자인 요소와 기능 분리: 버튼 내부 요소 클릭도 정상 처리
- ✅ 유연성: 버튼 구조 변경 시에도 동작
- ✅ 일관성: 이벤트 버블링 패턴으로 통일된 이벤트 처리

**상태 변경**:
- `capturedImage: string` (Base64 이미지 데이터)
- `isStreaming: false`

**UI 전환**:
- 카메라 뷰 숨김
- 이미지 미리보기 화면 표시

---

### 4️⃣ 찍힌 이미지 확인 (미리보기)

**파일**: `apps/web/src/features/scan/components/image-preview.tsx`

**동작**:
- 촬영된 이미지가 전체 화면으로 표시됨
- 상단에 "사진 확인" 헤더 표시
- 하단에 두 개의 버튼:
  - **"다시 촬영"** 버튼 (회색)
  - **"사용하기"** 버튼 (녹색)

**버튼 동작**:
- **"다시 촬영"**: `handleRetake()` 호출
  - `capturedImage`를 `null`로 설정
  - 카메라 뷰로 돌아감
  - 카메라 스트림 재시작

- **"사용하기"**: `handleConfirm()` 호출
  - ⚠️ **변경 필요**: 현재는 바로 `onCapturePhoto()` 호출
  - ✅ **변경 후**: 확인 모달 표시 (5단계로 이동)

**현재 코드**:
```tsx
// camera-view.tsx
const handleConfirm = () => {
  if (capturedImage) {
    onCapturePhoto(capturedImage); // 바로 API 호출
  }
};
```

---

### 5️⃣ 모달창 표시 ("이미지 분석하시겠습니까?")

**🆕 새로 구현 필요**

**파일**: `apps/web/src/features/scan/components/camera/analyze-confirm-dialog.tsx` (신규 생성)

**동작**:
- "사용하기" 버튼 클릭 시 모달 다이얼로그 표시
- 모달 내용:
  - 제목: "이미지 분석하시겠습니까?"
  - 설명: "촬영한 이미지를 AI로 분석하여 메뉴 정보를 확인합니다."
  - 촬영된 이미지 썸네일 표시 (선택사항)
  - 버튼:
    - **"취소"** (회색): 모달 닫기, 이미지 미리보기로 돌아감
    - **"분석하기"** (녹색): 6단계로 진행

**구현 방법**:
- `@/components/ui/dialog` 사용 (shadcn/ui)
- 또는 `@/components/ui/alert-dialog` 사용

**상태 관리**:
- `showAnalyzeDialog: boolean` (모달 표시 여부)
- `pendingImage: string | null` (분석 대기 중인 이미지)

**다국어 지원**:
- `translations.ts`에 다음 키 추가 필요:
  - `analyzeConfirmTitle`: "이미지 분석하시겠습니까?"
  - `analyzeConfirmDescription`: "촬영한 이미지를 AI로 분석하여 메뉴 정보를 확인합니다."
  - `analyzeButton`: "분석하기"
  - `cancelButton`: "취소"

---

### 6️⃣ 확인 시 OCR/AI API 호출

**파일**: `apps/web/src/app/scan/page.tsx`

**동작**:
- 모달에서 "분석하기" 버튼 클릭
- `handleCapturePhoto(imageData)` 함수 호출
- 로딩 오버레이 표시 (`isProcessing: true`)
- API 호출: `POST /api/scan/analyze`
  - 요청 본문:
    ```json
    {
      "image": "data:image/jpeg;base64,...",
      "language": "ko"
    }
    ```
- API 응답 처리:
  - 성공: `sessionStorage`에 결과 저장 → 결과 페이지로 이동
  - 실패: 에러 토스트 표시, 로딩 상태 해제

**API 엔드포인트**: `apps/web/src/app/api/scan/analyze/route.ts`

**처리 과정**:
1. 이미지 데이터 검증
2. MIME 타입 추출
3. Google Gemini API 호출 (OCR + AI 분석)
4. 사용자 알레르기 정보와 비교
5. 안전성 분석 결과 반환

**결과 페이지 이동**:
```tsx
router.push(`/scan/result?key=${scanKey}&imageKey=${imageKey}`);
```

---

## 🔧 구현 체크리스트

### ✅ 현재 구현 완료된 부분

- [x] 스캔창 진입 (`/scan` 페이지)
- [x] 카메라 켜짐 (권한 요청, 스트림 시작)
- [x] 카메라 버튼 클릭 (이미지 캡처) - **이벤트 버블링 구현 완료**
- [x] 찍힌 이미지 확인 (미리보기 화면)
- [x] OCR/AI API 호출 (분석 및 결과 처리)

### 🆕 새로 구현해야 할 부분

- [ ] **확인 모달 컴포넌트 생성**
  - 파일: `apps/web/src/features/scan/components/camera/analyze-confirm-dialog.tsx`
  - shadcn/ui Dialog 또는 AlertDialog 사용
  - 이미지 썸네일 표시 (선택사항)
  - 다국어 지원

- [ ] **ImagePreview 컴포넌트 수정**
  - "사용하기" 버튼 클릭 시 바로 API 호출하지 않음
  - 모달 표시 함수 호출로 변경

- [ ] **camera-view.tsx 수정**
  - `handleConfirm()` 함수 수정
  - 모달 상태 관리 추가
  - 모달에서 확인 시에만 `onCapturePhoto()` 호출

- [ ] **다국어 키 추가**
  - `translations.ts`에 모달 관련 텍스트 추가
  - 모든 언어 (ko, en, ja, zh, es) 지원

- [ ] **타입 정의 추가**
  - `camera/types.ts`에 모달 관련 타입 추가

---

## 📝 코드 변경 예시

### 0. 이벤트 버블링 구현 (✅ 완료)

**camera-controls.tsx**:
```tsx
// 촬영 버튼에 data-action 속성 추가, onClick 제거
<button
  data-action="capture"
  data-testid="capture-button"
  disabled={isProcessing}
  className="..."
>
  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60]" />
</button>
```

**camera-view.tsx**:
```tsx
// 이벤트 버블링 핸들러 추가
const handleCaptureAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
  if (isProcessing) return;
  
  const target = e.target as HTMLElement;
  const captureButton = target.closest('[data-action="capture"]');
  
  if (captureButton) {
    e.preventDefault();
    e.stopPropagation();
    handleCapture();
  }
}, [isProcessing, handleCapture]);

// 최상위 div에 onClick 연결
<div 
  className="relative min-h-screen bg-black"
  onClick={handleCaptureAreaClick}
>
  {/* ... */}
</div>
```

### 1. 확인 모달 컴포넌트 생성

```tsx
// apps/web/src/features/scan/components/camera/analyze-confirm-dialog.tsx
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
        
        {/* 이미지 썸네일 (선택사항) */}
        {imageSrc && (
          <div className="my-4 flex justify-center">
            <img
              src={imageSrc}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover"
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
```

### 2. camera-view.tsx 수정

```tsx
// apps/web/src/features/scan/components/camera-view.tsx
export function CameraScreen({ ... }: CameraScreenProps) {
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  
  // ... 기존 코드 ...

  // 사진 확정 - 모달 표시
  const handleConfirm = () => {
    if (capturedImage) {
      setShowAnalyzeDialog(true); // 모달 표시
    }
  };

  // 모달에서 확인 시 API 호출
  const handleAnalyzeConfirm = () => {
    setShowAnalyzeDialog(false);
    if (capturedImage) {
      onCapturePhoto(capturedImage); // 실제 API 호출
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* ... 기존 코드 ... */}

      {/* 확인 모달 */}
      <AnalyzeConfirmDialog
        open={showAnalyzeDialog}
        onOpenChange={setShowAnalyzeDialog}
        imageSrc={capturedImage}
        onConfirm={handleAnalyzeConfirm}
      />
    </div>
  );
}
```

### 3. translations.ts에 키 추가

```typescript
// apps/web/src/lib/translations.ts
export const translations = {
  ko: {
    // ... 기존 키들 ...
    analyzeConfirmTitle: '이미지 분석하시겠습니까?',
    analyzeConfirmDescription: '촬영한 이미지를 AI로 분석하여 메뉴 정보를 확인합니다.',
    analyzeButton: '분석하기',
    cancel: '취소',
  },
  en: {
    // ... 기존 키들 ...
    analyzeConfirmTitle: 'Analyze this image?',
    analyzeConfirmDescription: 'We will analyze the captured image using AI to check menu information.',
    analyzeButton: 'Analyze',
    cancel: 'Cancel',
  },
  // ... 다른 언어들도 동일하게 추가 ...
};
```

---

## 🎨 UI/UX 고려사항

### 모달 디자인
- **스타일**: 프로젝트 디자인 톤앤매너 유지
- **색상**: Primary 색상 (#2ECC71) 사용
- **크기**: 모바일 친화적인 크기 (max-w-md)
- **애니메이션**: 부드러운 페이드 인/아웃

### 사용자 경험
- 모달 외부 클릭 시 닫기 가능 (선택사항)
- ESC 키로 닫기 가능
- 로딩 중에는 모달 닫기 방지
- 이미지 썸네일로 사용자가 확인 가능 (선택사항)

---

## 🧪 테스트 시나리오

1. **정상 플로우**
   - 스캔 → 촬영 → 미리보기 → 모달 표시 → 확인 → 분석 성공

2. **취소 플로우**
   - 스캔 → 촬영 → 미리보기 → 모달 표시 → 취소 → 미리보기로 돌아감

3. **다시 촬영 플로우**
   - 스캔 → 촬영 → 미리보기 → 다시 촬영 → 카메라 뷰로 돌아감

4. **에러 처리**
   - 분석 실패 시 에러 토스트 표시
   - 로딩 상태 해제
   - 사용자가 다시 시도 가능

---

## 📚 관련 파일 목록

### 현재 파일
- `apps/web/src/app/scan/page.tsx` - 메인 스캔 페이지
- `apps/web/src/features/scan/components/camera-view.tsx` - 카메라 화면 메인 컴포넌트 (이벤트 버블링 구현)
- `apps/web/src/features/scan/components/camera/camera-controls.tsx` - 카메라 컨트롤 (이벤트 버블링 적용)
- `apps/web/src/features/scan/components/image-preview.tsx` - 이미지 미리보기
- `apps/web/src/features/scan/components/camera/hooks/useCamera.ts` - 카메라 로직 훅
- `apps/web/src/app/api/scan/analyze/route.ts` - OCR/AI API 엔드포인트

### 신규 생성 필요
- `apps/web/src/features/scan/components/camera/analyze-confirm-dialog.tsx` - 확인 모달

### 수정 필요
- `apps/web/src/features/scan/components/camera-view.tsx` - 모달 상태 관리 추가
- `apps/web/src/lib/translations.ts` - 다국어 키 추가

---

## ✅ 완료 기준

### 이미 완료된 항목
- [x] 이벤트 버블링 구현 완료
  - [x] camera-controls.tsx에 data-action 속성 추가
  - [x] camera-view.tsx에 이벤트 버블링 핸들러 구현
  - [x] 촬영 버튼 클릭 정상 작동 확인

### 남은 작업
- [ ] 확인 모달 컴포넌트 생성 및 스타일링 완료
- [ ] camera-view.tsx에 모달 통합 완료
- [ ] 다국어 지원 완료 (5개 언어)
- [ ] 정상 플로우 테스트 완료
- [ ] 에러 처리 테스트 완료
- [ ] 모바일 반응형 확인 완료

---

---

## 🔄 이벤트 버블링 상세 설명

### 구현 목적
카메라 촬영 버튼의 클릭 이벤트를 이벤트 버블링 패턴으로 처리하여, 디자인 요소와 기능을 분리하고 유지보수성을 향상시킵니다.

### 작동 원리

1. **버튼 구조**:
   ```tsx
   <button data-action="capture">
     <div className="w-16 h-16 rounded-full ..." />
   </button>
   ```
   - 버튼에 `data-action="capture"` 속성 추가
   - 내부에 디자인 요소 (녹색 원) 포함
   - `onClick` 핸들러 제거 (이벤트 버블링으로 처리)

2. **이벤트 버블링**:
   ```
   버튼 클릭
     ↓
   이벤트 버블링 (자동)
     ↓
   최상위 div의 onClick 핸들러
     ↓
   handleCaptureAreaClick() 실행
     ↓
   closest('[data-action="capture"]') 확인
     ↓
   handleCapture() 실행
   ```

3. **핸들러 로직**:
   ```tsx
   const handleCaptureAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
     // 처리 중이면 무시
     if (isProcessing) return;
     
     // 클릭된 요소 확인
     const target = e.target as HTMLElement;
     
     // 촬영 버튼 또는 그 내부 요소인지 확인
     const captureButton = target.closest('[data-action="capture"]');
     
     if (captureButton) {
       e.preventDefault();
       e.stopPropagation();
       handleCapture(); // 사진 촬영 실행
     }
   }, [isProcessing, handleCapture]);
   ```

### 장점

1. **디자인과 기능 분리**
   - 버튼 내부의 디자인 요소를 클릭해도 정상 작동
   - 버튼 구조 변경 시에도 이벤트 처리 로직 수정 불필요

2. **유연성**
   - 버튼에 여러 요소가 있어도 하나의 핸들러로 처리
   - `closest()` 메서드로 버튼 영역 전체 인식

3. **일관성**
   - 프로젝트 전반에 이벤트 버블링 패턴 적용 가능
   - 코드 구조가 명확하고 예측 가능

### 주의사항

- `pointer-events-none`이 설정된 요소는 이벤트 버블링이 작동하지 않음
- 버튼 컨테이너는 `pointer-events-auto`로 설정되어 있어야 함
- `isProcessing` 상태 체크로 중복 클릭 방지

---

**작성일**: 2024년
**작성자**: AI Assistant
**버전**: 1.1 (이벤트 버블링 구현 반영)

