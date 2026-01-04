# Supabase 스키마 적용 가이드

## 📋 목차
1. [사전 준비](#사전-준비)
2. [방법 1: Supabase Dashboard (권장)](#방법-1-supabase-dashboard-권장)
3. [방법 2: Supabase CLI](#방법-2-supabase-cli)
4. [적용 후 검증](#적용-후-검증)
5. [문제 해결](#문제-해결)

---

## 사전 준비

### 1. Supabase 프로젝트 확인

현재 프로젝트의 Supabase URL을 확인합니다:

```bash
# .env.local 파일에서 확인
cat apps/web/.env.local | grep SUPABASE_URL
```

예상 출력:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```

### 2. 스키마 파일 확인

```bash
# 스키마 파일 존재 확인
ls -lh docs/database/ingredients-schema.sql

# 파일 내용 미리보기
head -30 docs/database/ingredients-schema.sql
```

---

## 방법 1: Supabase Dashboard (권장)

가장 쉽고 안전한 방법입니다.

### Step 1: Supabase Dashboard 접속

1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인
3. SafeMeals 프로젝트 선택

### Step 2: SQL Editor 열기

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. 또는 직접 URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`

### Step 3: 새 쿼리 생성

1. **New query** 버튼 클릭
2. 쿼리 이름 입력 (예: "ingredients-schema-setup")

### Step 4: 스키마 SQL 복사/붙여넣기

**방법 A: 파일에서 직접 복사**

```bash
# 터미널에서 파일 내용 출력 (복사하기 편함)
cat docs/database/ingredients-schema.sql
```

출력된 내용을 전체 복사 (`Cmd+A` → `Cmd+C`)

**방법 B: 파일 열어서 복사**

```bash
# VS Code에서 열기
code docs/database/ingredients-schema.sql
```

파일 내용 전체 복사

### Step 5: SQL Editor에 붙여넣기

1. SQL Editor에 복사한 내용 붙여넣기 (`Cmd+V`)
2. 내용 확인:
   - `CREATE TABLE IF NOT EXISTS ingredients`
   - `CREATE TABLE IF NOT EXISTS allergen_mappings`
   - `INSERT INTO allergen_mappings` (40+ 행)
   - `CREATE OR REPLACE FUNCTION check_ingredient_allergens`

### Step 6: 실행

1. **Run** 버튼 클릭 (또는 `Cmd+Enter`)
2. 실행 진행 상황 확인
3. 성공 메시지 대기

**예상 출력**:
```
Success. No rows returned
```

또는

```
NOTICE: 재료 및 알레르기 시스템 스키마 생성 완료!
NOTICE: - ingredients 테이블 생성 완료
NOTICE: - allergen_mappings 테이블 생성 완료
NOTICE: - 기본 알레르기 매핑 데이터 삽입 완료 (40+ 항목)
NOTICE: - RLS 정책 설정 완료
NOTICE: - 알레르기 필터링 함수 생성 완료
```

### Step 7: 저장 (선택사항)

1. **Save** 버튼 클릭
2. 나중에 다시 실행할 수 있도록 저장

---

## 방법 2: Supabase CLI

개발 환경에서 CLI로 적용하는 방법입니다.

### Step 1: Supabase CLI 설치

```bash
# Homebrew (macOS)
brew install supabase/tap/supabase

# npm
npm install -g supabase

# 설치 확인
supabase --version
```

### Step 2: Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 로그인

### Step 3: 프로젝트 연결

```bash
# 프로젝트 루트에서
cd /Users/hanchang-gi/Desktop/Fronted-End/TeamProject/code-camp_SAFE_Meals-main

# 프로젝트 ID 확인 (.env.local에서)
# 예: https://abcdefgh.supabase.co → 프로젝트 ID = abcdefgh

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_ID
```

### Step 4: 마이그레이션 파일 생성

```bash
# supabase/migrations 디렉토리 생성
mkdir -p supabase/migrations

# 스키마 파일 복사
cp docs/database/ingredients-schema.sql supabase/migrations/20260103000000_create_ingredients_schema.sql
```

### Step 5: 마이그레이션 적용

```bash
# 원격 DB에 적용
supabase db push
```

**또는 직접 실행**:

```bash
# SQL 파일 직접 실행
supabase db execute --file docs/database/ingredients-schema.sql
```

---

## 적용 후 검증

### 1. 테이블 생성 확인

**SQL Editor에서 실행**:

```sql
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('ingredients', 'allergen_mappings')
ORDER BY table_name;
```

**예상 결과**:
```
 table_name
-------------------
 allergen_mappings
 ingredients
```

### 2. 컬럼 구조 확인

```sql
-- ingredients 테이블 컬럼
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ingredients'
ORDER BY ordinal_position;

-- allergen_mappings 테이블 컬럼
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'allergen_mappings'
ORDER BY ordinal_position;
```

### 3. 기본 데이터 확인

```sql
-- 알레르기 매핑 데이터 개수
SELECT COUNT(*) as total_mappings
FROM allergen_mappings;
-- 예상: 40+ 행

-- 샘플 데이터 확인
SELECT * FROM allergen_mappings
WHERE allergen_type = 'shellfish'
LIMIT 5;
```

**예상 결과**:
```
 ingredient_keyword | allergen_type
--------------------+--------------
 새우               | shellfish
 게                 | shellfish
 꽃게               | shellfish
 랍스터             | shellfish
 가재               | shellfish
```

### 4. 함수 생성 확인

```sql
-- 함수 목록 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_ingredient_allergens';
```

**예상 결과**:
```
 routine_name              | routine_type
---------------------------+--------------
 check_ingredient_allergens| FUNCTION
```

### 5. 함수 테스트

```sql
-- 꽃게를 갑각류 알레르기와 체크
SELECT * FROM check_ingredient_allergens('꽃게', ARRAY['shellfish']);
```

**예상 결과**:
```
 is_dangerous | matched_allergens
--------------+-------------------
 true         | {shellfish}
```

```sql
-- 된장을 대두 알레르기와 체크
SELECT * FROM check_ingredient_allergens('된장', ARRAY['soy']);
```

**예상 결과**:
```
 is_dangerous | matched_allergens
--------------+-------------------
 true         | {soy}
```

```sql
-- 무를 체크 (알레르기 없음)
SELECT * FROM check_ingredient_allergens('무', ARRAY['shellfish', 'soy']);
```

**예상 결과**:
```
 is_dangerous | matched_allergens
--------------+-------------------
 false        | {}
```

### 6. RLS 정책 확인

```sql
-- RLS 정책 목록
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('ingredients', 'allergen_mappings')
ORDER BY tablename, policyname;
```

### 7. 인덱스 확인

```sql
-- 인덱스 목록
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('ingredients', 'allergen_mappings')
ORDER BY tablename, indexname;
```

**예상 결과**:
```
 indexname                           | tablename
-------------------------------------+-----------
 idx_allergen_mappings_keyword       | allergen_mappings
 idx_allergen_mappings_type          | allergen_mappings
 idx_ingredients_allergen_keywords   | ingredients
 idx_ingredients_is_allergen         | ingredients
 idx_ingredients_name                | ingredients
 idx_ingredients_recipe_id           | ingredients
```

---

## API 연동 테스트

### 1. 환경 변수 확인

```bash
# apps/web/.env.local
cat apps/web/.env.local | grep SUPABASE
```

**필수 환경 변수**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (선택)
```

### 2. 개발 서버 실행

```bash
# 웹 앱 실행
pnpm --filter @safemeals/web dev
```

### 3. 브라우저에서 확인

```
http://localhost:3000
```

### 4. 메뉴 스캔 테스트

1. 로그인
2. 프로필에서 알레르기 설정 (예: 갑각류)
3. 메뉴 스캔 시도
4. 콘솔 로그 확인:

```
🔍 재료 DB로 알레르기 검증 시작...
  ✓ 꽃게탕: DANGER → DANGER
✅ DB 검증 완료 - 최종 상태: DANGER
```

---

## 문제 해결

### ❌ 오류: "permission denied for table ingredients"

**원인**: RLS 정책 문제

**해결**:
```sql
-- RLS 정책 재설정
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view ingredients" ON ingredients;
CREATE POLICY "Anyone can view ingredients" ON ingredients
  FOR SELECT USING (true);
```

### ❌ 오류: "function check_ingredient_allergens does not exist"

**원인**: 함수 생성 실패

**해결**:
```bash
# 스키마 파일에서 함수 부분만 다시 실행
# docs/database/ingredients-schema.sql의 176-202 라인 복사
# SQL Editor에서 실행
```

### ❌ 오류: "duplicate key value violates unique constraint"

**원인**: 데이터가 이미 존재

**해결**:
```sql
-- 기존 데이터 확인
SELECT COUNT(*) FROM allergen_mappings;

-- 필요 시 테이블 초기화 (주의!)
TRUNCATE TABLE allergen_mappings CASCADE;
TRUNCATE TABLE ingredients CASCADE;

-- 스키마 재실행
```

### ❌ 오류: "relation "ingredients" already exists"

**원인**: 테이블이 이미 존재

**해결**:

스키마 파일의 `CREATE TABLE` 문에 `IF NOT EXISTS`가 있으므로 안전합니다.
그냥 무시하고 진행하거나, 완전히 새로 시작하려면:

```sql
-- 테이블 삭제 후 재생성 (주의!)
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS allergen_mappings CASCADE;
DROP FUNCTION IF EXISTS check_ingredient_allergens;

-- 스키마 재실행
```

### ❌ 웹 앱에서 "재료 알레르기 체크 실패"

**원인**: API 권한 또는 네트워크 문제

**해결**:

1. **브라우저 콘솔 확인**:
```
재료 "꽃게" 알레르기 체크 실패: { code: '...' }
```

2. **Supabase RLS 정책 확인**:
```sql
-- Service role로 접근하는지 확인
SELECT current_user, session_user;
```

3. **환경 변수 재확인**:
```bash
# Service role key가 있는지
cat apps/web/.env.local | grep SERVICE_ROLE
```

---

## 성공 확인 체크리스트

### ✅ Supabase Dashboard

- [ ] `ingredients` 테이블 생성됨
- [ ] `allergen_mappings` 테이블 생성됨
- [ ] `allergen_mappings`에 40+ 데이터 존재
- [ ] `check_ingredient_allergens` 함수 생성됨
- [ ] RLS 정책 활성화됨
- [ ] 인덱스 6개 생성됨 (GIN 인덱스 포함)

### ✅ SQL 테스트

- [ ] 꽃게 + shellfish → is_dangerous = true
- [ ] 된장 + soy → is_dangerous = true
- [ ] 무 + shellfish → is_dangerous = false

### ✅ 웹 앱

- [ ] 개발 서버 실행됨
- [ ] 로그인 가능
- [ ] 알레르기 설정 가능
- [ ] 메뉴 스캔 시 콘솔에 "🔍 재료 DB로 알레르기 검증 시작..." 출력됨

---

## 다음 단계

스키마 적용이 완료되면:

1. **한식진흥원 데이터 임포트** (2,033개 재료)
   - 가이드: `docs/database/README.md` → "데이터 임포트" 섹션

2. **실제 메뉴 이미지로 E2E 테스트**
   - 꽃게탕, 된장찌개 등 실제 촬영

3. **알레르기 매핑 확장**
   - 커뮤니티 피드백 기반 추가

---

## 빠른 실행 (요약)

```bash
# 1. 스키마 파일 복사
cat docs/database/ingredients-schema.sql

# 2. Supabase Dashboard 접속
# https://supabase.com/dashboard → SQL Editor

# 3. 복사한 내용 붙여넣기 → Run

# 4. 검증
# SQL Editor에서 실행:
SELECT COUNT(*) FROM allergen_mappings;
SELECT * FROM check_ingredient_allergens('꽃게', ARRAY['shellfish']);

# 5. 웹 앱 실행
pnpm --filter @safemeals/web dev
```

---

**작성자**: SafeMeals 개발팀
**최종 수정**: 2026-01-03
