import { describe, it, expect } from 'vitest';
import { redactPersonalData } from '@/lib/privacy/redact';

describe('redactPersonalData', () => {
  it('redacts email addresses', () => {
    const input = 'Contact me at citizen@example.com for details.';
    const result = redactPersonalData(input);
    expect(result).toBe('Contact me at [REDACTED_EMAIL] for details.');
  });

  it('redacts phone numbers', () => {
    const input = 'Call 555-123-4567 or 1234567890 if urgent.';
    const result = redactPersonalData(input);
    expect(result).toContain('[REDACTED_PHONE]');
    expect(result).not.toContain('555-123-4567');
  });

  it('redacts identification numbers', () => {
    const input = 'My SSN is 123-45-6789.';
    const result = redactPersonalData(input);
    expect(result).toBe('My SSN is [REDACTED_ID].');
  });

  it('handles empty strings safely', () => {
    expect(redactPersonalData('')).toBe('');
  });
});
