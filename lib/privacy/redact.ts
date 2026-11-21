/**
 * Regular expressions for detecting personally identifiable information (PII).
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
const ID_NUMBER_REGEX = /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\b/g;

/**
 * Redacts personally identifiable information (phone numbers, email addresses, and ID numbers)
 * from input text before passing it to third-party services such as Gemini.
 *
 * @param {string} text - Raw input text containing potential personal data.
 * @returns {string} Sanitized text with personal information replaced with redaction placeholders.
 */
export function redactPersonalData(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(ID_NUMBER_REGEX, '[REDACTED_ID]');
}
