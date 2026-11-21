'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackPage(): JSX.Element {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = trackingCode.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter a tracking code.');
      return;
    }

    if (!cleanCode.startsWith('CR-')) {
      setError('Tracking code must start with "CR-" followed by 6 alphanumeric characters.');
      return;
    }

    setError(null);
    setLoading(true);
    setStatusMessage('Searching for grievance report...');

    try {
      const res = await fetch(`/api/complaints/track?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Report not found.');
      }

      setStatusMessage('Report located! Redirecting...');
      router.push(`/complaints/${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to locate report.';
      setError(msg);
      setStatusMessage(`Search error: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 sm:py-20 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950 mb-2 text-center">
          Track Your Report
        </h1>
        <p className="text-sm text-slate-600 mb-6 text-center">
          Enter the 9-character tracking code provided upon report submission.
        </p>

        <div role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="tracking-code"
              className="block text-sm font-semibold text-slate-900 mb-1"
            >
              Tracking Code
            </label>
            <input
              id="tracking-code"
              type="text"
              required
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="e.g., CR-A7B8C9"
              maxLength={15}
              className="w-full uppercase font-mono px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Locating Report...' : 'Track Grievance'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/report" className="text-sm text-blue-700 hover:underline">
            Need to report a new issue?
          </Link>
        </div>
      </div>
    </main>
  );
}
