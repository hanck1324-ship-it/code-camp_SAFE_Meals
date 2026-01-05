# 재료 및 알레르기 필터링 시스템 문서

## 📋 목차
1. [개요](#개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [설치 방법](#설치-방법)
4. [사용 방법](#사용-방법)
5. [API 통합](#api-통합)
6. [데이터 임포트](#데이터-임포트)
7. [문제 해결](#문제-해결)

---

## 개요

### 목적
메뉴 스캔 시 Gemini AI 분석 결과를 **재료 데이터베이스와 대조**하여 알레르기 검증의 정확도를 높이는 시스템입니다.

### 주요 기능
- ✅ **이중 검증 시스템**: AI 분석 + DB 검증
- ✅ **재료명 표준화**: 한식진흥원 API 데이터 기반 (2,033개)
- ✅ **알레르기 매핑**: 재료명 → 알레르기 코드 자동 매칭
- ✅ **위험도 자동 조정**: DB 검증 결과로 안전 등급 상향

### 아키텍처

```
메뉴 이미지 스캔
    ↓
Gemini AI 분석 (1차)
    ↓
재료명 추출 ["꽃게", "무", "대파", ...]
    ↓
재료 DB 검증 (2차)
    ↓
allergen_mappings 테이블 조회
    "꽃게" → "shellfish"
    ↓
사용자 알레르기와 매칭
    user_allergies = ["shellfish"]
    ↓
위험도 판정 및 상향 조정
    SAFE → CAUTION (DB에서 발견)
    CAUTION → DANGER (DB에서 확인)
    ↓
최종 결과 반환
```

---

## 데이터베이스 스키마

### 1. `ingredients` 테이블
한식진흥원 API에서 가져온 레시피 재료 정보를 저장합니다.

```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 한식진흥원 API 데이터
  recipe_id INTEGER,              -- 레시피ID
  name TEXT NOT NULL,              -- 재료명 (예: "소함박살", "고추장")
  category INTEGER,                -- 재료 분류 (1: 주재료, 2: 부재료 등)
  amount TEXT,                     -- 재료량 (예: "300g", "1큰술")

  -- 알레르기 매핑 정보
  allergen_keywords TEXT[],        -- 알레르기 유발 키워드 배열
  is_allergen BOOLEAN DEFAULT FALSE,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 제약 조건
  UNIQUE(recipe_id, name)          -- 중복 방지
);
```

**인덱스**:
```sql
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_is_allergen ON ingredients(is_allergen);
CREATE INDEX idx_ingredients_allergen_keywords ON ingredients USING GIN(allergen_keywords);
```

**예시 데이터**:
```sql
INSERT INTO ingredients (recipe_id, name, category, amount)
VALUES
  (855, '소함박살', 1, '300g'),
  (855, '양파', 2, '100g'),
  (856, '꽃게', 1, '2마리');
```

---

### 2. `allergen_mappings` 테이블
재료 키워드를 알레르기 코드로 매핑하는 룩업 테이블입니다.

```sql
CREATE TABLE allergen_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ingredient_keyword TEXT NOT NULL UNIQUE,  -- 재료 키워드 (예: "우유", "땅콩", "꽃게")
  allergen_type TEXT NOT NULL,              -- 알레르기 코드 (예: "milk", "peanuts", "shellfish")

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**인덱스**:
```sql
CREATE INDEX idx_allergen_mappings_keyword ON allergen_mappings(ingredient_keyword);
CREATE INDEX idx_allergen_mappings_type ON allergen_mappings(allergen_type);
```

**기본 데이터 (40+ 항목)**:
```sql
INSERT INTO allergen_mappings (ingredient_keyword, allergen_type) VALUES
  -- 우유/유제품
  ('우유', 'milk'),
  ('치즈', 'milk'),
  ('버터', 'milk'),
  ('생크림', 'milk'),

  -- 계란
  ('계란', 'eggs'),
  ('달걀', 'eggs'),

  -- 갑각류
  ('새우', 'shellfish'),
  ('게', 'shellfish'),
  ('꽃게', 'shellfish'),
  ('랍스터', 'shellfish'),

  -- 생선
  ('고등어', 'fish'),
  ('연어', 'fish'),

  -- 콩
  ('대두', 'soy'),
  ('된장', 'soy'),
  ('간장', 'soy'),
  ('두부', 'soy'),

  -- 밀
  ('밀가루', 'wheat'),
  ('빵', 'wheat'),
  ('면', 'wheat'),

  -- 땅콩/견과류
  ('땅콩', 'peanuts'),
  ('호두', 'treeNuts'),
  ('아몬드', 'treeNuts'),
  ('잣', 'treeNuts');
```

---

### 3. `check_ingredient_allergens()` 함수
재료명과 사용자 알레르기를 비교하여 위험도를 판단하는 PostgreSQL 함수입니다.

```sql
CREATE OR REPLACE FUNCTION check_ingredient_allergens(
  ingredient_name TEXT,          -- 검사할 재료명
  user_allergens TEXT[]          -- 사용자 알레르기 배열
)
RETURNS TABLE(
  is_dangerous BOOLEAN,          -- 위험 여부
  matched_allergens TEXT[]       -- 매칭된 알레르기 배열
) AS $$
DECLARE
  matched TEXT[];
BEGIN
  -- 재료명에 포함된 알레르기 키워드 찾기
  SELECT ARRAY_AGG(DISTINCT am.allergen_type)
  INTO matched
  FROM allergen_mappings am
  WHERE
    ingredient_name ILIKE '%' || am.ingredient_keyword || '%'
    AND am.allergen_type = ANY(user_allergens);

  -- 결과 반환
  RETURN QUERY SELECT
    (matched IS NOT NULL AND array_length(matched, 1) > 0) AS is_dangerous,
    COALESCE(matched, ARRAY[]::TEXT[]) AS matched_allergens;
END;
$$ LANGUAGE plpgsql;
```

**사용 예시**:
```sql
-- "꽃게탕" 재료를 사용자 알레르기 ['shellfish']와 비교
SELECT * FROM check_ingredient_allergens('꽃게탕', ARRAY['shellfish']);

-- 결과:
-- is_dangerous | matched_allergens
-- true         | {shellfish}
```

---

## 설치 방법

### 1단계: Supabase SQL Editor 열기
1. Supabase Dashboard 접속 (https://supabase.com/dashboard)
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2단계: 스키마 실행
1. `docs/database/ingredients-schema.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭

### 3단계: 실행 확인
```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ingredients', 'allergen_mappings');

-- 함수 생성 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_ingredient_allergens';

-- 기본 데이터 확인
SELECT COUNT(*) FROM allergen_mappings;
-- 예상 결과: 40+ rows
```

### 4단계: RLS (Row Level Security) 확인
```sql
-- RLS 정책 확인
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('ingredients', 'allergen_mappings');
```

---

## 사용 방법

### API에서 사용 (서버 사이드)

**위치**: `apps/web/src/app/api/scan/analyze/route.ts`

```typescript
// 1. 사용자 알레르기 조회
const { data: allergiesData } = await supabase
  .from('user_allergies')
  .select('allergy_code')
  .eq('user_id', user.id);

const userAllergies = allergiesData?.map(a => a.allergy_code) || [];
// 예: ['shellfish', 'milk']

// 2. Gemini AI로 재료 추출
const analysisData = await gemini.analyze(image);
const ingredients = analysisData.results[0].ingredients;
// 예: ['꽃게', '무', '대파', '고추장']

// 3. 각 재료를 DB와 대조
const dbAllergenChecks = await Promise.all(
  ingredients.map(async (ingredient) => {
    const { data, error } = await supabase
      .rpc('check_ingredient_allergens', {
        ingredient_name: ingredient,
        user_allergens: userAllergies,
      });

    return {
      ingredient,
      is_dangerous: data?.[0]?.is_dangerous || false,
      matched_allergens: data?.[0]?.matched_allergens || [],
    };
  })
);

// 4. DB에서 발견된 알레르기 수집
const dbMatchedAllergens = dbAllergenChecks
  .filter(check => check.is_dangerous)
  .flatMap(check => check.matched_allergens);

// 예: ['shellfish'] (꽃게에서 발견)

// 5. 위험도 상향 조정
if (dbMatchedAllergens.length > 0) {
  if (menuItem.safety_status === 'SAFE') {
    updatedSafetyStatus = 'CAUTION';
  } else if (menuItem.safety_status === 'CAUTION') {
    updatedSafetyStatus = 'DANGER';
  }
}
```

### 직접 SQL 쿼리

```sql
-- 재료 검색
SELECT * FROM ingredients WHERE name ILIKE '%꽃게%';

-- 알레르기 매핑 확인
SELECT * FROM allergen_mappings WHERE allergen_type = 'shellfish';

-- 재료 검증
SELECT * FROM check_ingredient_allergens('꽃게탕', ARRAY['shellfish']);
```

---

## API 통합

### 메뉴 스캔 API 응답 구조

**Before (AI만 사용)**:
```json
{
  "success": true,
  "overall_status": "CAUTION",
  "results": [
    {
      "safety_status": "CAUTION",
      "reason": "꽃게가 포함될 수 있습니다"
    }
  ]
}
```

**After (AI + DB 이중 검증)**:
```json
{
  "success": true,
  "overall_status": "DANGER",
  "results": [
    {
      "safety_status": "DANGER",
      "reason": "꽃게 확인됨 (DB 검증)",
      "allergy_risk": {
        "status": "DANGER",
        "matched_allergens": ["shellfish"]
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

### 위험도 자동 조정 규칙

| AI 판정 | DB 검증 결과 | 최종 판정 | 이유 |
|---------|-------------|-----------|------|
| SAFE | 알레르기 발견 | **CAUTION** | DB에서 위험 재료 발견 |
| CAUTION | 알레르기 확인 | **DANGER** | DB에서 확실한 매칭 |
| DANGER | 알레르기 확인 | **DANGER** | 유지 (이미 최고 위험도) |
| SAFE | 알레르기 없음 | SAFE | 유지 |

---

## 데이터 임포트

### 한식진흥원 API 데이터 임포트

**1단계: 임포트 스크립트 작성**

파일: `apps/web/scripts/import-ingredients.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { getKoreanFoodIngredients } from '@/lib/public-data-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key 사용
);

async function importIngredients() {
  console.log('🚀 한식진흥원 재료 데이터 임포트 시작...');

  const totalPages = Math.ceil(2033 / 1000); // 총 3페이지
  let totalImported = 0;

  for (let page = 1; page <= totalPages; page++) {
    console.log(`\n📄 페이지 ${page}/${totalPages} 처리 중...`);

    // 한식진흥원 API 호출
    const result = await getKoreanFoodIngredients({
      page,
      perPage: 1000,
    });

    console.log(`   조회: ${result.currentCount}개`);

    // Supabase에 삽입
    const { data, error } = await supabase
      .from('ingredients')
      .upsert(
        result.data.map(item => ({
          recipe_id: item.레시피ID,
          name: item.명칭,
          category: item.분류,
          amount: item.내용,
        })),
        { onConflict: 'recipe_id,name' } // 중복 시 업데이트
      );

    if (error) {
      console.error(`❌ 페이지 ${page} 임포트 실패:`, error);
    } else {
      totalImported += result.currentCount;
      console.log(`✅ 페이지 ${page} 완료 (누적: ${totalImported}개)`);
    }

    // API 제한 방지
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 전체 임포트 완료! 총 ${totalImported}개 재료`);
}

importIngredients();
```

**2단계: package.json 스크립트 추가**

```json
{
  "scripts": {
    "import:ingredients": "tsx apps/web/scripts/import-ingredients.ts"
  }
}
```

**3단계: 실행**

```bash
# Service Role Key 설정 (.env.local)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 임포트 실행
pnpm --filter @safemeals/web import:ingredients
```

**예상 출력**:
```
🚀 한식진흥원 재료 데이터 임포트 시작...

📄 페이지 1/3 처리 중...
   조회: 1000개
✅ 페이지 1 완료 (누적: 1000개)

📄 페이지 2/3 처리 중...
   조회: 1000개
✅ 페이지 2 완료 (누적: 2000개)

📄 페이지 3/3 처리 중...
   조회: 33개
✅ 페이지 3 완료 (누적: 2033개)

🎉 전체 임포트 완료! 총 2033개 재료
```

---

## 문제 해결

### 1. 함수가 실행되지 않음

**증상**:
```
Error: function check_ingredient_allergens does not exist
```

**해결**:
```sql
-- 함수 존재 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'check_ingredient_allergens';

-- 없으면 다시 생성
-- ingredients-schema.sql의 함수 부분 재실행
```

### 2. RLS 정책으로 인한 접근 거부

**증상**:
```
Error: new row violates row-level security policy
```

**해결**:
```sql
-- Service Role Key 사용 (API에서)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role 사용
);

-- 또는 RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'ingredients';
```

### 3. 알레르기 매핑이 작동하지 않음

**증상**:
```typescript
// DB 검증 결과가 항상 is_dangerous: false
```

**해결**:
```sql
-- allergen_mappings 데이터 확인
SELECT * FROM allergen_mappings;

-- 데이터가 없으면 다시 삽입
-- ingredients-schema.sql의 INSERT 부분 재실행

-- 특정 재료 테스트
SELECT * FROM check_ingredient_allergens('꽃게', ARRAY['shellfish']);
-- 예상: is_dangerous = true
```

### 4. 성능 이슈

**증상**: 재료가 많을 때 DB 검증이 느림

**해결**:
```sql
-- 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'allergen_mappings';

-- GIN 인덱스 재생성 (필요시)
REINDEX INDEX idx_allergen_mappings_keyword;

-- 쿼리 성능 분석
EXPLAIN ANALYZE
SELECT * FROM check_ingredient_allergens('꽃게', ARRAY['shellfish']);
```

---

## 참고 자료

### 관련 파일
- **스키마**: `docs/database/ingredients-schema.sql`
- **API 통합**: `apps/web/src/app/api/scan/analyze/route.ts`
- **공공데이터 API**: `apps/web/src/lib/public-data-api.ts`
- **테스트 시나리오**: `TEST_SCENARIO.md`

### 외부 링크
- [한식진흥원 API 문서](https://www.data.go.kr/data/15136610/openapi.do)
- [Supabase RPC 문서](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL GIN 인덱스](https://www.postgresql.org/docs/current/gin.html)

---

## 버전 이력

### v1.0.0 (2026-01-03)
- ✅ 초기 스키마 생성
- ✅ `ingredients` 테이블
- ✅ `allergen_mappings` 테이블
- ✅ `check_ingredient_allergens()` 함수
- ✅ 40+ 기본 알레르기 매핑 데이터
- ✅ API 이중 검증 시스템 구현

---

**작성자**: SafeMeals 개발팀
**최종 수정**: 2026-01-03
