/**
 * API 응답 표준화 유틸리티
 *
 * 모든 API 라우트에서 일관된 응답 형식을 사용하도록 합니다.
 *
 * 성공 응답:
 * {
 *   success: true,
 *   data: { ... },
 *   message?: string
 * }
 *
 * 에러 응답:
 * {
 *   success: false,
 *   error: string,
 *   code?: string,
 *   details?: unknown
 * }
 */

import { NextResponse } from 'next/server';

// ============================================
// 타입 정의
// ============================================

/** 성공 응답 타입 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** 에러 응답 타입 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/** API 응답 타입 (성공 또는 에러) */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** HTTP 상태 코드 */
export type HttpStatusCode =
  | 200
  | 201
  | 400
  | 401
  | 403
  | 404
  | 409
  | 429
  | 500
  | 503;

/** 에러 코드 */
export enum ApiErrorCode {
  // 인증 관련
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // 요청 관련
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // 리소스 관련
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // 권한 관련
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',

  // 서버 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',

  // 외부 서비스 관련
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 성공 응답 생성
 *
 * @param data - 응답 데이터
 * @param message - 선택적 메시지
 * @param status - HTTP 상태 코드 (기본: 200)
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: HttpStatusCode = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

/**
 * 에러 응답 생성
 *
 * @param error - 에러 메시지
 * @param status - HTTP 상태 코드
 * @param code - 에러 코드
 * @param details - 추가 상세 정보
 */
export function apiError(
  error: string,
  status: HttpStatusCode = 500,
  code?: ApiErrorCode | string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

// ============================================
// 일반 에러 응답 헬퍼
// ============================================

/** 400 Bad Request */
export function badRequest(error: string, code?: string, details?: unknown) {
  return apiError(error, 400, code || ApiErrorCode.INVALID_REQUEST, details);
}

/** 401 Unauthorized */
export function unauthorized(error = '로그인이 필요합니다.') {
  return apiError(error, 401, ApiErrorCode.AUTH_REQUIRED);
}

/** 403 Forbidden */
export function forbidden(error = '접근 권한이 없습니다.') {
  return apiError(error, 403, ApiErrorCode.FORBIDDEN);
}

/** 404 Not Found */
export function notFound(
  error = '요청한 리소스를 찾을 수 없습니다.',
  code?: string
) {
  return apiError(error, 404, code || ApiErrorCode.NOT_FOUND);
}

/** 409 Conflict */
export function conflict(error: string, code?: string) {
  return apiError(error, 409, code || ApiErrorCode.CONFLICT);
}

/** 429 Rate Limited */
export function rateLimited(
  error = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  retryAfter?: number
) {
  return apiError(
    error,
    429,
    ApiErrorCode.RATE_LIMITED,
    retryAfter ? { retry_after: retryAfter } : undefined
  );
}

/** 500 Internal Server Error */
export function serverError(
  error = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
) {
  return apiError(error, 500, ApiErrorCode.INTERNAL_ERROR);
}

/** 503 Service Unavailable */
export function serviceUnavailable(
  error = '서비스를 일시적으로 사용할 수 없습니다.'
) {
  return apiError(error, 503, ApiErrorCode.SERVICE_UNAVAILABLE);
}
