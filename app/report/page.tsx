'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { COMPLAINT_CATEGORIES, CATEGORY_LABELS } from '@/lib/domain/constants';
import { compressImage, CompressedImageResult } from '@/lib/utils/imageCompression';

interface FormErrors {
  title?: string;
  description?: string;
  address?: string;
  photo?: string;
  general?: string;
}

export default function ReportPage(): JSX.Element {
  const router = useRouter();
  const { getIdToken } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat?: number; lng?: number }>({});
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const [photo, setPhoto] = useState<CompressedImageResult | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState<boolean>(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Detecting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setLocationStatus(`Location acquired: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        if (!address) {
          setAddress(`Near coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus(`Could not access location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoProcessing(true);
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setStatusMessage('Compressing and removing metadata from photo...');

    try {
      const compressed = await compressImage(file);
      setPhoto(compressed);
      setPhotoPreview(`data:${compressed.mimeType};base64,${compressed.data}`);
      setStatusMessage('Photo processed and ready for secure upload.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Photo processing failed.';
      setErrors((prev) => ({ ...prev, photo: msg }));
      setPhoto(null);
      setPhotoPreview(null);
      setStatusMessage(msg);
    } finally {
      setPhotoProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setErrors((prev) => ({ ...prev, photo: undefined }));
    setStatusMessage('Photo removed.');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (title.trim().length < 5 || title.trim().length > 100) {
      newErrors.title = 'Title must be between 5 and 100 characters.';
    }

    if (description.trim().length < 20 || description.trim().length > 2000) {
      newErrors.description = 'Description must be between 20 and 2000 characters.';
    }

    if (address.trim().length < 3 || address.trim().length > 200) {
      newErrors.address = 'Location address must be between 3 and 200 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setStatusMessage('Please fix the errors indicated above.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Submitting grievance report...');

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication session initializing. Please try again in a moment.');
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        userCategory: category ? category : null,
        location: {
          address: address.trim(),
          ...(coordinates.lat ? { lat: coordinates.lat } : {}),
          ...(coordinates.lng ? { lng: coordinates.lng } : {}),
        },
        photo: photo ? { data: photo.data, mimeType: photo.mimeType } : null,
      };

      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to submit grievance.');
      }

      setStatusMessage('Grievance reported successfully! Redirecting to report tracker...');
      router.push(`/complaints/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrors((prev) => ({ ...prev, general: message }));
      setStatusMessage(`Submission error: ${message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
        Report a Civic Grievance
      </h1>
      <p className="text-slate-600 mb-8">
        Submit details of municipal issues like potholes, streetlights, or waste management.
        Our system will automatically route your report to the appropriate department.
      </p>

      {/* Screen Reader and Accessibility Live Status Region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {errors.general && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium"
        >
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-900 mb-1">
            Issue Title <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={5}
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Deep pothole causing traffic obstruction"
            aria-describedby={errors.title ? 'title-error' : 'title-hint'}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
            } text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600`}
          />
          <p id="title-hint" className="mt-1 text-xs text-slate-500">
            5 to 100 characters. ({title.length}/100)
          </p>
          {errors.title && (
            <p id="title-error" className="mt-1 text-sm font-medium text-red-600" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="">Let AI decide (Recommended)</option>
            {COMPLAINT_CATEGORIES.map((catKey) => (
              <option key={catKey} value={catKey}>
                {CATEGORY_LABELS[catKey]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Leave as &ldquo;Let AI decide&rdquo; if you are unsure of the exact department.
          </p>
        </div>

        {/* Location & Coordinates */}
        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-slate-900 mb-1">
            Location / Address <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="address"
              name="address"
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Corner of 4th Ave and Oak St, Ward 12"
              aria-describedby={errors.address ? 'address-error' : 'location-status'}
              className={`flex-1 px-4 py-2.5 rounded-lg border ${
                errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
              } text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600`}
            />
            <button
              type="button"
              onClick={handleLocationRequest}
              disabled={isLocating}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors disabled:opacity-50"
              aria-label="Use my device location"
            >
              {isLocating ? 'Locating...' : 'Use my location'}
            </button>
          </div>
          {locationStatus && (
            <p id="location-status" className="mt-1 text-xs text-slate-600" role="status">
              {locationStatus}
            </p>
          )}
          {errors.address && (
            <p id="address-error" className="mt-1 text-sm font-medium text-red-600" role="alert">
              {errors.address}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-1">
            Detailed Description <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            minLength={20}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, its severity, and how long it has been present..."
            aria-describedby={errors.description ? 'desc-error' : 'desc-hint'}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
            } text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600`}
          />
          <p id="desc-hint" className="mt-1 text-xs text-slate-500">
            20 to 2000 characters. ({description.length}/2000)
          </p>
          {errors.description && (
            <p id="desc-error" className="mt-1 text-sm font-medium text-red-600" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        {/* Optional Photo Attachment */}
        <div>
          <label htmlFor="photo" className="block text-sm font-semibold text-slate-900 mb-1">
            Photo Evidence (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Photos are automatically compressed (max 1024px, JPEG quality 0.7) and stripped of EXIF/GPS metadata in your browser before upload. Max 600 KB.
          </p>

          {!photoPreview ? (
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              disabled={photoProcessing}
              onChange={handlePhotoChange}
              aria-describedby={errors.photo ? 'photo-error' : undefined}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          ) : (
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Compressed evidence preview"
                className="w-16 h-16 object-cover rounded border border-slate-300"
              />
              <div className="flex-1 text-sm text-slate-700">
                <span className="font-medium text-green-700">Photo compressed and ready</span>
                <p className="text-xs text-slate-500">
                  Approx. {Math.round((photo?.data.length || 0) * 0.75 / 1024)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-sm font-medium text-red-600 hover:text-red-800 underline focus:outline-none"
              >
                Remove
              </button>
            </div>
          )}

          {errors.photo && (
            <p id="photo-error" className="mt-1 text-sm font-medium text-red-600" role="alert">
              {errors.photo}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting || photoProcessing}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-lg font-semibold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition-colors duration-200"
          >
            {isSubmitting ? 'Submitting Grievance...' : 'Submit Grievance Report'}
          </button>
        </div>
      </form>
    </main>
  );
}
