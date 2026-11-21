import { randomBytes } from 'crypto';

/**
 * Characters allowed in tracking code (uppercase alphanumeric, avoiding ambiguous chars).
 */
const TRACKING_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a unique 9-character tracking code in the format 'CR-XXXXXX'
 * consisting of 'CR-' followed by 6 random uppercase letters/digits.
 *
 * @returns {string} Generated tracking code matching /^CR-[A-Z0-9]{6}$/.
 */
export function generateTrackingCode(): string {
  const bytes = randomBytes(6);
  let code = 'CR-';

  for (let i = 0; i < 6; i++) {
    const index = bytes[i] % TRACKING_CHARS.length;
    code += TRACKING_CHARS[index];
  }

  return code;
}
