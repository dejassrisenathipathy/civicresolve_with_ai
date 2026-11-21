import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth';
import { checkComplaintRateLimit } from '@/lib/security/rateLimit';
import { CreateComplaintSchema, Complaint } from '@/lib/domain/types';
import { generateTrackingCode } from '@/lib/domain/trackingCode';
import { classifyComplaint } from '@/lib/ai/classify';

/**
 * POST /api/complaints
 * Creates a new citizen complaint, validates payload with Zod, applies rate limits,
 * saves photos separately to complaintImages, and returns the complaint ID & tracking code.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Authenticate user via Firebase ID token
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user } = authResult;

  // 2. Enforce rate limiting: 5 complaints per user per 10 minutes
  const rateLimit = await checkComplaintRateLimit(user.uid);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded: You may only submit 5 complaints per 10 minutes.',
      429
    );
  }

  // 3. Parse and validate JSON input with Zod
  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return createErrorResponse('INVALID_JSON', 'Malformed JSON payload.', 400);
  }

  const parseResult = CreateComplaintSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return createErrorResponse('VALIDATION_ERROR', errorDetails, 400);
  }

  const data = parseResult.data;
  const nowISO = new Date().toISOString();
  const complaintDocRef = adminDb.collection('complaints').doc();
  const complaintId = complaintDocRef.id;
  const trackingCode = generateTrackingCode();

  // 4. Run AI classification pipeline (returns null for now)
  const aiResult = await classifyComplaint(data.title, data.description);

  // 5. If a photo was supplied, store it in the separate complaintImages collection
  const hasImage = Boolean(data.photo);
  if (data.photo) {
    await adminDb.collection('complaintImages').doc(complaintId).set({
      id: complaintId,
      data: data.photo.data,
      mimeType: data.photo.mimeType,
      reporterUid: user.uid,
      createdAt: nowISO,
    });
  }

  // 6. Build the Complaint document (photo is NEVER stored here)
  const complaint: Complaint = {
    id: complaintId,
    trackingCode,
    title: data.title,
    description: data.description,
    userCategory: data.userCategory || null,
    location: data.location,
    hasImage,
    reporterUid: user.uid,
    status: 'reported',
    ai: aiResult,
    adminOverride: null,
    statusHistory: [
      {
        status: 'reported',
        at: nowISO,
        by: user.uid,
        note: 'Initial citizen report submitted',
      },
    ],
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  await complaintDocRef.set(complaint);

  return NextResponse.json(
    {
      id: complaintId,
      trackingCode,
    },
    { status: 201 }
  );
}
