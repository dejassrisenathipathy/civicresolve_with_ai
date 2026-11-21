import React from 'react';
import Link from 'next/link';

/**
 * CivicResolve Landing Page.
 * Mobile-first and fully accessible adhering to WCAG AA contrast standards.
 */
export default function HomePage(): JSX.Element {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 text-center">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {/* Main Application Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 mb-6">
          CivicResolve
        </h1>

        {/* One-Line Pitch */}
        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl mb-10">
          AI-powered civic grievance reporting and resolution for cleaner, safer communities.
        </p>

        {/* Action Buttons: Mobile-first column, row on tablet/desktop */}
        <div
          className="w-full flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md sm:max-w-none"
          role="group"
          aria-label="Civic grievance actions"
        >
          <Link
            href="/report"
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-lg text-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
            aria-label="Report a new civic issue"
          >
            Report an issue
          </Link>

          <Link
            href="/track"
            className="w-full sm:w-auto inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-lg text-lg font-semibold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 border-2 border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-300 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
            aria-label="Track status of my previously submitted reports"
          >
            Track my reports
          </Link>
        </div>
      </div>
    </main>
  );
}
