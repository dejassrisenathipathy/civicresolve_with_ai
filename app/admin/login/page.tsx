'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function AdminLoginPage(): JSX.Element {
  const { user, isAdmin, signInAdmin, signOut } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage('Authenticating administrator credentials...');
    setLoading(true);

    try {
      await signInAdmin(email, password);
      setStatusMessage('Signed in successfully as administrator.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
      setStatusMessage(`Login error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setStatusMessage('Signing out...');
    try {
      await signOut();
      setStatusMessage('Signed out. Switched back to citizen session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 sm:py-20 flex flex-col justify-center">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950 mb-2 text-center">
          Municipal Admin Login
        </h1>
        <p className="text-sm text-slate-600 mb-6 text-center">
          Administrative portal for department supervisors and staff.
        </p>

        {/* Accessibility Status Message */}
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

        {isAdmin ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm">
              <p className="font-semibold">Active Admin Session</p>
              <p className="text-xs text-green-700 mt-1">Logged in as {user?.email}</p>
            </div>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            >
              Sign Out from Admin
            </button>

            <Link
              href="/"
              className="block text-sm text-blue-700 hover:underline mt-4"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Municipal Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@municipality.gov"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-slate-900 mb-1"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] px-6 py-2.5 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In as Administrator'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
