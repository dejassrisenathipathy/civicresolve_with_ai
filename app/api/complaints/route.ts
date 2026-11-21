import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth';
import { checkComplaintRateLimit } from '@/lib/security/rateLimit';
import { CreateComplaintSchema, Complaint } from '@/lib/domain/types';
import { generateTrackingCode } from '@/lib/domain/trackingCode';
import { classifyComplaint } from '@/lib/ai/classify';

/**
 * POST /api/complaints
 * Creates a new citizen complaint, validates with Zod, enforces rate limiting,
 * securely saves the photo to complaintImages, classifies the complaint via Gemini AI,
 * and updates the complaint document with structured AI triage metadata.
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

  // 4. If a photo was supplied, store it in the separate complaintImages collection
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

  // 5. Build and save the initial Complaint document with ai: null
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
    ai: null,
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

  // 6. Run AI classification after saving, then update the complaint's ai field
  try {
    const aiAnalysis = await classifyComplaint({
      id: complaintId,
      title: data.title,
      description: data.description,
      address: data.location.address,
      userCategory: data.userCategory,
      imageBase64: data.photo?.data,
    });

    await complaintDocRef.update({
      ai: aiAnalysis,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI classification update error for id:', complaintId, err);
  }

  return NextResponse.json(
    {
      id: complaintId,
      trackingCode,
    },
    { status: 201 }
  );
}
export const maxDuration = 60;
