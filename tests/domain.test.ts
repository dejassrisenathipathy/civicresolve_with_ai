import { describe, it, expect } from 'vitest';
import { CreateComplaintSchema, ComplaintSchema } from '@/lib/domain/types';

describe('Grievance Schemas', () => {
  describe('CreateComplaintSchema', () => {
    it('validates a complete valid complaint submission', () => {
      const input = {
        title: 'Deep pothole on Main Street',
        description: 'Large crater causing vehicles to swerve into oncoming traffic.',
        userCategory: 'roads_potholes',
        location: {
          address: 'Main St and 3rd Ave',
          lat: 12.9716,
          lng: 77.5946,
        },
        photo: {
          data: 'base64imagedatastring',
          mimeType: 'image/jpeg',
        },
      };

      const result = CreateComplaintSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('validates submission without optional photo and optional category', () => {
      const input = {
        title: 'Street light broken',
        description: 'The street lamp has been broken and dark for over a week.',
        location: {
          address: '42 Elm Road',
        },
      };

      const result = CreateComplaintSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects titles that are too short', () => {
      const input = {
        title: 'Fix',
        description: 'The street lamp has been broken and dark for over a week.',
        location: { address: '42 Elm Road' },
      };

      const result = CreateComplaintSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects descriptions shorter than 20 characters', () => {
      const input = {
        title: 'Broken pipe',
        description: 'Water leak',
        location: { address: '42 Elm Road' },
      };

      const result = CreateComplaintSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('ComplaintSchema', () => {
    it('validates a complete stored Complaint record', () => {
      const complaintRecord = {
        id: 'comp_123',
        trackingCode: 'CR-ABC123',
        title: 'Water pipeline burst on 5th cross',
        description: 'Continuous drinking water leakage on the sidewalk since yesterday.',
        userCategory: 'water_supply_leakage',
        location: {
          address: '5th Cross, Indiranagar',
          lat: 12.9784,
          lng: 77.6408,
        },
        hasImage: true,
        reporterUid: 'user_anon_789',
        status: 'reported',
        ai: null,
        adminOverride: null,
        statusHistory: [
          {
            status: 'reported',
            at: '2026-11-21T04:00:00.000Z',
            by: 'user_anon_789',
            note: 'Initial report',
          },
        ],
        createdAt: '2026-11-21T04:00:00.000Z',
        updatedAt: '2026-11-21T04:00:00.000Z',
      };

      const result = ComplaintSchema.safeParse(complaintRecord);
      expect(result.success).toBe(true);
    });
  });
});
