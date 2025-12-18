import { NextResponse } from 'next/server';

/**
 * 식품안전나라 API 키 테스트
 * GET /api/test/api-key
 * 
 * 식품안전나라 API가 정상적으로 작동하는지 확인합니다.
 */
export async function GET() {
  try {
    // 1. API 키 설정 확인
    const API_KEY = 'e2d56042ec20418197';
    const RECIPE_ID = 'COOKRCP01';
    const TYPE = 'json';
    const START = '1';
    const END = '1'; // 테스트용으로 1개만 호출

    // 2. 테스트 URL 생성
    const testUrl = `http://openapi.foodsafetykorea.go.kr/api/${API_KEY}/${RECIPE_ID}/${TYPE}/${START}/${END}`;

    // 3. API 호출
    const startTime = Date.now();
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 4. 응답 확인
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'API 호출 실패',
          details: {
            status: response.status,
            statusText: response.statusText,
            apiKey: API_KEY.substring(0, 10) + '...',
            responseTime: `${responseTime}ms`,
          },
        },
        { status: response.status }
      );
    }

    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: 'API가 JSON을 반환하지 않습니다',
          details: {
            contentType,
            responsePreview: text.substring(0, 200),
            apiKey: API_KEY.substring(0, 10) + '...',
            responseTime: `${responseTime}ms`,
          },
        },
        { status: 400 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError: any) {
      const text = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: 'JSON 파싱 실패',
          message: parseError.message || '응답을 JSON으로 파싱할 수 없습니다',
          details: {
            responsePreview: text.substring(0, 200),
            apiKey: API_KEY.substring(0, 10) + '...',
            responseTime: `${responseTime}ms`,
          },
        },
        { status: 400 }
      );
    }

    // 5. 데이터 구조 확인
    const hasData = data[RECIPE_ID] && data[RECIPE_ID].row;
    const dataCount = hasData ? data[RECIPE_ID].row.length : 0;

    return NextResponse.json({
      success: true,
      message: 'API 키 정상 작동',
      details: {
        apiKey: API_KEY.substring(0, 10) + '...',
        serviceId: RECIPE_ID,
        responseTime: `${responseTime}ms`,
        status: response.status,
        hasData,
        dataCount,
        sampleData: hasData && dataCount > 0 ? {
          firstItem: Object.keys(data[RECIPE_ID].row[0] || {}).slice(0, 3),
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'API 테스트 실패',
        message: error.message || '알 수 없는 오류가 발생했습니다.',
        details: {
          errorType: error.constructor.name,
        },
      },
      { status: 500 }
    );
  }
}

