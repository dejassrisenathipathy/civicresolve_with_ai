import { describe, it, expect } from 'vitest';
import { redactPII, redactPersonalData } from '@/lib/privacy/redact';

describe('redactPII', () => {
  describe('Indian Phone Numbers', () => {
    it('redacts 10-digit mobile numbers starting with 6, 7, 8, 9', () => {
      const inputs = [
        'Call 9876543210 for details',
        'Contact 8123456789 immediately',
        'Reach me at 7012345678 or 6234567890',
      ];

      inputs.forEach((input) => {
        const result = redactPII(input);
        expect(result.text).toContain('[PHONE]');
        expect(result.redactions.phones).toBeGreaterThan(0);
        expect(result.text).not.toMatch(/[6-9]\d{9}/);
      });
    });

    it('redacts numbers with +91 prefix and formatting spaces or hyphens', () => {
      const inputs = [
        'My phone is +91 9876543210',
        'Helpline: +91-9876543210',
        'Call +919876543210 please',
        'Dial 98765 43210 now',
        'Reach me at 98765-43210',
      ];

      inputs.forEach((input) => {
        const result = redactPII(input);
        expect(result.text).toContain('[PHONE]');
        expect(result.redactions.phones).toBe(1);
      });
    });
  });

  describe('Email Addresses', () => {
    it('redacts various standard and complex email addresses', () => {
      const text = 'Emails: citizen@gov.in, officer.kumar+alert@municipality.org, test123_45@sub.domain.co.in';
      const result = redactPII(text);

      expect(result.text).toBe('Emails: [EMAIL], [EMAIL], [EMAIL]');
      expect(result.redactions.emails).toBe(3);
    });
  });

  describe('Identification Numbers (Aadhaar & PAN)', () => {
    it('redacts 12-digit Aadhaar numbers with spaces, hyphens, or continuous', () => {
      const text = 'Aadhaar: 1234 5678 9012, 9876-5432-1098, and 555544443333.';
      const result = redactPII(text);

      expect(result.text).toBe('Aadhaar: [ID], [ID], and [ID].');
      expect(result.redactions.ids).toBe(3);
    });

    it('redacts PAN numbers (5 letters, 4 digits, 1 letter)', () => {
      const text = 'PAN cards: ABCDE1234F and xyzpq9876k.';
      const result = redactPII(text);

      expect(result.text).toBe('PAN cards: [ID] and [ID].');
      expect(result.redactions.ids).toBe(2);
    });
  });

  describe('Mixed PII and Non-PII', () => {
    it('redacts multiple mixed identifiers and correctly tallies counts', () => {
      const text =
        'Citizen Ramesh (PAN: ABCDE1234F, Aadhaar: 2345 6789 0123) reported from 9876543210. Email: ramesh@example.com.';
      const result = redactPII(text);

      expect(result.text).toBe(
        'Citizen Ramesh (PAN: [ID], Aadhaar: [ID]) reported from [PHONE]. Email: [EMAIL].'
      );
      expect(result.redactions).toEqual({
        phones: 1,
        emails: 1,
        ids: 2,
        total: 4,
      });
    });

    it('leaves text without PII untouched', () => {
      const text = 'Broken streetlight near Ward 12, Main Street opposite City Park.';
      const result = redactPII(text);

      expect(result.text).toBe(text);
      expect(result.redactions.total).toBe(0);
    });

    it('handles empty strings and null gracefully', () => {
      expect(redactPII('')).toEqual({
        text: '',
        redactions: { phones: 0, emails: 0, ids: 0, total: 0 },
      });
      expect(redactPersonalData('')).toBe('');
    });
  });
});
