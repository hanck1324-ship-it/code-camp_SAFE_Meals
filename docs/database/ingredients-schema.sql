-- ============================================
-- 재료 및 알레르기 필터링 시스템 스키마
-- ============================================

-- gen_random_uuid 사용을 위한 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ingredients 테이블 (한식진흥원 API 데이터)
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 한식진흥원 API 데이터
  recipe_id INTEGER,              -- 레시피ID
  name TEXT NOT NULL,              -- 재료명 (명칭)
  category INTEGER,                -- 재료 분류
  amount TEXT,                     -- 재료량 (내용)

  -- 알레르기 매핑 정보
  allergen_keywords TEXT[],        -- 알레르기 유발 키워드 배열
  is_allergen BOOLEAN DEFAULT FALSE, -- 알레르기 유발 재료 여부

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 중복 방지: 같은 레시피의 같은 재료는 하나만
  UNIQUE(recipe_id, name)
);

-- ingredients 테이블 인덱스 (컬럼 존재 시에만 생성)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'recipe_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'is_allergen'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ingredients_is_allergen ON ingredients(is_allergen);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ingredients' AND column_name = 'allergen_keywords'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ingredients_allergen_keywords ON ingredients USING GIN(allergen_keywords);
  END IF;
END $$;

-- 2. allergen_mappings 테이블 (재료명 → 알레르기 매핑)
CREATE TABLE IF NOT EXISTS allergen_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 재료 정보
  ingredient_keyword TEXT NOT NULL UNIQUE, -- 재료 키워드 (예: "우유", "땅콩")

  -- 알레르기 타입 (영어 - Safety Card와 매칭)
  allergen_type TEXT NOT NULL,     -- 예: "milk", "peanuts", "shellfish"

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- allergen_mappings 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_allergen_mappings_keyword ON allergen_mappings(ingredient_keyword);
CREATE INDEX IF NOT EXISTS idx_allergen_mappings_type ON allergen_mappings(allergen_type);

-- 3. RLS (Row Level Security) 정책
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergen_mappings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "Anyone can view ingredients" ON ingredients;
CREATE POLICY "Anyone can view ingredients" ON ingredients
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can view allergen mappings" ON allergen_mappings;
CREATE POLICY "Anyone can view allergen mappings" ON allergen_mappings
  FOR SELECT
  USING (true);

-- Service role만 삽입/수정 가능
DROP POLICY IF EXISTS "Service role can manage ingredients" ON ingredients;
CREATE POLICY "Service role can manage ingredients" ON ingredients
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage allergen mappings" ON allergen_mappings;
CREATE POLICY "Service role can manage allergen mappings" ON allergen_mappings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_allergen_mappings_updated_at ON allergen_mappings;
CREATE TRIGGER update_allergen_mappings_updated_at
  BEFORE UPDATE ON allergen_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 기본 알레르기 매핑 데이터 삽입
-- allergen_type 값은 docs/schema.md의 allergy_types 코드와 일치시킴
INSERT INTO allergen_mappings (ingredient_keyword, allergen_type) VALUES
  -- 우유/유제품
  ('우유', 'milk'),
  ('치즈', 'milk'),
  ('버터', 'milk'),
  ('생크림', 'milk'),
  ('요거트', 'milk'),
  ('유청', 'milk'),

  -- 계란
  ('계란', 'eggs'),
  ('달걀', 'eggs'),
  ('난백', 'eggs'),
  ('난황', 'eggs'),

  -- 땅콩/견과류
  ('땅콩', 'peanuts'),
  ('호두', 'walnuts'),
  ('아몬드', 'pine_nuts'),
  ('잣', 'pine_nuts'),
  ('캐슈넛', 'pine_nuts'),
  ('피스타치오', 'pine_nuts'),

  -- 갑각류/조개류
  ('새우', 'shrimp'),
  ('게', 'crab'),
  ('꽃게', 'crab'),
  ('랍스터', 'shellfish'),
  ('가재', 'shellfish'),
  ('굴', 'shellfish'),
  ('전복', 'shellfish'),
  ('조개', 'shellfish'),
  ('홍합', 'shellfish'),

  -- 생선
  ('고등어', 'mackerel'),
  ('연어', 'mackerel'),
  ('참치', 'mackerel'),
  ('명태', 'mackerel'),
  ('멸치', 'mackerel'),

  -- 콩
  ('대두', 'soybeans'),
  ('된장', 'soybeans'),
  ('간장', 'soybeans'),
  ('두부', 'soybeans'),
  ('콩나물', 'soybeans'),
  ('고추장', 'soybeans'),

  -- 밀/메밀
  ('밀가루', 'wheat'),
  ('빵', 'wheat'),
  ('면', 'wheat'),
  ('파스타', 'wheat'),
  ('메밀', 'buckwheat'),

  -- 육류
  ('돼지고기', 'pork'),
  ('삼겹살', 'pork'),
  ('목살', 'pork'),
  ('베이컨', 'pork'),
  ('소고기', 'beef'),
  ('등심', 'beef'),
  ('안심', 'beef'),
  ('닭고기', 'chicken'),
  ('닭가슴살', 'chicken'),
  ('닭다리', 'chicken'),

  -- 과일/채소 (라벨링 대상)
  ('복숭아', 'peaches'),
  ('토마토', 'tomatoes')
ON CONFLICT (ingredient_keyword) DO NOTHING;

-- 6. 알레르기 필터링 함수
CREATE OR REPLACE FUNCTION check_ingredient_allergens(
  ingredient_name TEXT,
  user_allergens TEXT[]
)
RETURNS TABLE(
  is_dangerous BOOLEAN,
  matched_allergens TEXT[]
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

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '재료 및 알레르기 시스템 스키마 생성 완료!';
  RAISE NOTICE '- ingredients 테이블 생성 완료';
  RAISE NOTICE '- allergen_mappings 테이블 생성 완료';
  RAISE NOTICE '- 기본 알레르기 매핑 데이터 삽입 완료 (40+ 항목)';
  RAISE NOTICE '- RLS 정책 설정 완료';
  RAISE NOTICE '- 알레르기 필터링 함수 생성 완료';
END $$;
