import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateRequest, createErrorResponse } from '@/lib/security/auth';
import { ComplaintImage } from '@/lib/domain/types';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/complaints/[id]/image
 * Securely serves the complaint photo only to the complaint owner or an admin.
 */
export async function GET(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = params;

  if (!id) {
    return createErrorResponse('INVALID_REQUEST', 'Missing complaint ID', 400);
  }

  // 1. Authenticate user via Firebase ID token
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult.response;
  }
  const { user } = authResult;

  // 2. Fetch image from complaintImages collection
  const imageDoc = await adminDb.collection('complaintImages').doc(id).get();
  if (!imageDoc.exists) {
    return createErrorResponse('NOT_FOUND', 'Image not found for this complaint', 404);
  }

  const imageData = imageDoc.data() as ComplaintImage;

  // 3. Authorization check: must be owner or admin
  const isOwner = imageData.reporterUid === user.uid;
  const isAdmin = user.admin === true;

  if (!isOwner && !isAdmin) {
    return createErrorResponse(
      'FORBIDDEN',
      'You do not have permission to view this image',
      403
    );
  }

  // 4. Return image bytes with correct content type
  const buffer = Buffer.from(imageData.data, 'base64');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': imageData.mimeType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
