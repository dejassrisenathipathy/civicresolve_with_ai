import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Link from 'next/link';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'CivicResolve — AI-Powered Civic Grievance Resolution',
  description: 'Fast, transparent, and AI-assisted reporting and tracking for community issues.',
};

/**
 * Root accessible layout for CivicResolve application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {/* Accessible skip link for keyboard and screen reader navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>

        <AuthProvider>
          <header className="w-full border-b border-slate-200 bg-white">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="text-xl font-bold tracking-tight text-blue-900 hover:text-blue-800">
                CivicResolve
              </Link>
              <nav aria-label="Main Navigation" className="flex items-center gap-4 text-sm font-medium">
                <Link
                  href="/report"
                  className="text-slate-700 hover:text-blue-700 focus:outline-none focus:underline"
                >
                  Report
                </Link>
                <Link
                  href="/admin/login"
                  className="text-slate-600 hover:text-slate-900 focus:outline-none focus:underline"
                >
                  Admin Portal
                </Link>
              </nav>
            </div>
          </header>

          <div id="main-content" className="flex-1 flex flex-col">
            {children}
          </div>

          <footer className="w-full border-t border-slate-200 bg-white py-6">
            <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-600">
              &copy; {new Date().getFullYear()} CivicResolve. All rights reserved.
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
