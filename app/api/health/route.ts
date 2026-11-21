import { NextResponse } from 'next/server';

/**
 * Health check endpoint for container probes and deployment verification.
 *
 * @returns {NextResponse<{ status: string }>} JSON status confirmation.
 */
export async function GET(): Promise<NextResponse<{ status: string }>> {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
