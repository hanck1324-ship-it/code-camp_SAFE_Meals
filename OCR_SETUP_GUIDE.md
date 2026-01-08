# 🔍 OCR 엔진 설정 가이드

이 프로젝트는 3가지 OCR 엔진과 5가지 전략을 지원합니다. 속도와 정확도를 고려하여 최적의 전략을 선택할 수 있습니다.

---

## ⚡ 빠른 시작 (권장)

**가장 빠른 설정 (1-2초 응답):**

```bash
# apps/web/.env.local
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
OCR_STRATEGY=race  # Google Vision vs Gemini 병렬 경쟁 (기본값)
```

**무료로 시작 (2-3초 응답):**

```bash
# apps/web/.env.local
OCR_STRATEGY=gemini-only  # API 키 불필요, 기존 GEMINI_API_KEY 사용
```

---

## 🏆 지원되는 OCR 전략

### 🥇 **Race 전략** (가장 추천! ⚡⚡⚡)

**방식:** Google Vision과 Gemini를 **동시에 실행**하여 먼저 완료되는 것 사용

**속도:** 1-2초 (가장 빠름)
**정확도:** 95%+
**비용:** Google Vision 키 있으면 사용, 없으면 Gemini만 사용

**설정:**
```bash
OCR_STRATEGY=race  # 기본값
GOOGLE_CLOUD_VISION_API_KEY=your_key  # 선택사항
```

**장점:**
- 병렬 실행으로 가장 빠른 결과 채택
- API 키 없이도 작동 (Gemini 폴백)
- **추천!**

---

## 🏆 지원되는 OCR 엔진

### 1. **Google Cloud Vision API** (가장 추천 ⭐⭐⭐⭐⭐)

**특징:**
- ⚡ 속도: 1-2초 (가장 빠름)
- 🎯 정확도: 95%+ (최상급)
- 🌏 한글 인식: 완벽 지원
- 📐 복잡한 레이아웃: 탁월한 처리

**가격:**
- 무료: 매월 첫 1,000회
- 유료: 1,000회당 약 $1.5 (약 2,000원)

**설정 방법:**

1. Google Cloud Console에서 프로젝트 생성
2. Vision API 활성화
3. API 키 발급
4. `.env.local`에 추가:

```bash
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
OCR_STRATEGY=google-vision
```

**언제 사용하나요?**
- 프로덕션 환경에서 사용자가 많을 때
- 빠른 응답 속도가 중요할 때
- 복잡한 메뉴판을 분석해야 할 때

---

### 2. **Tesseract.js** (무료 옵션 ⭐⭐⭐)

**특징:**
- 💰 가격: 완전 무료
- ⏱️ 속도: 5-10초 (느림)
- 🎯 정확도: 60-80% (중간)
- 🔧 추가 설치: 필요 없음 (JavaScript 라이브러리)

**설정 방법:**

`.env.local`에 추가:

```bash
OCR_STRATEGY=tesseract
```

**언제 사용하나요?**
- 개발 초기 단계
- 트래픽이 적을 때
- 비용을 절감하고 싶을 때

---

### 3. **Gemini Vision** (폴백 옵션 ⭐⭐⭐⭐)

**특징:**
- ⚡ 속도: 2-3초
- 🎯 정확도: 85-90%
- 💰 가격: Gemini API 무료 쿼터 사용
- 🔧 설정: 이미 GEMINI_API_KEY로 설정됨

**설정 방법:**

`.env.local`에 추가:

```bash
OCR_STRATEGY=gemini-only
```

**언제 사용하나요?**
- Google Cloud Vision을 사용할 수 없을 때
- Tesseract가 너무 느릴 때
- 중간 수준의 성능이 필요할 때

---

## 🚀 Hybrid 전략 (가장 추천!)

**설정:**

```bash
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here  # 선택사항
OCR_STRATEGY=hybrid  # 기본값
```

**작동 방식:**

1. **Google Vision API 키가 있는 경우:**
   - Google Vision 시도 (1-2초, 가장 정확)
   - 실패 시 → Tesseract 폴백
   - 여전히 실패 시 → Gemini 폴백

2. **Google Vision API 키가 없는 경우:**
   - Tesseract 시도 (5-10초, 무료)
   - 신뢰도 낮을 시 → Gemini 폴백

**장점:**
- 속도와 비용의 최적 균형
- API 키 없이도 작동 (무료로 시작 가능)
- API 키 추가 시 자동으로 성능 향상

---

## 📊 성능 비교표

| OCR 전략 | 속도 | 정확도 | 비용 | 추천도 |
|---------|------|--------|------|--------|
| **Race** ⚡ | 1-2초 | 95%+ | Google 키 있으면 사용 | ⭐⭐⭐⭐⭐ 최고! |
| **Google Vision** | 1-2초 | 95%+ | 1,000회 무료 | ⭐⭐⭐⭐⭐ |
| **Gemini Only** | 2-3초 | 85-90% | 무료 | ⭐⭐⭐⭐ |
| **Tesseract** | 5-10초 | 60-80% | 무료 | ⭐⭐ |
| **Hybrid** ❌ | 8-15초 | 95%+ | 무료 | ⭐ 느림! |

⚠️ **Hybrid는 순차 실행으로 느립니다. Race를 사용하세요!**

---

## 🛠️ 설정 예시

### 🥇 프로덕션 환경 (최고 성능, 추천)

```bash
# apps/web/.env.local
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
OCR_STRATEGY=race  # Google vs Gemini 병렬 경쟁, 1-2초
```

### 💰 무료로 시작 (API 키 없음)

```bash
# apps/web/.env.local
OCR_STRATEGY=gemini-only  # 2-3초, 완전 무료
```

### 🚀 스타트업 초기 (비용 절감 + 빠른 속도)

```bash
# apps/web/.env.local
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...  # 월 1,000회 무료
OCR_STRATEGY=race  # 키 있으면 사용, 없으면 Gemini 폴백
```

---

## 📝 Google Cloud Vision API 키 발급 방법

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 생성**
   - "새 프로젝트" 클릭
   - 프로젝트 이름 입력

3. **Vision API 활성화**
   - 좌측 메뉴 > "API 및 서비스" > "라이브러리"
   - "Cloud Vision API" 검색
   - "사용 설정" 클릭

4. **API 키 생성**
   - 좌측 메뉴 > "API 및 서비스" > "사용자 인증 정보"
   - "사용자 인증 정보 만들기" > "API 키"
   - API 키 복사

5. **환경 변수에 추가**
   ```bash
   GOOGLE_CLOUD_VISION_API_KEY=your_copied_api_key
   ```

---

## 🐛 문제 해결

### OCR이 너무 느려요 (23초+)

**원인:** Tesseract를 사용 중일 가능성이 높습니다.

**해결책:**
1. Google Cloud Vision API 키 발급 후 설정
2. 또는 `OCR_STRATEGY=gemini-only`로 변경

### 텍스트 인식이 부정확해요

**해결책:**
1. `OCR_STRATEGY=google-vision` 사용
2. 이미지 품질 확인 (너무 작거나 흐릿하지 않은지)
3. 조명이 좋은 환경에서 촬영

### Google Vision API 할당량 초과

**해결책:**
1. `OCR_STRATEGY=hybrid`로 변경 (무료 폴백 활용)
2. 캐싱 기능 활성화됨 (동일 이미지 재사용)

---

## 💡 추천 설정

**개발 초기 (0-100명 사용자):**
```bash
OCR_STRATEGY=gemini-only  # 2-3초, 완전 무료
# 또는
OCR_STRATEGY=race  # 기본값, Gemini 폴백
```

**성장 단계 (100-1,000명 사용자):**
```bash
GOOGLE_CLOUD_VISION_API_KEY=your_key
OCR_STRATEGY=race  # 병렬 경쟁, 1-2초
# 무료 쿼터 활용 + Gemini 폴백
```

**프로덕션 (1,000명+ 사용자):**
```bash
GOOGLE_CLOUD_VISION_API_KEY=your_key
OCR_STRATEGY=race  # 또는 google-vision
# 빠른 속도와 높은 정확도 보장
```

---

## 📞 지원

문제가 있나요? 이슈를 생성하거나 팀에 문의하세요!
