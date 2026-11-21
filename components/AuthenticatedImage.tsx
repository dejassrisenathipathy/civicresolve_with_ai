'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';

interface AuthenticatedImageProps {
  complaintId: string;
  alt: string;
  className?: string;
}

export function AuthenticatedImage({
  complaintId,
  alt,
  className = '',
}: AuthenticatedImageProps): JSX.Element {
  const { getIdToken } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    let objectUrlToRevoke: string | null = null;

    async function fetchImage() {
      try {
        const token = await getIdToken();
        if (!token) {
          setError('Authentication required to view this photo.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/complaints/${complaintId}/image`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 403) {
            setError('Access restricted to complaint owner or municipal administrators.');
          } else if (res.status === 404) {
            setError('No photo attached to this complaint.');
          } else {
            setError('Failed to load image.');
          }
          setLoading(false);
          return;
        }

        const blob = await res.blob();
        if (active) {
          objectUrlToRevoke = URL.createObjectURL(blob);
          setImageUrl(objectUrlToRevoke);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError('Network error while loading image.');
          setLoading(false);
        }
      }
    }

    fetchImage();

    return () => {
      active = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [complaintId, getIdToken]);

  if (loading) {
    return (
      <div className={`p-6 bg-slate-100 rounded-lg text-slate-500 text-sm text-center ${className}`}>
        Loading secure photo evidence...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (!imageUrl) {
    return <></>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className={`rounded-lg border border-slate-200 max-h-96 object-contain ${className}`}
    />
  );
}
