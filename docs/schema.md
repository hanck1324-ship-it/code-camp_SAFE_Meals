-- ============================================
-- SafeMeals Database Schema
-- Supabase SQL Editor에서 실행
-- ============================================

-- ============================================
-- 1. ENUM 타입 생성
-- ============================================

-- 안전 등급
CREATE TYPE safety_level AS ENUM ('safe', 'caution', 'danger', 'unknown');

-- 알레르기 심각도
CREATE TYPE allergy_severity AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');

-- ============================================
-- 2. 알레르기 타입 테이블
-- ============================================

CREATE TABLE allergy_types (
code VARCHAR(50) PRIMARY KEY,
name_ko VARCHAR(100) NOT NULL,
name_en VARCHAR(100) NOT NULL,
name_ja VARCHAR(100),
name_zh VARCHAR(100),
icon VARCHAR(50),
category VARCHAR(50),
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알레르기 타입 데이터 삽입
INSERT INTO allergy_types (code, name_ko, name_en, name_ja, name_zh, icon, category) VALUES
('eggs', '난류', 'Eggs', '卵', '蛋类', '🥚', 'animal'),
('milk', '우유', 'Milk', '牛乳', '牛奶', '🥛', 'dairy'),
('buckwheat', '메밀', 'Buckwheat', 'そば', '荞麦', '🌾', 'grain'),
('peanuts', '땅콩', 'Peanuts', 'ピーナッツ', '花生', '🥜', 'nut'),
('soybeans', '대두', 'Soybeans', '大豆', '大豆', '🫘', 'legume'),
('wheat', '밀', 'Wheat', '小麦', '小麦', '🌾', 'grain'),
('mackerel', '고등어', 'Mackerel', 'さば', '�的鱼', '🐟', 'seafood'),
('crab', '게', 'Crab', 'カニ', '螃蟹', '🦀', 'seafood'),
('shrimp', '새우', 'Shrimp', 'えび', '虾', '🦐', 'seafood'),
('pork', '돼지고기', 'Pork', '豚肉', '猪肉', '🐷', 'meat'),
('peaches', '복숭아', 'Peaches', '桃', '桃子', '🍑', 'fruit'),
('tomatoes', '토마토', 'Tomatoes', 'トマト', '番茄', '🍅', 'vegetable'),
('sulfites', '아황산류', 'Sulfites', '亜硫酸塩', '亚硫酸盐', '⚗️', 'additive'),
('walnuts', '호두', 'Walnuts', 'くるみ', '核桃', '🌰', 'nut'),
('chicken', '닭고기', 'Chicken', '鶏肉', '鸡肉', '🐔', 'meat'),
('beef', '소고기', 'Beef', '牛肉', '牛肉', '🐄', 'meat'),
('lamb', '양고기', 'Lamb', '羊肉', '羊肉', '🐑', 'meat'),
('squid', '오징어', 'Squid', 'イカ', '鱿鱼', '🦑', 'seafood'),
('shellfish', '조개류', 'Shellfish', '貝類', '贝类', '🐚', 'seafood'),
('pine_nuts', '잣', 'Pine Nuts', '松の実', '松子', '🌲', 'nut');

-- ============================================
-- 3. 식이제한 타입 테이블
-- ============================================

CREATE TABLE diet_types (
code VARCHAR(50) PRIMARY KEY,
name_ko VARCHAR(100) NOT NULL,
name_en VARCHAR(100) NOT NULL,
name_ja VARCHAR(100),
name_zh VARCHAR(100),
icon VARCHAR(50),
description_ko TEXT,
description_en TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 식이제한 타입 데이터 삽입
INSERT INTO diet_types (code, name_ko, name_en, name_ja, name_zh, icon, description_ko, description_en) VALUES
('vegetarian', '채식주의', 'Vegetarian', 'ベジタリアン', '素食主义', '🥬', '육류를 제외한 식단', 'Diet excluding meat'),
('vegan', '비건', 'Vegan', 'ビーガン', '纯素食', '🌱', '모든 동물성 식품 제외', 'Diet excluding all animal products'),
('lacto_vegetarian', '락토 채식', 'Lacto Vegetarian', 'ラクト・ベジタリアン', '乳蛋素', '🥛', '육류·생선·달걀 제외, 유제품 허용', 'Diet excluding meat/fish/eggs, dairy allowed'),
('ovo_vegetarian', '오보 채식', 'Ovo Vegetarian', 'オボ・ベジタリアン', '蛋素', '🥚', '육류·생선·유제품 제외, 달걀 허용', 'Diet excluding meat/fish/dairy, eggs allowed'),
('pesco_vegetarian', '페스코 채식', 'Pesco Vegetarian', 'ペスコ・ベジタリアン', '鱼素', '🐟', '육류 제외, 생선 허용', 'Diet excluding meat, fish allowed'),
('flexitarian', '플렉시테리언', 'Flexitarian', 'フレキシタリアン', '弹性素食', '🥗', '유연한 채식', 'Flexible vegetarian diet'),
('halal', '할랄', 'Halal', 'ハラール', '清真', '☪️', '이슬람 율법에 따른 식단', 'Diet according to Islamic law'),
('kosher', '코셔', 'Kosher', 'コーシャ', '犹太洁食', '✡️', '유대교 율법에 따른 식단', 'Diet according to Jewish law'),
('buddhist_vegetarian', '불교 채식', 'Buddhist Vegetarian', '仏教菜食', '佛教素食', '🙏', '불교 채식(오신채 제외)', 'Buddhist vegetarian diet (no pungent vegetables)'),
('gluten_free', '글루텐 프리', 'Gluten Free', 'グルテンフリー', '无麸质', '🚫🌾', '글루텐 미포함 식단', 'Diet without gluten'),
('pork_free', '돼지고기 제외', 'Pork-Free', '豚肉なし', '无猪肉', '🚫🐷', '돼지고기 제외 식단', 'Diet without pork'),
('alcohol_free', '무알코올', 'Alcohol Free', 'アルコールなし', '无酒精', '🚫🍺', '알코올 미포함 식단', 'Diet without alcohol'),
('garlic_onion_free', '마늘/양파 제외', 'Garlic/Onion Free', 'ニンニク・玉ねぎなし', '无大蒜/洋葱', '🧄🧅', '마늘과 양파 제외 식단', 'Diet without garlic or onion'),
('lactose_free', '유당 불내증', 'Lactose Free', '乳糖フリー', '无乳糖', '🚫🥛', '유제품 미포함 식단', 'Diet without lactose'),
('low_sodium', '저염식', 'Low Sodium', '低塩', '低钠', '🧂', '나트륨 섭취 제한 식단', 'Diet with limited sodium intake'),
('diabetic', '당뇨식', 'Diabetic', '糖尿病食', '糖尿病饮食', '💉', '혈당 관리를 위한 식단', 'Diet for blood sugar management');

-- ============================================
-- 4. 사용자 프로필 테이블 (Supabase Auth 연동)
-- ============================================

CREATE TABLE user_profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
email VARCHAR(255),
name VARCHAR(100),
phone VARCHAR(20),
country VARCHAR(50),
avatar_url TEXT,
language VARCHAR(10) DEFAULT 'ko',
onboarding_done BOOLEAN DEFAULT FALSE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 새 사용자 생성 시 자동으로 프로필 생성하는 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.user_profiles (id, email, name)
VALUES (
NEW.id,
NEW.email,
COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
);
RETURN NEW;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. 사용자 알레르기 테이블
-- ============================================

CREATE TABLE user_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    allergy_code VARCHAR(50) NOT NULL REFERENCES allergy_types(code) ON DELETE CASCADE,
    severity allergy_severity DEFAULT 'moderate',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, allergy_code)
);

-- 인덱스 생성
CREATE INDEX idx_user_allergies_user_id ON user_allergies(user_id);

-- ============================================
-- 6. 사용자 식이제한 테이블
-- ============================================

CREATE TABLE user_diets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    diet_code VARCHAR(50) NOT NULL REFERENCES diet_types(code) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, diet_code)
);

-- 인덱스 생성
CREATE INDEX idx_user_diets_user_id ON user_diets(user_id);

-- ============================================
-- 7. 재료 테이블
-- ============================================

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ja VARCHAR(100),
    name_zh VARCHAR(100),
    allergen_codes TEXT[], -- 관련 알레르기 코드 배열
    is_common_allergen BOOLEAN DEFAULT FALSE,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_ingredients_name_ko ON ingredients(name_ko);
CREATE INDEX idx_ingredients_allergen_codes ON ingredients USING GIN(allergen_codes);

-- 기본 재료 데이터 삽입
INSERT INTO ingredients (name_ko, name_en, name_ja, name_zh, allergen_codes, is_common_allergen, category) VALUES
('돼지고기', 'Pork', '豚肉', '猪肉', ARRAY['pork'], TRUE, 'meat'),
('소고기', 'Beef', '牛肉', '牛肉', ARRAY['beef'], TRUE, 'meat'),
('닭고기', 'Chicken', '鶏肉', '鸡肉', ARRAY['chicken'], TRUE, 'meat'),
('새우', 'Shrimp', 'えび', '虾', ARRAY['shrimp', 'shellfish'], TRUE, 'seafood'),
('게', 'Crab', 'カニ', '螃蟹', ARRAY['crab', 'shellfish'], TRUE, 'seafood'),
('오징어', 'Squid', 'イカ', '鱿鱼', ARRAY['squid'], TRUE, 'seafood'),
('고등어', 'Mackerel', 'さば', '鲭鱼', ARRAY['mackerel'], TRUE, 'seafood'),
('계란', 'Egg', '卵', '鸡蛋', ARRAY['eggs'], TRUE, 'dairy'),
('우유', 'Milk', '牛乳', '牛奶', ARRAY['milk'], TRUE, 'dairy'),
('두부', 'Tofu', '豆腐', '豆腐', ARRAY['soybeans'], TRUE, 'soy'),
('된장', 'Soybean Paste', '味噌', '大酱', ARRAY['soybeans'], TRUE, 'condiment'),
('간장', 'Soy Sauce', '醤油', '酱油', ARRAY['soybeans', 'wheat'], TRUE, 'condiment'),
('밀가루', 'Wheat Flour', '小麦粉', '面粉', ARRAY['wheat', 'gluten_free'], TRUE, 'grain'),
('땅콩', 'Peanut', 'ピーナッツ', '花生', ARRAY['peanuts'], TRUE, 'nut'),
('호두', 'Walnut', 'くるみ', '核桃', ARRAY['walnuts'], TRUE, 'nut'),
('김치', 'Kimchi', 'キムチ', '泡菜', ARRAY[]::TEXT[], FALSE, 'vegetable'),
('쌀', 'Rice', '米', '米饭', ARRAY[]::TEXT[], FALSE, 'grain'),
('양파', 'Onion', '玉ねぎ', '洋葱', ARRAY[]::TEXT[], FALSE, 'vegetable'),
('마늘', 'Garlic', 'にんにく', '大蒜', ARRAY[]::TEXT[], FALSE, 'vegetable'),
('고추장', 'Red Pepper Paste', 'コチュジャン', '辣椒酱', ARRAY[]::TEXT[], FALSE, 'condiment');

-- ============================================
-- 8. 메뉴 아이템 테이블
-- ============================================

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ko VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_ja VARCHAR(200),
    name_zh VARCHAR(200),
    description_ko TEXT,
    description_en TEXT,
    description_ja TEXT,
    description_zh TEXT,
    image_url TEXT,
    category VARCHAR(50),
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_menu_items_name_ko ON menu_items(name_ko);
CREATE INDEX idx_menu_items_category ON menu_items(category);

-- 기본 메뉴 데이터 삽입
INSERT INTO menu_items (name_ko, name_en, name_ja, name_zh, description_ko, description_en, category, is_popular) VALUES
('비빔밥', 'Bibimbap', 'ビビンバ', '拌饭', '밥 위에 나물과 고추장을 넣어 비벼 먹는 음식', 'Rice topped with vegetables and red pepper paste', 'rice', TRUE),
('김치찌개', 'Kimchi Stew', 'キムチチゲ', '泡菜汤', '김치를 주재료로 한 한국식 찌개', 'Korean stew made with kimchi', 'stew', TRUE),
('된장찌개', 'Soybean Paste Stew', '味噌チゲ', '大酱汤', '된장을 풀어 만든 한국식 찌개', 'Korean stew made with soybean paste', 'stew', TRUE),
('순두부찌개', 'Soft Tofu Stew', 'スンドゥブチゲ', '嫩豆腐汤', '부드러운 두부가 들어간 매콤한 찌개', 'Spicy stew with soft tofu', 'stew', TRUE),
('불고기', 'Bulgogi', 'プルコギ', '烤肉', '얇게 썬 소고기를 양념에 재워 구운 음식', 'Marinated and grilled beef', 'meat', TRUE),
('삼겹살', 'Grilled Pork Belly', 'サムギョプサル', '五花肉', '돼지 삼겹살을 구워 먹는 음식', 'Grilled pork belly', 'meat', TRUE),
('잡채', 'Japchae', 'チャプチェ', '杂菜', '당면과 채소를 볶은 음식', 'Stir-fried glass noodles with vegetables', 'noodle', TRUE),
('떡볶이', 'Tteokbokki', 'トッポッキ', '炒年糕', '떡을 매콤한 고추장 소스에 볶은 음식', 'Spicy stir-fried rice cakes', 'snack', TRUE),
('김밥', 'Gimbap', 'キンパ', '紫菜包饭', '밥과 재료를 김으로 말아낸 음식', 'Rice and ingredients rolled in seaweed', 'rice', TRUE),
('냉면', 'Cold Noodles', '冷麺', '冷面', '차가운 육수에 면을 말아 먹는 음식', 'Cold noodles in chilled broth', 'noodle', TRUE);

-- ============================================
-- 9. 메뉴-재료 연결 테이블
-- ============================================

CREATE TABLE menu_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    is_main BOOLEAN DEFAULT FALSE,
    is_optional BOOLEAN DEFAULT FALSE,
    amount VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(menu_item_id, ingredient_id)
);

-- 인덱스 생성
CREATE INDEX idx_menu_ingredients_menu_id ON menu_ingredients(menu_item_id);
CREATE INDEX idx_menu_ingredients_ingredient_id ON menu_ingredients(ingredient_id);

-- ============================================
-- 10. 제품 테이블 (바코드 스캔용)
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    manufacturer VARCHAR(100),
    ingredients JSONB, -- 원재료 목록
    allergens JSONB, -- 알레르기 유발물질
    nutrition_info JSONB, -- 영양정보
    image_url TEXT,
    haccp_certified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_allergens ON products USING GIN(allergens);

-- ============================================
-- 11. 스캔 이력 테이블
-- ============================================

CREATE TABLE scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('menu', 'barcode', 'image')),
    image_url TEXT,
    restaurant_name VARCHAR(200),
    location JSONB, -- { lat, lng, address }
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX idx_scan_history_scanned_at ON scan_history(scanned_at DESC);

-- ============================================
-- 12. 스캔 결과 테이블
-- ============================================

CREATE TABLE scan_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scan_history(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    safety_level safety_level NOT NULL DEFAULT 'unknown',
    warning_message TEXT,
    matched_allergens JSONB, -- 매칭된 알레르기 목록
    matched_diets JSONB, -- 매칭된 식이제한 목록
    confidence_score DECIMAL(3,2), -- AI 신뢰도 점수 (0.00 ~ 1.00)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_scan_results_scan_id ON scan_results(scan_id);
CREATE INDEX idx_scan_results_safety_level ON scan_results(safety_level);

-- ============================================
-- 13. 안전 카드 테이블
-- ============================================

CREATE TABLE safety_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    pin_code VARCHAR(4),
    message_ko TEXT,
    message_en TEXT,
    message_ja TEXT,
    message_zh TEXT,
    message_local TEXT, -- 현지어 (사용자 설정)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. RLS (Row Level Security) 정책 설정
-- ============================================

-- user_profiles 테이블
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- user_allergies 테이블
ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allergies" ON user_allergies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allergies" ON user_allergies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies" ON user_allergies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies" ON user_allergies
    FOR DELETE USING (auth.uid() = user_id);

-- user_diets 테이블
ALTER TABLE user_diets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diets" ON user_diets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diets" ON user_diets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diets" ON user_diets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diets" ON user_diets
    FOR DELETE USING (auth.uid() = user_id);

-- scan_history 테이블
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan history" ON scan_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan history" ON scan_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- scan_results 테이블
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan results" ON scan_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM scan_history
            WHERE scan_history.id = scan_results.scan_id
            AND scan_history.user_id = auth.uid()
        )
    );

-- safety_cards 테이블
ALTER TABLE safety_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own safety card" ON safety_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own safety card" ON safety_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own safety card" ON safety_cards
    FOR UPDATE USING (auth.uid() = user_id);

-- 공개 테이블 (모든 사용자 읽기 가능)
ALTER TABLE allergy_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view allergy types" ON allergy_types FOR SELECT USING (true);

ALTER TABLE diet_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view diet types" ON diet_types FOR SELECT USING (true);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ingredients" ON ingredients FOR SELECT USING (true);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu items" ON menu_items FOR SELECT USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

ALTER TABLE menu_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu ingredients" ON menu_ingredients FOR SELECT USING (true);

-- ============================================
-- 15. 유용한 뷰 생성
-- ============================================

-- 사용자 알레르기 상세 뷰
CREATE OR REPLACE VIEW user_allergies_detail AS
SELECT
    ua.id,
    ua.user_id,
    ua.allergy_code,
    ua.severity,
    at.name_ko,
    at.name_en,
    at.name_ja,
    at.name_zh,
    at.icon,
    at.category
FROM user_allergies ua
JOIN allergy_types at ON ua.allergy_code = at.code;

-- 사용자 식이제한 상세 뷰
CREATE OR REPLACE VIEW user_diets_detail AS
SELECT
    ud.id,
    ud.user_id,
    ud.diet_code,
    dt.name_ko,
    dt.name_en,
    dt.name_ja,
    dt.name_zh,
    dt.icon,
    dt.description_ko,
    dt.description_en
FROM user_diets ud
JOIN diet_types dt ON ud.diet_code = dt.code;

-- 메뉴 알레르기 정보 뷰
CREATE OR REPLACE VIEW menu_allergens AS
SELECT
    mi.id AS menu_id,
    mi.name_ko AS menu_name_ko,
    mi.name_en AS menu_name_en,
    i.name_ko AS ingredient_name_ko,
    i.name_en AS ingredient_name_en,
    i.allergen_codes,
    mig.is_main
FROM menu_items mi
JOIN menu_ingredients mig ON mi.id = mig.menu_item_id
JOIN ingredients i ON mig.ingredient_id = i.id
WHERE array_length(i.allergen_codes, 1) > 0;

-- ============================================
-- 16. 유용한 함수 생성
-- ============================================

-- 메뉴의 안전도 체크 함수
CREATE OR REPLACE FUNCTION check_menu_safety(
    p_menu_id UUID,
    p_user_id UUID
) RETURNS TABLE (
    safety_level safety_level,
    matched_allergens TEXT[],
    warning_message TEXT
) AS
$$

DECLARE
v_user_allergens TEXT[];
v_menu_allergens TEXT[];
v_matched TEXT[];
BEGIN
-- 사용자 알레르기 목록 가져오기
SELECT ARRAY_AGG(allergy_code) INTO v_user_allergens
FROM user_allergies
WHERE user_id = p_user_id;

    -- 메뉴의 알레르기 유발 재료 가져오기
    SELECT ARRAY_AGG(DISTINCT unnest) INTO v_menu_allergens
    FROM (
        SELECT unnest(i.allergen_codes)
        FROM menu_ingredients mi
        JOIN ingredients i ON mi.ingredient_id = i.id
        WHERE mi.menu_item_id = p_menu_id
    ) sub;

    -- 매칭되는 알레르기 찾기
    SELECT ARRAY(
        SELECT unnest(v_user_allergens)
        INTERSECT
        SELECT unnest(v_menu_allergens)
    ) INTO v_matched;

    -- 결과 반환
    IF v_matched IS NULL OR array_length(v_matched, 1) IS NULL THEN
        RETURN QUERY SELECT 'safe'::safety_level, ARRAY[]::TEXT[], ''::TEXT;
    ELSE
        RETURN QUERY SELECT
            'danger'::safety_level,
            v_matched,
            '이 메뉴에는 알레르기 유발 성분이 포함되어 있습니다.'::TEXT;
    END IF;

END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자의 최근 스캔 이력 가져오기
CREATE OR REPLACE FUNCTION get_recent_scans(
    p_user_id UUID,
    p_limit INT DEFAULT 10
) RETURNS TABLE (
    scan_id UUID,
    scan_type VARCHAR,
    item_name VARCHAR,
    safety_level safety_level,
    scanned_at TIMESTAMPTZ
) AS
$$

BEGIN
RETURN QUERY
SELECT
sh.id,
sh.scan_type,
sr.item_name,
sr.safety_level,
sh.scanned_at
FROM scan_history sh
LEFT JOIN scan_results sr ON sh.id = sr.scan_id
WHERE sh.user_id = p_user_id
ORDER BY sh.scanned_at DESC
LIMIT p_limit;
END;

$$
LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 17. updated_at 자동 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS
$$

BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_cards_updated_at
    BEFORE UPDATE ON safety_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료 메시지
-- ============================================
SELECT 'SafeMeals 데이터베이스 스키마가 성공적으로 생성되었습니다!' AS message;
$$
