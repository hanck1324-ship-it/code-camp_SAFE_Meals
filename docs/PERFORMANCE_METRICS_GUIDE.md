# 성능 계측 가이드 (Performance Metrics Guide)

## 개요

메뉴→알레르기 위험도 흐름의 병목 계측을 위한 시스템입니다.
총 30–40초 지연을 구간별로 분리해 기록하고, 네트워크/파싱/매핑/렌더 중 어디가 병목인지 수치로 확인할 수 있습니다.

## 구간 정의

### 기본 구간

| 구간 | 설명 |
|------|------|
| `network` | 전체 네트워크 시간 (요청 시작 → 응답 수신 완료) |
| `parsing` | 응답 수신 → JSON 파싱 완료 |
| `mapping` | 파싱 완료 → 알레르기 매핑 완료 |
| `rendering` | 매핑 완료 → UI 표시 완료 |
| `total` | 전체 소요 시간 |

### 네트워크 세분화 구간 (v2)

| 구간 | 설명 |
|------|------|
| `upload` | 요청 바디(이미지) 업로드 완료까지 |
| `ttfb` | Time To First Byte - 서버가 응답 시작까지 (서버 처리 시간) |
| `download` | 응답 다운로드 + 파싱 시간 |

### Server-Timing 지원

서버에서 `Server-Timing` 헤더를 보내면 자동으로 파싱됩니다:
```
Server-Timing: ocr;dur=8000, llm;dur=12000;desc=GPT-4, post;dur=500
```

---

## 🖥️ 웹 브라우저에서 테스트

### 1. 개발 모드에서 자동 계측

메뉴 스캔 및 분석 시 자동으로 계측이 수행됩니다.
개발 모드에서 콘솔에 실시간 로그가 출력됩니다.

```
[Metrics:req_xxx_yyy] upload 시작 | 경과: 0.00ms
[Metrics:req_xxx_yyy] upload 완료 | 소요: 1234.56ms
[Metrics:req_xxx_yyy] download 시작 | 경과: 1234.56ms
[Metrics:req_xxx_yyy] download 완료 | 소요: 25000.00ms
...
```

### 2. 콘솔에서 통계 확인

브라우저 개발자 도구 콘솔에서 다음 명령어를 사용합니다:

```javascript
// 통계 출력
window.__devMetrics.printStats()

// 병목 분석
window.__devMetrics.analyzeBottleneck()

// 모든 측정값 조회
window.__devMetrics.getAll()

// 최근 5개 측정값
window.__devMetrics.recent(5)

// CSV 내보내기
window.__devMetrics.exportCSV()

// 측정값 초기화
window.__devMetrics.clear()

// 특정 요청 ID로 조회
window.__devMetrics.find('req_xxx_yyy')

// 측정 횟수
window.__devMetrics.count()
```

---

## 📱 모바일(React Native)에서 테스트

### 방법 1: Metro Bundler 콘솔에서 확인

앱이 WebView 기반이므로 WebView 내 계측 로그가 자동으로 React Native 콘솔로 전달됩니다.
(중복 로그 방지 적용됨)

1. **개발 서버 실행**
   ```bash
   # 터미널 1: 웹 서버
   cd apps/web && npm run dev
   
   # 터미널 2: Expo 서버
   cd apps/mobile && npx expo start --dev-client
   ```

2. **앱에서 메뉴 스캔 수행**
   - 메뉴 스캔 탭에서 이미지 선택 후 분석

3. **Metro 콘솔 확인**
   Metro bundler 터미널에 다음과 같은 로그가 출력됩니다:
   ```
   [WebView] [Metrics:req_xxx] upload 시작 | 경과: 0.00ms
   [WebView] [Metrics:req_xxx] upload 완료 | 소요: 2345.67ms
   [WebView] [Metrics:req_xxx] download 시작 | 경과: 2345.67ms
   [WebView] [Metrics:req_xxx] download 완료 | 소요: 24000.00ms
   ...
   
   📊 [Performance Metrics from WebView]
   Request ID: req_xxx
   Upload: 2345.67 ms        ← 이미지 업로드
   Download: 24000.00 ms     ← 서버 처리 + 응답 다운로드
   Network Total: 26345.67 ms
   Mapping: 50.23 ms
   Rendering: 156.78 ms
   Total: 26552.68 ms
   Request Size: 1234567 bytes (이미지 크기)
   Response Size: 12345 bytes
   ```

### 방법 2: Flipper 사용

1. **Flipper 설치 및 실행**
   - [Flipper 다운로드](https://fbflipper.com/)

2. **앱 연결**
   - 개발 모드 앱 실행
   - Flipper에서 디바이스/에뮬레이터 연결

3. **Logs 플러그인에서 확인**
   - React Native Logs 탭에서 `[Metrics:` 검색

### 방법 3: React Native Debugger

1. **앱에서 디버거 열기**
   - 디바이스 흔들기 → "Debug JS Remotely" 선택
   - 또는 Dev Menu → "Open Debugger"

2. **Chrome DevTools Console에서 확인**
   - `[WebView]` 접두사로 시작하는 로그 확인

### 방법 4: Safari Web Inspector (iOS 시뮬레이터)

1. **Safari 설정**
   - Safari → 환경설정 → 고급 → "메뉴 막대에서 개발자용 메뉴 보기" 체크

2. **Web Inspector 연결**
   - 개발자 메뉴 → Simulator → WebView 선택

3. **콘솔에서 계측 로그 확인**
   ```javascript
   // WebView 내에서 직접 명령 실행 가능
   window.__devMetrics.printStats()
   window.__devMetrics.analyzeBottleneck()
   ```

### 방법 5: Chrome DevTools (Android 에뮬레이터)

1. **Chrome에서 `chrome://inspect` 접속**

2. **Remote Target에서 WebView 선택**

3. **Console 탭에서 계측 확인**

---

## 측정 절차

1. **동일 시나리오 3회 이상 반복**
   - 일관된 조건에서 메뉴 스캔 수행
   - 네트워크 조건 동일하게 유지

2. **통계 확인**
   ```javascript
   window.__devMetrics.printStats()
   ```

3. **병목 분석**
   ```javascript
   window.__devMetrics.analyzeBottleneck()
   ```

4. **결과 표 정리**
   ```javascript
   // CSV로 내보내기
   const csv = window.__devMetrics.exportCSV()
   ```

## 네트워크 조건 테스트

### Wi-Fi 환경
일반적인 Wi-Fi 환경에서 측정

### 느린 네트워크 시뮬레이션
Chrome DevTools > Network 탭에서:
- "Slow 3G" 선택
- 또는 Charles/Proxyman으로 throttle 설정

### 오프라인 캐시 테스트
- 첫 요청 후 네트워크 끊기
- 캐시된 응답으로 측정

## 병목별 최적화 권장사항

### 네트워크 병목 (network가 가장 큰 경우)
- 응답 크기 축소 (이미지 압축, 페이지네이션)
- CDN 활용
- HTTP/2 또는 HTTP/3 적용
- 응답 압축 (gzip/brotli) 확인

### 파싱 병목 (parsing이 가장 큰 경우)
- JSON 구조 단순화
- 불필요한 필드 제거
- 스트리밍 파서 고려

### 매핑 병목 (mapping이 가장 큰 경우)
- 알레르기 매핑 로직 최적화
- 사전 계산된 매핑 테이블 사용
- Web Worker 활용 검토

### 렌더링 병목 (rendering이 가장 큰 경우)
- FlatList/가상화 리스트 사용
- React.memo로 불필요한 리렌더 방지
- 이미지 lazy loading 적용
- 스켈레톤 UI 활용

## 추가 도구

### Flipper (React Native)
- Performance 플러그인으로 JS 프레임 드롭 확인
- 렌더 트리 재조정 확인
- CPU/GPU 차트 모니터링

### React DevTools Profiler
- 리스트/카테고리 컴포넌트 렌더 비용 측정
- 불필요한 리렌더 식별

### Chrome DevTools
- Network 탭: 응답 크기, 시간, 압축 여부
- Performance 탭: 렌더링 성능, JS 실행 시간

## 파일 위치

- Web 계측 유틸리티: `apps/web/src/utils/performance-metrics.ts`
- 개발자 도구: `apps/web/src/utils/performance-dev-tools.ts`
- 훅 통합: `apps/web/src/features/scan/components/menu-scan/hooks/useAnalyzeSubmit.hook.ts`
- 공통 유틸리티: `packages/shared/src/utils/performance-metrics.ts`

## 출력 예시

### printStats() 출력

```
========================================
📈 Performance Statistics (n=5)
========================================
┌─────────────┬────────────┬──────────┬────────────┬────────────┐
│   (index)   │ 평균 (ms)  │   분산   │ 최소 (ms)  │ 최대 (ms)  │
├─────────────┼────────────┼──────────┼────────────┼────────────┤
│   network   │ '15234.56' │ '456.78' │ '14500.00' │ '16000.00' │
│   parsing   │   '45.23'  │  '12.34' │   '40.00'  │   '52.00'  │
│   mapping   │  '234.56'  │  '34.56' │  '200.00'  │  '280.00'  │
│  rendering  │  '156.78'  │  '23.45' │  '140.00'  │  '180.00'  │
│    total    │ '15671.13' │ '489.12' │ '14880.00' │ '16512.00' │
└─────────────┴────────────┴──────────┴────────────┴────────────┘

🔍 병목 구간: network (평균 15234.56ms)
========================================
```

### analyzeBottleneck() 출력

```
========================================
🔍 병목 분석 결과
========================================
┌───────────┬────────────┬──────────┬──────────┐
│   구간    │ 평균 (ms)  │ 비율 (%) │   상태   │
├───────────┼────────────┼──────────┼──────────┤
│  network  │ '15234.56' │  '97.2'  │ 🔴 병목  │
│  mapping  │  '234.56'  │   '1.5'  │ 🟢 양호  │
│ rendering │  '156.78'  │   '1.0'  │ 🟢 양호  │
│  parsing  │   '45.23'  │   '0.3'  │ 🟢 양호  │
└───────────┴────────────┴──────────┴──────────┘

📌 주요 병목 구간: network
   - 평균 소요 시간: 15234.56ms
   - 전체 대비 비율: 97.2%

💡 권장사항:
   - 응답 크기 축소 (이미지 압축, 페이지네이션)
   - CDN 활용
   - HTTP/2 또는 HTTP/3 적용
   - 응답 압축 (gzip/brotli) 확인
========================================
```
