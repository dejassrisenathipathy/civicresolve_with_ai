/**
 * PII Redaction Module for Indian civic grievances.
 * Redacts emails, Indian phone numbers (+91 or 10 digits starting 6-9),
 * 12-digit Aadhaar-like numbers, and PAN-like alphanumeric tax codes.
 */

export interface RedactionCounts {
  phones: number;
  emails: number;
  ids: number;
  total: number;
}

export interface RedactionResult {
  text: string;
  redactions: RedactionCounts;
}

/**
 * Regular expressions for identifying PII.
 */
// Emails
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Indian phone numbers:
// 1) With +91: e.g. +91 9876543210, +91-98765-43210, +919876543210
// 2) 10 digits starting with 6-9: e.g. 9876543210, 98765 43210, 98765-43210
const INDIAN_PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|(?:\+91[\s-]?)?[6-9]\d{9}\b/g;

// Aadhaar: 12 digits, optionally formatted as 4-4-4 with space or hyphen
const AADHAAR_REGEX = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

// PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
const PAN_REGEX = /\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g;

/**
 * Sanitizes input text by replacing PII with placeholders [PHONE], [EMAIL], and [ID].
 *
 * @param {string} text - Raw input text.
 * @returns {RedactionResult} The sanitized text along with counts of each redacted entity.
 */
export function redactPII(text: string): RedactionResult {
  if (!text || typeof text !== 'string') {
    return {
      text: '',
      redactions: { phones: 0, emails: 0, ids: 0, total: 0 },
    };
  }

  let emailCount = 0;
  let phoneCount = 0;
  let idCount = 0;

  // 1. Redact Emails first (prevents email numbers/domains from triggering phone/id regex)
  let sanitized = text.replace(EMAIL_REGEX, () => {
    emailCount++;
    return '[EMAIL]';
  });

  // 2. Redact PAN-like codes
  sanitized = sanitized.replace(PAN_REGEX, () => {
    idCount++;
    return '[ID]';
  });

  // 3. Redact Indian phone numbers
  sanitized = sanitized.replace(INDIAN_PHONE_REGEX, () => {
    phoneCount++;
    return '[PHONE]';
  });

  // 4. Redact 12-digit Aadhaar-like numbers
  sanitized = sanitized.replace(AADHAAR_REGEX, () => {
    idCount++;
    return '[ID]';
  });

  return {
    text: sanitized,
    redactions: {
      phones: phoneCount,
      emails: emailCount,
      ids: idCount,
      total: phoneCount + emailCount + idCount,
    },
  };
}

/**
 * Backward-compatible helper returning only the redacted string.
 *
 * @param {string} text - Raw input text.
 * @returns {string} Redacted string.
 */
export function redactPersonalData(text: string): string {
  return redactPII(text).text;
}
