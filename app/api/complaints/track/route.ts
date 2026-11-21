import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createErrorResponse } from '@/lib/security/auth';

/**
 * GET /api/complaints/track?code=CR-XXXXXX
 * Resolves a public tracking code to the complaint ID.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return createErrorResponse('INVALID_CODE', 'Tracking code is required.', 400);
  }

  try {
    const snapshot = await adminDb
      .collection('complaints')
      .where('trackingCode', '==', code)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return createErrorResponse('NOT_FOUND', 'No complaint found matching this tracking code.', 404);
    }

    const doc = snapshot.docs[0];
    return NextResponse.json({ id: doc.id, trackingCode: code }, { status: 200 });
  } catch (err) {
    console.error('Track lookup error:', err);
    return createErrorResponse('SERVER_ERROR', 'Failed to search tracking code.', 500);
  }
}
