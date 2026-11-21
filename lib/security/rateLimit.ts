import { adminDb } from '../firebase/admin';

/**
 * Maximum complaints allowed per user in the rate limit window.
 */
export const RATE_LIMIT_MAX_REQUESTS = 5;

/**
 * Duration of the rate limit window in milliseconds (10 minutes).
 */
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  count: number;
}

/**
 * Checks whether the user has exceeded the complaint submission limit
 * (5 requests per 10 minutes) across serverless invocations using Firestore.
 *
 * @param {string} uid - Authenticated user UID.
 * @returns {Promise<RateLimitResult>} Allowed status and current count.
 */
export async function checkComplaintRateLimit(uid: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  try {
    const snapshot = await adminDb
      .collection('complaints')
      .where('reporterUid', '==', uid)
      .where('createdAt', '>=', windowStart)
      .get();

    const count = snapshot.size;

    return {
      allowed: count < RATE_LIMIT_MAX_REQUESTS,
      count,
    };
  } catch (err) {
    // If query fails (e.g. index building or offline in tests), fallback to allowing
    console.error('Rate limit query failed:', err);
    return {
      allowed: true,
      count: 0,
    };
  }
}
