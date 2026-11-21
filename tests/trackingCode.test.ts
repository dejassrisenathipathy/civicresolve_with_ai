import { describe, it, expect } from 'vitest';
import { generateTrackingCode } from '@/lib/domain/trackingCode';
import { TrackingCodeSchema } from '@/lib/domain/types';

describe('generateTrackingCode', () => {
  it('generates a valid tracking code with format CR- followed by 6 alphanumeric characters', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateTrackingCode();
      expect(code).toMatch(/^CR-[A-Z0-9]{6}$/);
      expect(TrackingCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it('generates unique tracking codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateTrackingCode());
    }
    expect(codes.size).toBe(100);
  });
});
