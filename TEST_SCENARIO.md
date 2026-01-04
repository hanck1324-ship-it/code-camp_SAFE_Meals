# 메뉴 스캔 테스트 시나리오: 꽃게탕

## 테스트 조건
- **사용자 알레르기**: 갑각류 (shellfish)
- **스캔 메뉴**: 꽃게탕 (Spicy Blue Crab Stew)

---

## 처리 흐름

### 1단계: 사용자 정보 조회
```sql
-- Supabase에서 사용자 알레르기 조회
SELECT allergy_code FROM user_allergies WHERE user_id = 'USER_ID';
-- 결과: ['shellfish']
```

### 2단계: Gemini AI 분석
**프롬프트에 전달되는 정보**:
```
User Context:
- Allergies: Shellfish (갑각류/조개류)
- Diet Type: None
- Target Language: ko
```

**Gemini AI 응답 (예상)**:
```json
{
  "overall_status": "DANGER",
  "results": [
    {
      "id": "1",
      "original_name": "꽃게탕",
      "translated_name": "Spicy Blue Crab Stew",
      "description": "꽃게를 주재료로 한 매운 탕 요리",
      "safety_status": "DANGER",
      "reason": "꽃게가 포함되어 있습니다 (갑각류 알레르기)",
      "ingredients": ["꽃게", "무", "대파", "고추장", "고춧가루", "마늘", "된장"],
      "allergy_risk": {
        "status": "DANGER",
        "matched_allergens": ["shellfish"]
      },
      "diet_risk": {
        "status": "SAFE",
        "violations": []
      }
    }
  ]
}
```

### 3단계: DB 검증 강화
```typescript
// 재료: ["꽃게", "무", "대파", "고추장", ...]
// 각 재료를 DB와 대조

// "꽃게" 검증
SELECT * FROM check_ingredient_allergens('꽃게', ARRAY['shellfish']);
// 결과:
{
  is_dangerous: true,
  matched_allergens: ['shellfish']
}

// allergen_mappings 테이블에서 매칭
// '꽃게' -> 'shellfish' (갑각류)
```

**DB 검증 후 결과**:
```json
{
  "safety_status": "DANGER", // 유지 (이미 DANGER)
  "reason": "꽃게가 포함되어 있습니다 (갑각류 알레르기)",
  "db_verification": {
    "checked": true,
    "db_matched_allergens": ["shellfish"],
    "total_allergen_matches": 1
  }
}
```

### 4단계: 최종 응답
```json
{
  "success": true,
  "analyzed_at": "2026-01-03T11:00:00.000Z",
  "user_context": {
    "allergies": ["shellfish"],
    "diet": "None"
  },
  "overall_status": "DANGER",
  "results": [
    {
      "id": "1",
      "original_name": "꽃게탕",
      "translated_name": "Spicy Blue Crab Stew",
      "description": "꽃게를 주재료로 한 매운 탕 요리",
      "safety_status": "DANGER",
      "reason": "꽃게가 포함되어 있습니다 (갑각류 알레르기)",
      "ingredients": ["꽃게", "무", "대파", "고추장", "고춧가루", "마늘", "된장"],
      "allergy_risk": {
        "status": "DANGER",
        "matched_allergens": ["shellfish"]
      },
      "diet_risk": {
        "status": "SAFE",
        "violations": []
      },
      "db_verification": {
        "checked": true,
        "db_matched_allergens": ["shellfish"],
        "total_allergen_matches": 1
      }
    }
  ],
  "db_enhanced": true
}
```

---

## UI 표시 (모바일/웹 앱)

### 스캔 결과 화면

```
┌─────────────────────────────────────┐
│  🔴 위험 (DANGER)                    │
│                                     │
│  알레르기 물질이 포함된 메뉴가      │
│  있습니다!                          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔴 꽃게탕                            │
│    Spicy Blue Crab Stew            │
│                                     │
│ ⚠️  위험: 갑각류 알레르기           │
│                                     │
│ 이유:                               │
│ 꽃게가 포함되어 있습니다            │
│ (갑각류 알레르기)                   │
│                                     │
│ 재료:                               │
│ • 꽃게 🔴 (알레르기 물질)           │
│ • 무                                │
│ • 대파                              │
│ • 고추장                            │
│ • 고춧가루                          │
│ • 마늘                              │
│ • 된장                              │
│                                     │
│ ✓ DB 검증 완료                      │
│   (알레르기 매칭: 갑각류)           │
└─────────────────────────────────────┘

[ 다른 메뉴 찾기 ]  [ Safety Card 보기 ]
```

### SafetyBadge 컴포넌트
```tsx
<SafetyBadge
  level="danger"     // 빨간색 배경
  text="위험"
  icon={XCircle}     // X 아이콘
/>
```

### 알림 메시지
```
🚨 경고!

이 메뉴에는 귀하의 알레르기 물질인
'갑각류'가 포함되어 있습니다.

절대 섭취하지 마세요!
```

---

## 콘솔 로그 (서버)

```
👤 사용자 ID: abc123...
🚨 알레르기 목록: shellfish
🍽️ 식단 목록:
📋 dietType: None

📸 이미지 수신: data:image/jpeg;base64,/9j/... (1234567 bytes)

🤖 Gemini API 호출 시작...
✅ Gemini API 응답 완료 (2.34초)

🔍 재료 DB로 알레르기 검증 시작...
  ✓ 꽃게탕: DANGER → DANGER

✅ DB 검증 완료 - 최종 상태: DANGER
```

---

## 안전성 보장

### AI + DB 이중 검증
1. ✅ Gemini AI: "꽃게" 감지 → DANGER
2. ✅ DB 검증: allergen_mappings에서 "꽃게" → "shellfish" 확인
3. ✅ 최종 판정: DANGER (위험)

### 보수적 접근
- 의심스러우면 → CAUTION
- 확실하면 → DANGER
- **절대 안전하지 않은 것을 SAFE로 표시하지 않음**

---

## 실제 테스트 방법

1. **Supabase에서 알레르기 설정**
```sql
INSERT INTO user_allergies (user_id, allergy_code)
VALUES ('YOUR_USER_ID', 'shellfish');
```

2. **메뉴 이미지 준비**
   - 꽃게탕 사진 촬영
   - 또는 테스트 이미지 사용

3. **앱에서 스캔**
   - 모바일/웹 앱에서 메뉴 스캔
   - 카메라로 촬영 또는 갤러리에서 선택

4. **결과 확인**
   - 🔴 DANGER 배지 표시 확인
   - 알레르기 경고 메시지 확인
   - DB 검증 완료 표시 확인
