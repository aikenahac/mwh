import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

/**
 * Handle Zod validation errors
 */
export function zodErrorResponse(error: ZodError): NextResponse<ApiError> {
  return errorResponse(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    error.issues
  );
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: () => errorResponse('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => errorResponse(message, 403, 'FORBIDDEN'),
  notFound: (resource = 'Resource') =>
    errorResponse(`${resource} not found`, 404, 'NOT_FOUND'),
  badRequest: (message = 'Bad request') =>
    errorResponse(message, 400, 'BAD_REQUEST'),
  internalError: (message = 'Internal server error') =>
    errorResponse(message, 500, 'INTERNAL_ERROR'),
};

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiSuccess<T>>>
): Promise<NextResponse<ApiSuccess<T> | ApiError>> {
  return handler().catch((error) => {
    console.error('API Error:', error);
    return ErrorResponses.internalError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  });
}
