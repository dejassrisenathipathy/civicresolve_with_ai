import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth';
import { classifyComplaint } from '@/lib/ai/classify';
import { Complaint, ComplaintImage } from '@/lib/domain/types';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/complaints/[id]/reclassify
 * Re-runs the Gemini AI triage pipeline on an existing complaint.
 * Restricted to the complaint owner or municipal administrators.
 */
export async function POST(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = params;

  if (!id) {
    return createErrorResponse('INVALID_REQUEST', 'Missing complaint ID', 400);
  }

  // 1. Authenticate user
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user } = authResult;

  // 2. Fetch complaint
  const complaintDoc = await adminDb.collection('complaints').doc(id).get();
  if (!complaintDoc.exists) {
    return createErrorResponse('NOT_FOUND', 'Complaint not found', 404);
  }

  const complaint = complaintDoc.data() as Complaint;

  // 3. Authorization check: must be owner or admin
  const isOwner = complaint.reporterUid === user.uid;
  const isAdmin = user.admin === true;

  if (!isOwner && !isAdmin) {
    return createErrorResponse(
      'FORBIDDEN',
      'You do not have permission to re-analyze this complaint',
      403
    );
  }

  // 4. Optionally fetch image for multimodal analysis
  let imageBase64: string | undefined = undefined;
  if (complaint.hasImage) {
    const imageDoc = await adminDb.collection('complaintImages').doc(id).get();
    if (imageDoc.exists) {
      const imgData = imageDoc.data() as ComplaintImage;
      imageBase64 = imgData.data;
    }
  }

  // 5. Re-run AI classification
  const aiResult = await classifyComplaint({
    id,
    title: complaint.title,
    description: complaint.description,
    address: complaint.location.address,
    userCategory: complaint.userCategory,
    imageBase64,
  });

  // 6. Update complaint with new analysis
  await adminDb.collection('complaints').doc(id).update({
    ai: aiResult,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ai: aiResult }, { status: 200 });
}
