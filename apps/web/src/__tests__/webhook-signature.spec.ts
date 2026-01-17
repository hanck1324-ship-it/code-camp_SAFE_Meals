/**
 * 웹훅 서명 검증 테스트
 *
 * 테스트 대상:
 * - HMAC-SHA256 서명 검증
 * - 타임스탬프 유효성 검증
 * - 이벤트 타입별 처리
 */

import { createHmac } from 'crypto';

// 테스트용 웹훅 시크릿
const TEST_WEBHOOK_SECRET = 'test-webhook-secret-key';

/**
 * 웹훅 서명 생성 (테스트용)
 */
function generateWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  secret: string
): string {
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');
  return `v1,${signature}`;
}

/**
 * 웹훅 서명 검증 (실제 로직 복제)
 */
function verifyWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  signature: string,
  secret: string
): { isValid: boolean; reason?: string } {
  // 타임스탬프 검증 (5분 이내)
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(now - timestamp);

  if (timeDiff > 300) {
    return { isValid: false, reason: 'timestamp_expired' };
  }

  // 서명 생성 및 비교
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('base64');

  // v1,signature 형식에서 signature 추출
  const signatures = signature.split(' ').map((s) => {
    const parts = s.split(',');
    return parts.length > 1 ? parts[1] : parts[0];
  });

  const isValid = signatures.some((sig) => sig === expectedSignature);

  if (!isValid) {
    return { isValid: false, reason: 'signature_mismatch' };
  }

  return { isValid: true };
}

describe('웹훅 서명 검증', () => {
  describe('서명 생성', () => {
    it('올바른 형식의 서명을 생성해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        type: 'Transaction.Paid',
        data: { paymentId: 'pay-123' },
      });

      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      expect(signature).toMatch(/^v1,/);
      expect(signature.split(',')[1]).toBeTruthy();
    });

    it('동일한 입력에 대해 동일한 서명을 생성해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = '1704067200';
      const body = '{"test": true}';

      const signature1 = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );
      const signature2 = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      expect(signature1).toBe(signature2);
    });

    it('다른 입력에 대해 다른 서명을 생성해야 함', () => {
      const webhookTimestamp = '1704067200';

      const signature1 = generateWebhookSignature(
        'id-1',
        webhookTimestamp,
        'body1',
        TEST_WEBHOOK_SECRET
      );
      const signature2 = generateWebhookSignature(
        'id-2',
        webhookTimestamp,
        'body2',
        TEST_WEBHOOK_SECRET
      );

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('서명 검증', () => {
    it('유효한 서명은 검증 통과해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(true);
    });

    it('잘못된 서명은 검증 실패해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const invalidSignature = 'v1,invalid-signature-here';

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        invalidSignature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('signature_mismatch');
    });

    it('다른 시크릿으로 생성된 서명은 검증 실패해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      // 다른 시크릿으로 서명 생성
      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        'wrong-secret'
      );

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('signature_mismatch');
    });

    it('변조된 body는 검증 실패해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const originalBody = JSON.stringify({
        type: 'Transaction.Paid',
        data: { paymentId: 'pay-123' },
      });
      const tamperedBody = JSON.stringify({
        type: 'Transaction.Paid',
        data: { paymentId: 'pay-999' },
      });

      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        originalBody,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        tamperedBody, // 변조된 body
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('signature_mismatch');
    });
  });

  describe('타임스탬프 검증', () => {
    it('5분 이내의 타임스탬프는 유효함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(true);
    });

    it('5분을 초과한 타임스탬프는 만료됨', () => {
      const webhookId = 'webhook-123';
      // 6분 전 타임스탬프
      const expiredTimestamp = (Math.floor(Date.now() / 1000) - 360).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        expiredTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        expiredTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('timestamp_expired');
    });

    it('미래의 타임스탬프도 5분 이내면 유효함', () => {
      const webhookId = 'webhook-123';
      // 2분 후 타임스탬프 (시간 동기화 차이 고려)
      const futureTimestamp = (Math.floor(Date.now() / 1000) + 120).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        futureTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        futureTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(true);
    });

    it('미래 5분을 초과한 타임스탬프는 무효함', () => {
      const webhookId = 'webhook-123';
      // 10분 후 타임스탬프
      const farFutureTimestamp = (
        Math.floor(Date.now() / 1000) + 600
      ).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        farFutureTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        farFutureTimestamp,
        body,
        signature,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('timestamp_expired');
    });
  });

  describe('다중 서명 형식 지원', () => {
    it('v1,signature 형식을 처리해야 함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const signature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        signature, // v1,signature 형식
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(true);
    });

    it('공백으로 구분된 다중 서명 중 하나가 일치하면 유효함', () => {
      const webhookId = 'webhook-123';
      const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'Transaction.Paid' });

      const validSignature = generateWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        TEST_WEBHOOK_SECRET
      );
      const multipleSignatures = `v1,invalid-sig ${validSignature}`;

      const result = verifyWebhookSignature(
        webhookId,
        webhookTimestamp,
        body,
        multipleSignatures,
        TEST_WEBHOOK_SECRET
      );

      expect(result.isValid).toBe(true);
    });
  });
});

describe('웹훅 이벤트 타입', () => {
  const eventTypes = [
    { type: 'Transaction.Paid', description: '결제 완료' },
    { type: 'Transaction.Cancelled', description: '결제 취소' },
    { type: 'Transaction.Failed', description: '결제 실패' },
    { type: 'Transaction.PayPending', description: '결제 대기' },
  ];

  eventTypes.forEach(({ type, description }) => {
    it(`${type} (${description}) 이벤트 페이로드 생성`, () => {
      const payload = {
        type,
        data: {
          paymentId: 'pay-test-123',
          transactionId: 'tx-test-456',
        },
      };

      expect(payload.type).toBe(type);
      expect(payload.data.paymentId).toBeDefined();
    });
  });
});

describe('리플레이 공격 방지', () => {
  it('동일한 웹훅을 재전송하면 타임스탬프 만료로 실패해야 함', async () => {
    const webhookId = 'webhook-123';
    // 오래된 타임스탬프
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
    const body = JSON.stringify({ type: 'Transaction.Paid' });

    const signature = generateWebhookSignature(
      webhookId,
      oldTimestamp,
      body,
      TEST_WEBHOOK_SECRET
    );

    // 첫 번째 검증 (타임스탬프가 이미 만료됨)
    const result = verifyWebhookSignature(
      webhookId,
      oldTimestamp,
      body,
      signature,
      TEST_WEBHOOK_SECRET
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('timestamp_expired');
  });

  it('웹훅 ID가 변경되면 서명이 무효화됨', () => {
    const originalWebhookId = 'webhook-123';
    const modifiedWebhookId = 'webhook-999';
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({ type: 'Transaction.Paid' });

    const signature = generateWebhookSignature(
      originalWebhookId,
      webhookTimestamp,
      body,
      TEST_WEBHOOK_SECRET
    );

    const result = verifyWebhookSignature(
      modifiedWebhookId, // 변경된 ID
      webhookTimestamp,
      body,
      signature,
      TEST_WEBHOOK_SECRET
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe('signature_mismatch');
  });
});
