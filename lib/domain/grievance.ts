import { z } from 'zod';

/**
 * Civic grievance category enum schema.
 */
export const GrievanceCategorySchema = z.enum([
  'pothole',
  'street_light',
  'waste_management',
  'water_supply',
  'drainage',
  'other',
]);

export type GrievanceCategory = z.infer<typeof GrievanceCategorySchema>;

/**
 * Validation schema for submitting a civic grievance report.
 */
export const CreateGrievanceSchema = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters long' })
    .max(100, { message: 'Title must be under 100 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters long' })
    .max(2000, { message: 'Description must be under 2000 characters' }),
  category: GrievanceCategorySchema,
  location: z.object({
    address: z.string().min(3, { message: 'Address is required' }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export type CreateGrievanceInput = z.infer<typeof CreateGrievanceSchema>;

/**
 * Status of a civic grievance report.
 */
export const GrievanceStatusSchema = z.enum([
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
]);

export type GrievanceStatus = z.infer<typeof GrievanceStatusSchema>;
