import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createErrorResponse } from '@/lib/security/auth';
import { Complaint } from '@/lib/domain/types';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/complaints/[id]
 * Retrieves complaint details by ID for status viewing.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id } = params;

  if (!id) {
    return createErrorResponse('INVALID_REQUEST', 'Missing complaint ID', 400);
  }

  const doc = await adminDb.collection('complaints').doc(id).get();
  if (!doc.exists) {
    return createErrorResponse('NOT_FOUND', 'Complaint not found', 404);
  }

  const complaint = doc.data() as Complaint;
  return NextResponse.json({ complaint }, { status: 200 });
}
