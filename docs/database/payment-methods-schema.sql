-- ============================================
-- 결제 수단 등록 시스템 데이터베이스 스키마
-- ============================================

-- 1. registered_payment_methods 테이블 생성 (등록된 결제 수단)
CREATE TABLE IF NOT EXISTS registered_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 결제 수단 타입
  payment_type TEXT NOT NULL, -- 'CARD', 'EASY_PAY', 'PAYPAL'

  -- 카드 정보 (CARD 타입일 때)
  card_number_masked TEXT, -- 마스킹된 카드 번호 (예: **** **** **** 1234)
  card_brand TEXT, -- Visa, Mastercard, AMEX, JCB, UnionPay
  card_name TEXT, -- 카드 이름 (예: 신한카드 체크)

  -- 간편결제 정보 (EASY_PAY 타입일 때)
  easy_pay_provider TEXT, -- 'KAKAO', 'NAVER', 'TOSS', 'PAYCO', 'SAMSUNG', 'APPLE', 'GOOGLE'
  easy_pay_account TEXT, -- 연동된 계정 정보 (마스킹됨)

  -- PayPal 정보 (PAYPAL 타입일 때)
  paypal_email TEXT, -- PayPal 계정 이메일

  -- PortOne 빌링키 (자동결제를 위한 키)
  billing_key TEXT,

  -- 기본 결제 수단 여부
  is_default BOOLEAN DEFAULT FALSE,

  -- 활성화 여부
  is_active BOOLEAN DEFAULT TRUE,

  -- 등록/마지막 사용 시간
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- registered_payment_methods 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_registered_payment_methods_user_id ON registered_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_registered_payment_methods_type ON registered_payment_methods(payment_type);
CREATE INDEX IF NOT EXISTS idx_registered_payment_methods_default ON registered_payment_methods(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_registered_payment_methods_active ON registered_payment_methods(user_id, is_active) WHERE is_active = TRUE;

-- 2. Row Level Security (RLS) 정책 설정
ALTER TABLE registered_payment_methods ENABLE ROW LEVEL SECURITY;

-- 자신의 결제 수단만 조회 가능
DROP POLICY IF EXISTS "Users can view own payment methods" ON registered_payment_methods;
CREATE POLICY "Users can view own payment methods" ON registered_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- 자신의 결제 수단만 삽입 가능
DROP POLICY IF EXISTS "Users can insert own payment methods" ON registered_payment_methods;
CREATE POLICY "Users can insert own payment methods" ON registered_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 자신의 결제 수단만 수정 가능
DROP POLICY IF EXISTS "Users can update own payment methods" ON registered_payment_methods;
CREATE POLICY "Users can update own payment methods" ON registered_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 자신의 결제 수단만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own payment methods" ON registered_payment_methods;
CREATE POLICY "Users can delete own payment methods" ON registered_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3. 기본 결제 수단 설정 시 다른 결제 수단의 기본 설정 해제하는 트리거
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- 같은 사용자의 다른 결제 수단들의 기본 설정 해제
    UPDATE registered_payment_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON registered_payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
  BEFORE INSERT OR UPDATE ON registered_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- 4. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_registered_payment_methods_updated_at ON registered_payment_methods;
CREATE TRIGGER update_registered_payment_methods_updated_at
  BEFORE UPDATE ON registered_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 결제 수단 타입 검증 제약조건
ALTER TABLE registered_payment_methods
  ADD CONSTRAINT check_payment_type
  CHECK (payment_type IN ('CARD', 'EASY_PAY', 'PAYPAL'));

-- 6. 간편결제 제공자 검증 제약조건
ALTER TABLE registered_payment_methods
  ADD CONSTRAINT check_easy_pay_provider
  CHECK (
    payment_type != 'EASY_PAY' OR
    easy_pay_provider IN ('KAKAO', 'NAVER', 'TOSS', 'PAYCO', 'SAMSUNG', 'APPLE', 'GOOGLE')
  );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '결제 수단 등록 시스템 스키마 생성 완료!';
  RAISE NOTICE '- registered_payment_methods 테이블 생성 완료';
  RAISE NOTICE '- RLS 정책 설정 완료';
  RAISE NOTICE '- 인덱스 생성 완료';
  RAISE NOTICE '- 트리거 설정 완료 (기본 결제 수단 단일화)';
  RAISE NOTICE '- 제약조건 설정 완료';
END $$;
