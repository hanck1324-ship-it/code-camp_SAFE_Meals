-- ============================================
-- SafeMeals: 스캔 이미지 Storage 버킷 설정
-- Supabase SQL Editor에서 실행 또는 Migration으로 적용
--
-- @see 39prompts.401.scan-image-storage.txt
-- ============================================

-- ============================================
-- 1. scan-images 버킷 생성 (idempotent)
-- ============================================

-- 버킷이 없을 때만 생성 (중복 실행 안전)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'scan-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'scan-images',
        'scan-images',
        true,  -- 공개 버킷 (URL로 직접 접근 가능)
        5242880,  -- 5MB 제한
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
    RAISE NOTICE 'scan-images 버킷이 생성되었습니다.';
  ELSE
    RAISE NOTICE 'scan-images 버킷이 이미 존재합니다.';
  END IF;
END $$;

-- ============================================
-- 2. Storage RLS 정책 설정
-- ============================================

-- 기존 정책 삭제 (idempotent - 존재하지 않아도 에러 없음)
DROP POLICY IF EXISTS "Users can upload scan images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view scan images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own scan images" ON storage.objects;

-- 2-1. 인증된 사용자만 자신의 폴더에 업로드 가능
CREATE POLICY "Users can upload scan images to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'scan-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2-2. 공개 버킷이므로 모든 사용자 읽기 가능
CREATE POLICY "Anyone can view scan images"
ON storage.objects FOR SELECT
USING (bucket_id = 'scan-images');

-- 2-3. 본인 이미지만 삭제 가능
CREATE POLICY "Users can delete own scan images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'scan-images' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. 검증
-- ============================================

-- 버킷 존재 확인
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'scan-images';

-- RLS 정책 확인
SELECT policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%scan images%';
