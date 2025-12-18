import { NextResponse } from 'next/server';

export async function GET() {
  // 1. 인증키 및 서비스 ID 설정 (이미지의 키 적용)
  const API_KEY = 'e2d56042ec20418197'; 
  
  // 서비스 ID
  const RECIPE_ID = 'COOKRCP01'; // 조리식품 레시피 DB
  const HACCP_ID = 'I1250';      // HACCP 적용업소 지정 현황 (통상적인 ID)

  // 공통 설정
  const TYPE = 'json';
  const START = '1';
  const END = '5'; // 테스트용으로 5개씩만 호출

  // 2. URL 생성
  const recipeUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${RECIPE_ID}/${TYPE}/${START}/${END}`;
  const haccpUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${HACCP_ID}/${TYPE}/${START}/${END}`;

  try {
    // 3. 두 API를 동시에 호출 (병렬 처리로 속도 향상)
    const [recipeRes, haccpRes] = await Promise.all([
      fetch(recipeUrl),
      fetch(haccpUrl)
    ]);

    const recipeData = await recipeRes.json();
    const haccpData = await haccpRes.json();

    // 4. 응답 데이터 구조화
    const result = {
      recipes: recipeData[RECIPE_ID] ? recipeData[RECIPE_ID].row : [],
      haccp: haccpData[HACCP_ID] ? haccpData[HACCP_ID].row : [],
      status: 'success'
    };

    // 데이터가 정상적으로 왔는지 확인
    if (!recipeData[RECIPE_ID] && !haccpData[HACCP_ID]) {
       return NextResponse.json({ error: '데이터 호출 실패. 서비스 ID나 인증키를 확인하세요.' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}