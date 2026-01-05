import { getSupabaseClient } from './supabase';

/**
 * 사용자의 온보딩 완료 여부 확인
 * @returns true면 신규 사용자(온보딩 필요), false면 기존 사용자
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  try {
    const [
      { data: allergies, error: allergyError },
      { data: diets, error: dietError },
      { data: safetyCard, error: safetyError },
    ] = await Promise.all([
      supabase.from('user_allergies').select('id').eq('user_id', userId).limit(1),
      supabase.from('user_diets').select('id').eq('user_id', userId).limit(1),
      supabase.from('safety_cards').select('id').eq('user_id', userId).limit(1),
    ]);

    if (allergyError) console.error('[checkOnboardingStatus] 알레르기 조회 에러:', allergyError);
    if (dietError) console.error('[checkOnboardingStatus] 식단 조회 에러:', dietError);
    if (safetyError) console.error('[checkOnboardingStatus] 안전카드 조회 에러:', safetyError);

    const hasOnboarded =
      (allergies && allergies.length > 0) ||
      (diets && diets.length > 0) ||
      (safetyCard && safetyCard.length > 0);

    return !hasOnboarded;
  } catch (error) {
    console.error('[checkOnboardingStatus] 에러:', error);
    return true;
  }
}
