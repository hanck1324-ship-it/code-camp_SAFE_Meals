-- ============================================
-- 스캔 이력 저장 기능 마이그레이션
-- scan_history 테이블에 job_id 컬럼 추가
--
-- @see 38prompts.401.scan-history-save.txt
-- 
-- 실행 방법:
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. job_id 컬럼 추가 (중복 저장 방지용)
-- TEXT UNIQUE 제약으로 DB 레벨에서 중복 방지
ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS job_id TEXT UNIQUE;

-- 2. job_id 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_scan_history_job_id ON scan_history(job_id);

-- 3. RLS 정책 확인 및 업데이트 (필요 시)
-- scan_history INSERT 정책이 이미 있으므로 추가 작업 불필요
-- CREATE POLICY "Users can insert own scan history" ON scan_history
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. scan_results INSERT 정책 추가 (없는 경우)
-- RLS가 활성화되어 있고 scan_history를 통해 권한 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scan_results' AND policyname = 'Users can insert own scan results'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own scan results" ON scan_results
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM scan_history
          WHERE scan_history.id = scan_results.scan_id
          AND scan_history.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- ============================================
-- 마이그레이션 검증 쿼리
-- ============================================

-- job_id 컬럼 존재 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scan_history' AND column_name = 'job_id';

-- 인덱스 존재 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'scan_history' AND indexname = 'idx_scan_history_job_id';

-- RLS 정책 확인
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'scan_results';
