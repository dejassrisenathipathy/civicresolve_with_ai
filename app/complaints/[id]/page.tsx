'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Complaint, Priority } from '@/lib/domain/types';
import { getDepartmentForCategory, CATEGORY_LABELS, ComplaintCategory } from '@/lib/domain/constants';
import { AuthenticatedImage } from '@/components/AuthenticatedImage';
import { useAuth } from '@/components/AuthProvider';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string }
> = {
  reported: {
    label: 'Reported',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '⏳',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: '⚙️',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-green-100 text-green-900 border-green-300',
    icon: '✅',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    icon: '❌',
  },
};

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badgeClass: string; icon: string }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    icon: '🚨',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '⚠️',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: 'ℹ️',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: '🟢',
  },
};

export default function ComplaintDetailsPage(): JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const { user, getIdToken } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reclassifying, setReclassifying] = useState<boolean>(false);
  const [reclassifyStatus, setReclassifyStatus] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    async function loadComplaint() {
      try {
        const res = await fetch(`/api/complaints/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Complaint not found. Please verify the ID or tracking code.');
          } else {
            setError('Failed to fetch complaint details.');
          }
          setLoading(false);
          return;
        }

        const data = await res.json();
        setComplaint(data.complaint);
      } catch {
        setError('Network error while retrieving complaint.');
      } finally {
        setLoading(false);
      }
    }

    loadComplaint();
  }, [id]);

  const handleReclassify = async () => {
    if (!complaint) return;
    setReclassifying(true);
    setReclassifyStatus('Re-running AI analysis with Gemini...');

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication required.');
      }

      const res = await fetch(`/api/complaints/${complaint.id}/reclassify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to re-run AI triage.');
      }

      setComplaint((prev) => (prev ? { ...prev, ai: data.ai } : null));
      setReclassifyStatus('AI analysis successfully updated!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Re-analysis failed.';
      setReclassifyStatus(`Error: ${msg}`);
    } finally {
      setReclassifying(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 text-lg" role="status">
          Loading grievance report details...
        </p>
      </main>
    );
  }

  if (error || !complaint) {
    return (
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div role="alert" className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <h1 className="text-xl font-bold mb-2">Error Loading Report</h1>
          <p className="mb-4">{error || 'Unable to display grievance.'}</p>
          <Link
            href="/report"
            className="inline-block px-4 py-2 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800"
          >
            Submit a New Report
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = user && complaint.reporterUid === user.uid;
  const statusMeta = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.reported;
  const userCatLabel = complaint.userCategory
    ? CATEGORY_LABELS[complaint.userCategory as ComplaintCategory]
    : 'Let AI decide';
  const assignedDepartment = complaint.userCategory
    ? getDepartmentForCategory(complaint.userCategory)
    : complaint.ai?.department || 'Awaiting Routing';

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Tracking Code
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-wide font-mono">
              {complaint.trackingCode}
            </div>
          </div>

          <div>
            {/* Status with icon and text to ensure not color-only (AGENTS.md Rule 6) */}
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border ${statusMeta.badgeClass}`}
            >
              <span aria-hidden="true">{statusMeta.icon}</span>
              <span>Status: {statusMeta.label}</span>
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="pt-6">
          <h1 className="text-2xl font-bold text-slate-950 mb-3">{complaint.title}</h1>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">
            {complaint.description}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Category Selected</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">{userCatLabel}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Assigned Department</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">{assignedDepartment}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-500">Location</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {complaint.location.address}
                {complaint.location.lat && complaint.location.lng && (
                  <span className="text-xs text-slate-500 block font-normal mt-0.5">
                    Lat: {complaint.location.lat.toFixed(5)}, Lng: {complaint.location.lng.toFixed(5)}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* AI Triage & Analysis Card */}
      {complaint.ai && (
        <div className="bg-white border border-indigo-100 rounded-xl p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">AI Triage Classification</h2>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  complaint.ai.source === 'gemini'
                    ? 'bg-purple-100 text-purple-900 border-purple-200'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {complaint.ai.source === 'gemini' ? '✨ Analysed by Gemini' : '⚙️ Rule-based fallback'}
              </span>
            </div>

            {/* Priority Badge (Icon + Text + Colour per Rule 6) */}
            {complaint.ai.priority && (
              <div>
                {(() => {
                  const pMeta = PRIORITY_CONFIG[complaint.ai.priority] || PRIORITY_CONFIG.medium;
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${pMeta.badgeClass}`}
                    >
                      <span aria-hidden="true">{pMeta.icon}</span>
                      <span>Priority: {pMeta.label} ({complaint.ai.priorityScore}/100)</span>
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-slate-500 block">Classified Category</span>
                <span className="font-semibold text-slate-900">
                  {CATEGORY_LABELS[complaint.ai.category as ComplaintCategory] || complaint.ai.category}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500 block">Routed Department</span>
                <span className="font-semibold text-slate-900">{complaint.ai.department}</span>
              </div>
              <div>
                <span className="font-medium text-slate-500 block">Confidence</span>
                <span className="font-semibold text-slate-900">
                  {Math.round(complaint.ai.confidence * 100)}%
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500 block">Safety Risk Detected</span>
                <span className={`font-semibold ${complaint.ai.safetyRisk ? 'text-red-700' : 'text-slate-900'}`}>
                  {complaint.ai.safetyRisk ? 'Yes — High safety hazard' : 'No immediate life safety risk'}
                </span>
              </div>
            </div>

            {complaint.ai.summary && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider mb-1">
                  Summary
                </span>
                <p className="text-slate-700 text-sm">{complaint.ai.summary}</p>
              </div>
            )}

            {complaint.ai.reasoning && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider mb-1">
                  Reasoning
                </span>
                <p className="text-slate-700 text-sm">{complaint.ai.reasoning}</p>
              </div>
            )}
          </div>

          {/* Re-run AI analysis button for the complaint owner */}
          {isOwner && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReclassify}
                disabled={reclassifying}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors disabled:opacity-50"
              >
                {reclassifying ? 'Running AI Analysis...' : 'Re-run AI analysis'}
              </button>
              {reclassifyStatus && (
                <span className="text-xs text-slate-600 font-medium" role="status">
                  {reclassifyStatus}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photo Attachment Card */}
      {complaint.hasImage && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-950 mb-4">Photo Evidence</h2>
          <AuthenticatedImage
            complaintId={complaint.id}
            alt={`Evidence for grievance ${complaint.trackingCode}`}
          />
        </div>
      )}

      {/* Status History Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-slate-950 mb-4">Grievance Timeline</h2>
        <ol className="relative border-l border-slate-300 ml-3 space-y-6">
          {complaint.statusHistory.map((item, idx) => {
            const historyMeta = STATUS_CONFIG[item.status] || STATUS_CONFIG.reported;
            return (
              <li key={idx} className="ml-6">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full ring-4 ring-white text-xs">
                  {historyMeta.icon}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Status updated to {historyMeta.label}
                  </h3>
                  <time className="text-xs text-slate-500">
                    {new Date(item.at).toLocaleString()}
                  </time>
                </div>
                {item.note && (
                  <p className="text-sm text-slate-600 mt-1">{item.note}</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Link
          href="/report"
          className="w-full sm:w-auto text-center px-6 py-2.5 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          Report Another Grievance
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto text-center px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
}
