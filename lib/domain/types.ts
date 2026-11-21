import { z } from 'zod';
import { COMPLAINT_CATEGORIES } from './constants';

/**
 * Zod schema for tracking code format: 'CR-' followed by 6 uppercase letters or digits.
 */
export const TrackingCodeSchema = z
  .string()
  .regex(/^CR-[A-Z0-9]{6}$/, 'Tracking code must start with CR- followed by 6 uppercase alphanumeric characters');

/**
 * Complaint lifecycle statuses.
 */
export const ComplaintStatusSchema = z.enum([
  'reported',
  'in_progress',
  'resolved',
  'rejected',
]);

export type ComplaintStatus = z.infer<typeof ComplaintStatusSchema>;

/**
 * Location details schema.
 */
export const LocationSchema = z.object({
  address: z
    .string()
    .min(3, 'Address must be at least 3 characters long')
    .max(200, 'Address cannot exceed 200 characters'),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

/**
 * Priority levels determined by AI or administrators.
 */
export const PrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Priority = z.infer<typeof PrioritySchema>;

/**
 * AI analysis metadata schema.
 */
export const AiAnalysisSchema = z.object({
  category: z.string(),
  priority: PrioritySchema,
  priorityScore: z.number().min(1).max(100),
  department: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  safetyRisk: z.boolean(),
  confidence: z.number().min(0).max(1),
  source: z.enum(['gemini', 'fallback']),
  analyzedAt: z.string(),
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

/**
 * Status transition history entry schema.
 */
export const StatusHistoryEntrySchema = z.object({
  status: ComplaintStatusSchema,
  at: z.string(),
  by: z.string(),
  note: z.string().optional(),
});

export type StatusHistoryEntry = z.infer<typeof StatusHistoryEntrySchema>;

/**
 * Admin override schema for manual re-routing or re-prioritizing.
 */
export const AdminOverrideSchema = z.object({
  department: z.string().optional(),
  priority: PrioritySchema.optional(),
  category: z.string().optional(),
  overriddenBy: z.string(),
  overriddenAt: z.string(),
  note: z.string().optional(),
});

export type AdminOverride = z.infer<typeof AdminOverrideSchema>;

/**
 * Full Complaint entity schema stored in Firestore.
 */
export const ComplaintSchema = z.object({
  id: z.string(),
  trackingCode: TrackingCodeSchema,
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters long')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters long')
    .max(2000, 'Description cannot exceed 2000 characters'),
  userCategory: z.enum(COMPLAINT_CATEGORIES).optional().nullable(),
  location: LocationSchema,
  hasImage: z.boolean(),
  reporterUid: z.string(),
  status: ComplaintStatusSchema,
  ai: AiAnalysisSchema.nullable(),
  adminOverride: AdminOverrideSchema.optional().nullable(),
  statusHistory: z.array(StatusHistoryEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Complaint = z.infer<typeof ComplaintSchema>;

/**
 * Client submission payload schema for POST /api/complaints.
 */
export const CreateComplaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be between 5 and 100 characters')
    .max(100, 'Title must be between 5 and 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be between 20 and 2000 characters')
    .max(2000, 'Description must be between 20 and 2000 characters'),
  userCategory: z
    .preprocess(
      (val) => (val === '' ? undefined : val),
      z.enum(COMPLAINT_CATEGORIES).optional().nullable()
    )
    .optional(),
  location: LocationSchema,
  photo: z
    .object({
      data: z.string().min(1, 'Photo data cannot be empty'),
      mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Only JPEG, PNG, or WebP allowed'),
    })
    .optional()
    .nullable(),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

/**
 * Separate ComplaintImage document stored in complaintImages/{complaintId}.
 */
export const ComplaintImageSchema = z.object({
  id: z.string(),
  data: z.string(),
  mimeType: z.string(),
  reporterUid: z.string(),
  createdAt: z.string(),
});

export type ComplaintImage = z.infer<typeof ComplaintImageSchema>;
