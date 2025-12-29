import { NextResponse } from 'next/server';

// 모킹 데이터 (API 키가 유효하지 않을 때 사용)
const MOCK_RECIPES = [
  {
    RCP_NM: '비빔밥',
    RCP_WAY2: '볶음',
    RCP_PAT2: '밥류',
    INFO_ENG: '500',
    INFO_CAR: '80',
    INFO_PRO: '15',
    INFO_FAT: '10',
    INFO_NA: '800',
    ATT_FILE_NO_MAIN: '',
  },
  {
    RCP_NM: '김치찌개',
    RCP_WAY2: '끓이기',
    RCP_PAT2: '찌개류',
    INFO_ENG: '200',
    INFO_CAR: '10',
    INFO_PRO: '12',
    INFO_FAT: '8',
    INFO_NA: '1200',
    ATT_FILE_NO_MAIN: '',
  },
];

const MOCK_HACCP = [
  {
    PRDLST_NM: '우유',
    BSSH_NM: '서울우유협동조합',
    PRDLST_DCNM: '유가공품',
  },
  {
    PRDLST_NM: '요구르트',
    BSSH_NM: '한국야쿠르트',
    PRDLST_DCNM: '발효유',
  },
];

export async function GET() {
  // 1. 인증키 및 서비스 ID 설정
  const API_KEY = process.env.FOOD_SAFETY_API_KEY || 'e2d56042ec20418197';

  // 서비스 ID
  const RECIPE_ID = 'COOKRCP01'; // 조리식품 레시피 DB
  const HACCP_ID = 'I1250'; // HACCP 적용업소 지정 현황

  // 공통 설정
  const TYPE = 'json';
  const START = '1';
  const END = '5';

  // 2. URL 생성
  const recipeUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${RECIPE_ID}/${TYPE}/${START}/${END}`;
  const haccpUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${HACCP_ID}/${TYPE}/${START}/${END}`;

  try {
    // 3. 두 API를 동시에 호출
    const [recipeRes, haccpRes] = await Promise.all([
      fetch(recipeUrl),
      fetch(haccpUrl),
    ]);

    // 응답 텍스트 먼저 가져오기
    const recipeText = await recipeRes.text();
    const haccpText = await haccpRes.text();

    // HTML 응답 체크 (API 키 오류)
    if (recipeText.includes('<script') || recipeText.includes('인증키')) {
      console.warn('[API] API 키가 유효하지 않음. 모킹 데이터 반환');
      return NextResponse.json({
        recipes: MOCK_RECIPES,
        haccp: MOCK_HACCP,
        status: 'mock',
        message: 'API 키가 유효하지 않아 샘플 데이터를 반환합니다.',
      });
    }

    // JSON 파싱 시도
    let recipeData, haccpData;
    try {
      recipeData = JSON.parse(recipeText);
      haccpData = JSON.parse(haccpText);
    } catch {
      console.warn('[API] JSON 파싱 실패. 모킹 데이터 반환');
      return NextResponse.json({
        recipes: MOCK_RECIPES,
        haccp: MOCK_HACCP,
        status: 'mock',
        message: 'API 응답 파싱 실패로 샘플 데이터를 반환합니다.',
      });
    }

    // 4. 응답 데이터 구조화
    const result = {
      recipes: recipeData[RECIPE_ID]?.row || [],
      haccp: haccpData[HACCP_ID]?.row || [],
      status: 'success',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] combined API 에러:', error);
    // 에러 시에도 모킹 데이터 반환
    return NextResponse.json({
      recipes: MOCK_RECIPES,
      haccp: MOCK_HACCP,
      status: 'mock',
      message: '외부 API 연결 실패로 샘플 데이터를 반환합니다.',
    });
  }
}
