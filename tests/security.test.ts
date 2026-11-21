import { describe, it, expect } from 'vitest';
import { extractBearerToken, createErrorResponse } from '@/lib/security/auth';

describe('Security Helpers', () => {
  describe('extractBearerToken', () => {
    it('extracts token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer abc.123.xyz');
      expect(token).toBe('abc.123.xyz');
    });

    it('returns null for missing or invalid headers', () => {
      expect(extractBearerToken(null)).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken('Basic user:pass')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
    });
  });

  describe('createErrorResponse', () => {
    it('formats error according to AGENTS.md rule 7', async () => {
      const response = createErrorResponse('UNAUTHORIZED', 'Invalid token', 401);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
    });
  });
});
