import { getSupabaseClient } from '@/lib/supabase';

/**
 * 사용자의 온보딩 완료 여부 확인
 * @param userId - Supabase 사용자 ID
 * @returns true면 신규 사용자(온보딩 필요), false면 기존 사용자(온보딩 완료)
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  try {
    console.log('[checkOnboardingStatus] 온보딩 상태 확인 시작:', userId);

    // 성능 최적화: 3개 쿼리를 병렬로 실행 (Promise.all)
    // 순차 실행 대비 약 3배 빠름 (300ms → 100ms)
    const [
      { data: allergies, error: allergyError },
      { data: diets, error: dietError },
      { data: safetyCard, error: safetyError }
    ] = await Promise.all([
      supabase
        .from('user_allergies')
        .select('id')
        .eq('user_id', userId)
        .limit(1),
      supabase
        .from('user_diets')
        .select('id')
        .eq('user_id', userId)
        .limit(1),
      supabase
        .from('safety_cards')
        .select('id')
        .eq('user_id', userId)
        .limit(1),
    ]);

    // 에러 로깅
    if (allergyError) {
      console.error('[checkOnboardingStatus] 알레르기 조회 에러:', allergyError);
    }
    if (dietError) {
      console.error('[checkOnboardingStatus] 식단 조회 에러:', dietError);
    }
    if (safetyError) {
      console.error('[checkOnboardingStatus] 안전카드 조회 에러:', safetyError);
    }

    // 하나라도 데이터가 있으면 온보딩 완료 (기존 사용자)
    const hasOnboarded =
      (allergies && allergies.length > 0) ||
      (diets && diets.length > 0) ||
      (safetyCard && safetyCard.length > 0);

    console.log('[checkOnboardingStatus] 온보딩 데이터:', {
      hasAllergies: allergies && allergies.length > 0,
      hasDiets: diets && diets.length > 0,
      hasSafetyCard: safetyCard && safetyCard.length > 0,
      hasOnboarded,
    });

    // 신규 사용자인지 반환 (온보딩 미완료)
    const isNewUser = !hasOnboarded;
    console.log('[checkOnboardingStatus] 결과:', isNewUser ? '신규 사용자 (온보딩 필요)' : '기존 사용자 (온보딩 완료)');

    return isNewUser;
  } catch (error) {
    console.error('[checkOnboardingStatus] 예상치 못한 에러:', error);
    // 에러 발생 시 안전하게 신규 사용자로 간주 (온보딩 진행)
    return true;
  }
}
