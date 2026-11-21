import { describe, it, expect } from 'vitest';
import { classifyComplaint } from '@/lib/ai/classify';

describe('classifyComplaint stub', () => {
  it('returns null for now as specified', async () => {
    const result = await classifyComplaint('Pothole', 'Pothole on the road needs fixing');
    expect(result).toBeNull();
  });
});
