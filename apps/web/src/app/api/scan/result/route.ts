import { NextResponse } from 'next/server';

import { getJob, type JobData } from '@/utils/scan-job-manager';

import type { NextRequest } from 'next/server';

/**
 * 스캔 결과 조회 API
 *
 * jobId를 통해 백그라운드에서 처리 중인 분석 결과를 조회합니다.
 *
 * 엔드포인트: GET /api/scan/result?jobId={jobId}
 *
 * 응답:
 * - status: "PENDING" | "FINAL" | "ERROR"
 * - result: 최종 결과 (FINAL인 경우)
 * - quickResult: 1차 판정 결과 (참고용)
 * - timings: 성능 계측 데이터
 *
 * 클라이언트 사용 가이드:
 * 1. /api/scan/analyze에서 PARTIAL 응답을 받으면 jobId를 저장
 * 2. 1~2초 간격으로 이 API를 폴링 (최대 30초, 백오프 권장)
 * 3. status가 "FINAL"이 되면 폴링 중단하고 result 사용
 * 4. status가 "ERROR"이면 에러 처리
 */
export async function GET(req: NextRequest) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 [ScanResult] jobId 조회 요청');
  console.log('='.repeat(60));

  try {
    // 1. jobId 파라미터 추출
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      console.log('❌ [ScanResult] jobId 파라미터 누락');
      return NextResponse.json(
        {
          success: false,
          message: 'jobId 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    console.log(`📋 [ScanResult] jobId=${jobId}`);

    // 2. Job 조회
    const jobData = await getJob(jobId);

    if (!jobData) {
      console.log(`❌ [ScanResult] jobId=${jobId} 를 찾을 수 없음`);
      return NextResponse.json(
        {
          success: false,
          message:
            '해당 작업을 찾을 수 없습니다. 이미 만료되었거나 존재하지 않는 jobId입니다.',
          code: 'JOB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    console.log(`✅ [ScanResult] jobId=${jobId}, status=${jobData.status}`);

    // 3. 상태에 따른 응답
    switch (jobData.status) {
      case 'PENDING':
        // 아직 처리 중
        return NextResponse.json({
          success: true,
          status: 'PENDING',
          message: '분석이 진행 중입니다. 잠시 후 다시 확인해주세요.',
          quickResult: jobData.quickResult,
          timings: jobData.timings,
          createdAt: new Date(jobData.createdAt).toISOString(),
        });

      case 'FINAL':
        // 처리 완료
        console.log(
          `🎉 [ScanResult] FINAL 결과 반환 - geminiMs=${jobData.timings.geminiMs}ms`
        );
        return NextResponse.json({
          success: true,
          status: 'FINAL',
          result: jobData.result,
          quickResult: jobData.quickResult,
          timings: jobData.timings,
          createdAt: new Date(jobData.createdAt).toISOString(),
          completedAt: jobData.completedAt
            ? new Date(jobData.completedAt).toISOString()
            : null,
          // 기존 응답 호환성 유지
          overall_status: jobData.result?.overall_status,
          results: jobData.result?.results,
          user_context: jobData.result?.user_context,
          db_enhanced: jobData.result?.db_enhanced,
          _performance: {
            server_total_ms: jobData.timings.totalMs,
            gemini_ms: jobData.timings.geminiMs,
            db_verify_ms: jobData.timings.dbVerifyMs,
            quick_ms: jobData.timings.quickMs,
            ocr_ms: jobData.timings.ocrMs,
            ocr_text_chars: jobData.timings.ocrTextChars,
            prompt_chars: jobData.timings.promptChars,
          },
        });

      case 'ERROR':
        // 에러 발생
        console.error(`❌ [ScanResult] ERROR 상태 - ${jobData.errorMessage}`);
        return NextResponse.json(
          {
            success: false,
            status: 'ERROR',
            message: jobData.errorMessage || '분석 중 오류가 발생했습니다.',
            quickResult: jobData.quickResult,
            timings: jobData.timings,
            createdAt: new Date(jobData.createdAt).toISOString(),
            completedAt: jobData.completedAt
              ? new Date(jobData.completedAt).toISOString()
              : null,
          },
          { status: 500 }
        );

      default:
        console.error(`❌ [ScanResult] 알 수 없는 status: ${jobData.status}`);
        return NextResponse.json(
          {
            success: false,
            message: '알 수 없는 작업 상태입니다.',
          },
          { status: 500 }
        );
    }
  } catch (error: any) {
    console.error('❌ [ScanResult] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || '결과 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
