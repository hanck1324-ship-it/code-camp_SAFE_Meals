/**
 * Playwright 테스트 Fixture 관리
 * Service Role Key를 사용하여 RLS 우회
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Node.js crypto.randomUUID를 uuid v4 대신 사용
const uuidv4 = randomUUID;

// Service Role Client 생성 (RLS 우회)
let serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Supabase 환경변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.'
      );
    }

    serviceClient = createClient(supabaseUrl, serviceRoleKey);
  }

  return serviceClient;
}

// 안전 등급 타입
type SafetyLevel = 'safe' | 'caution' | 'danger' | 'unknown';

/**
 * 테스트용 스캔 이력 시드 데이터 삽입
 * @param userId - 사용자 UUID
 * @param testRunId - 테스트 실행 고유 ID (병렬 실행 충돌 방지)
 * @param options - 추가 옵션
 */
export async function seedRecentScans(
  userId: string,
  testRunId: string,
  options?: {
    scanType?: 'menu' | 'barcode' | 'image';
    safetyLevel?: SafetyLevel;
    resultCount?: number;
  }
): Promise<string> {
  const client = getServiceClient();
  const {
    scanType = 'menu',
    safetyLevel = 'safe',
    resultCount = 1,
  } = options || {};

  // scan_history 삽입
  const { data: scanData, error: scanError } = await client
    .from('scan_history')
    .insert({
      user_id: userId,
      scan_type: scanType,
      image_url: 'https://example.com/test-image.jpg',
      restaurant_name: `Test Restaurant [${testRunId}]`,
      scanned_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (scanError) {
    throw new Error(`scan_history 삽입 실패: ${scanError.message}`);
  }

  // scan_results 삽입 (여러 개)
  const results = Array.from({ length: resultCount }, (_, i) => ({
    scan_id: scanData.id,
    item_name: `Test Menu Item ${i + 1} [${testRunId}]`,
    safety_level: i === 0 ? safetyLevel : 'safe', // 첫 번째 결과에만 지정된 safety_level 적용
  }));

  const { error: resultError } = await client
    .from('scan_results')
    .insert(results);

  if (resultError) {
    throw new Error(`scan_results 삽입 실패: ${resultError.message}`);
  }

  return scanData.id;
}

/**
 * 여러 건의 스캔 이력 시드 데이터 삽입
 */
export async function seedMultipleScans(
  userId: string,
  testRunId: string,
  count: number
): Promise<string[]> {
  const scanIds: string[] = [];
  const safetyLevels: SafetyLevel[] = ['danger', 'caution', 'safe'];

  for (let i = 0; i < count; i++) {
    const scanId = await seedRecentScans(userId, testRunId, {
      safetyLevel: safetyLevels[i % safetyLevels.length],
      resultCount: i + 1, // 점점 더 많은 결과 추가
    });
    scanIds.push(scanId);

    // 시간 간격을 두기 위해 약간 대기
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return scanIds;
}

/**
 * 테스트 실행 ID로 시드 데이터 정리
 * FK 순서: scan_results → scan_history
 */
export async function cleanupByTestRunId(testRunId: string): Promise<void> {
  const client = getServiceClient();

  // scan_history에서 testRunId가 포함된 레코드 조회
  const { data: scans, error: selectError } = await client
    .from('scan_history')
    .select('id')
    .like('restaurant_name', `%[${testRunId}]%`);

  if (selectError) {
    console.error(`정리 조회 실패: ${selectError.message}`);
    return;
  }

  if (!scans || scans.length === 0) {
    return;
  }

  const scanIds = scans.map((s) => s.id);

  // 1. 자식 테이블 먼저 삭제 (scan_results)
  const { error: resultsError } = await client
    .from('scan_results')
    .delete()
    .in('scan_id', scanIds);

  if (resultsError) {
    console.error(`scan_results 삭제 실패: ${resultsError.message}`);
  }

  // 2. 부모 테이블 삭제 (scan_history)
  const { error: historyError } = await client
    .from('scan_history')
    .delete()
    .in('id', scanIds);

  if (historyError) {
    console.error(`scan_history 삭제 실패: ${historyError.message}`);
  }
}

/**
 * 특정 scan_id 배열로 시드 데이터 정리
 */
export async function cleanupScans(scanIds: string[]): Promise<void> {
  if (!scanIds || scanIds.length === 0) {
    return;
  }

  const client = getServiceClient();

  // 1. 자식 테이블 먼저 삭제
  await client.from('scan_results').delete().in('scan_id', scanIds);

  // 2. 부모 테이블 삭제
  await client.from('scan_history').delete().in('id', scanIds);
}

/**
 * 테스트용 Storage 이미지 정리
 *
 * @param userId - 사용자 UUID
 * @param testRunId - 테스트 실행 고유 ID (병렬 실행 충돌 방지)
 */
export async function cleanupTestImages(
  userId: string,
  testRunId: string
): Promise<void> {
  const client = getServiceClient();

  try {
    // 사용자 폴더 전체에서 테스트 이미지 검색
    // Storage 경로 구조: {user_id}/{year}/{month}/{scan_id}_{timestamp}.webp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const basePath = `${userId}/${year}/${month}`;

    const { data: files, error } = await client.storage
      .from('scan-images')
      .list(basePath);

    if (error) {
      console.error(`Storage 이미지 목록 조회 실패: ${error.message}`);
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    // testRunId가 포함된 파일 또는 최근 테스트 파일 정리
    // (실제로는 testRunId로 필터링하기 어려우므로, 전체 삭제 또는 시간 기반 필터링)
    const paths = files.map((f) => `${basePath}/${f.name}`);

    if (paths.length > 0) {
      const { error: deleteError } = await client.storage
        .from('scan-images')
        .remove(paths);

      if (deleteError) {
        console.error(`Storage 이미지 삭제 실패: ${deleteError.message}`);
      } else {
        console.log(
          `🗑️ [TestFixtures] ${paths.length}개 테스트 이미지 정리 완료`
        );
      }
    }
  } catch (error) {
    console.error('Storage 이미지 정리 실패:', error);
  }
}

/**
 * 테스트 실행 고유 ID 생성
 */
export function generateTestRunId(): string {
  return uuidv4().slice(0, 8);
}
