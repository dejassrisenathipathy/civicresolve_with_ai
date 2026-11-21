import { NextResponse } from 'next/server';
import { adminAuth } from '../firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Standard error response structure across the application.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Creates a standardized JSON error response following project guidelines.
 *
 * @param {string} code - Machine-readable error code.
 * @param {string} message - Human-readable error description.
 * @param {number} status - HTTP status code.
 * @returns {NextResponse<ApiErrorResponse>} Standardized Next.js JSON response.
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Extracts Bearer token from the standard Authorization header.
 *
 * @param {string | null} authHeader - Raw Authorization header value.
 * @returns {string | null} Extracted token or null if header is invalid or missing.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
}

export type AuthResult =
  | { success: true; user: DecodedIdToken; token: string }
  | { success: false; response: NextResponse<ApiErrorResponse> };

/**
 * Verifies the incoming Firebase ID token from the Authorization header.
 *
 * @param {Request} request - Incoming Next.js request.
 * @returns {Promise<AuthResult>} Verified token info or error response.
 */
export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      response: createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required: missing or invalid Bearer token',
        401
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      success: true,
      user: decodedToken,
      token,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid or expired authentication token';
    return {
      success: false,
      response: createErrorResponse('INVALID_TOKEN', message, 401),
    };
  }
}
