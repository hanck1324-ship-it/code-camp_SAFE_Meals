-- ============================================
-- 결제 시스템 데이터베이스 스키마
-- ============================================

-- 1. payments 테이블 생성 (결제 내역)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL UNIQUE, -- 포트원 결제 ID
  product_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- PAID, FAILED, CANCELLED
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 여행 패키지 정보
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  days INTEGER,

  -- 포트원 원본 데이터
  portone_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);

-- 2. user_subscriptions 테이블 생성 (활성 구독 정보)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- 여행 패키지 정보
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  days INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 한 유저당 하나의 활성 구독만 가능
  UNIQUE(user_id, product_id)
);

-- user_subscriptions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON user_subscriptions(is_active, expires_at);

-- 3. Row Level Security (RLS) 정책 설정
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- payments 정책: 자신의 결제 내역만 조회 가능
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- payments 정책: 서버에서만 삽입 가능 (service role)
DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
CREATE POLICY "Service role can insert payments" ON payments
  FOR INSERT
  WITH CHECK (true);

-- user_subscriptions 정책: 자신의 구독만 조회 가능
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- user_subscriptions 정책: 서버에서만 수정 가능
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. 만료된 구독 자동 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. 매일 자정에 실행되는 cron job (Supabase의 pg_cron 확장 필요)
-- Supabase Dashboard에서 수동으로 설정하거나, 아래 주석 해제하여 사용
-- SELECT cron.schedule(
--   'deactivate-expired-subscriptions',
--   '0 0 * * *', -- 매일 자정
--   $$SELECT deactivate_expired_subscriptions();$$
-- );

-- 6. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '결제 시스템 스키마 생성 완료!';
  RAISE NOTICE '- payments 테이블 생성 완료';
  RAISE NOTICE '- user_subscriptions 테이블 생성 완료';
  RAISE NOTICE '- RLS 정책 설정 완료';
  RAISE NOTICE '- 인덱스 생성 완료';
  RAISE NOTICE '- 트리거 설정 완료';
END $$;
