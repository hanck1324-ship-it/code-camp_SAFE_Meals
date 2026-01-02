import { NextResponse } from 'next/server';
import {
  getHACCPProducts,
  getKoreanFoodIngredients,
  getFoodQRInfo,
  searchProductByBarcode,
  searchProductByName,
} from '@/lib/public-data-api';

/**
 * 공공데이터 API 테스트 엔드포인트
 *
 * 사용법:
 * - GET /api/test/public-data?api=haccp
 * - GET /api/test/public-data?api=korean-food
 * - GET /api/test/public-data?api=food-qr
 * - GET /api/test/public-data?api=search-barcode&barcode=8801234567890
 * - GET /api/test/public-data?api=search-name&name=콜라
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const api = searchParams.get('api');
  const barcode = searchParams.get('barcode');
  const name = searchParams.get('name');

  try {
    let result;

    switch (api) {
      case 'haccp':
        result = await getHACCPProducts({ numOfRows: 5 });
        break;

      case 'korean-food':
        result = await getKoreanFoodIngredients({ perPage: 10 });
        break;

      case 'food-qr':
        result = await getFoodQRInfo({ numOfRows: 5 });
        break;

      case 'search-barcode':
        if (!barcode) {
          return NextResponse.json(
            { error: 'barcode parameter is required' },
            { status: 400 }
          );
        }
        result = await searchProductByBarcode(barcode);
        break;

      case 'search-name':
        if (!name) {
          return NextResponse.json(
            { error: 'name parameter is required' },
            { status: 400 }
          );
        }
        result = await searchProductByName(name);
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid API parameter',
            usage: {
              haccp: '/api/test/public-data?api=haccp',
              'korean-food': '/api/test/public-data?api=korean-food',
              'food-qr': '/api/test/public-data?api=food-qr',
              'search-barcode': '/api/test/public-data?api=search-barcode&barcode=8801234567890',
              'search-name': '/api/test/public-data?api=search-name&name=콜라',
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      api,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error('[Public Data API Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
