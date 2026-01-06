'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  HotelStep2BasicsPayload,
  HotelStep3LocationPayload,
  HotelStep4RoomsPayload,
  HotelStep5AmenitiesPayload,
  HotelStep6PoliciesPayload,
  HotelStep7ReviewPayload,
  hotelStep2Basics,
  hotelStep3Location,
  hotelStep4Rooms,
  hotelStep5Amenities,
  hotelStep6Policies,
  hotelStep7Review,
  startProviderOnboarding,
  getProviderOnboardingStatus,
  OnboardingStatus,
  submitProviderOnboarding,
  AllowedPropertyType,
} from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

const STEPS = [
  { num: 1, name: 'Welcome', description: 'Get started' },
  { num: 2, name: 'Basics', description: 'Property details' },
  { num: 3, name: 'Location', description: 'Address & coordinates' },
  { num: 4, name: 'Rooms', description: 'Room types & pricing' },
  { num: 5, name: 'Amenities', description: 'Property features' },
  { num: 6, name: 'Policies', description: 'Check-in, cancellation' },
  { num: 7, name: 'Review', description: 'Final submission' },
];

const ALLOWED_PROPERTY_TYPES: { value: AllowedPropertyType; label: string }[] = [
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'MOTEL', label: 'Motel' },
  { value: 'RESORT', label: 'Resort' },
  { value: 'INN', label: 'Inn' },
];

const LEGACY_PROPERTY_LABELS: Record<string, string> = {
  BED_AND_BREAKFAST: 'Bed & Breakfast (legacy)',
  HOSTEL: 'Hostel (legacy)',
  APARTMENT: 'Apartment (legacy)',
  VILLA: 'Villa (legacy)',
};

// Force dynamic rendering - page requires authentication
export const dynamic = 'force-dynamic';

export default function HostOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<{ onboardingId?: string; providerId?: string } | null>(null);
  const [providerId, setProviderId] = useState('');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [currentViewStep, setCurrentViewStep] = useState(1); // Start at Step 1 (Welcome)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [legacyPropertyType, setLegacyPropertyType] = useState<string | null>(null);

  const hotelProfile = user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER');
  
  console.log('[HostOnboarding] user:', user);
  console.log('[HostOnboarding] hotelProfile:', hotelProfile);
  console.log('[HostOnboarding] currentViewStep:', currentViewStep);

  // Auth protection: redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[HostOnboarding] No user found, redirecting to login');
      router.push('/auth/login?redirect=/host/onboarding');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (hotelProfile) {
      console.log('[HostOnboarding] Found hotel profile, loading status');
      setProviderId(hotelProfile.id);
      loadOnboardingStatus(hotelProfile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelProfile?.id]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Will redirect if no user
  if (!user) {
    return null;
  }

  const loadOnboardingStatus = async (pid: string) => {
    try {
      const status = await getProviderOnboardingStatus(pid);
      setOnboardingStatus(status);
      if (status.currentStep > 0) {
        setCurrentViewStep(Math.max(2, status.currentStep));
      }
      // Prefill form data from onboarding status
      if (status.onboardingData) {
        prefillFromStatus(status.onboardingData);
      }
    } catch (err) {
      console.error('Failed to load onboarding status:', err);
    }
  };

  const prefillFromStatus = (data: Record<string, unknown>) => {
    if (data.step2_basics) {
      const step2Data = data.step2_basics as Partial<HotelStep2BasicsPayload>;
      const incomingType = (step2Data.propertyType as string | undefined) || null;
      const isAllowed = incomingType
        ? ALLOWED_PROPERTY_TYPES.some((t) => t.value === incomingType)
        : false;

      if (incomingType && !isAllowed && LEGACY_PROPERTY_LABELS[incomingType]) {
        setLegacyPropertyType(incomingType);
        setStep2((s) => ({ ...s, ...step2Data, propertyType: s.propertyType }));
      } else {
        setLegacyPropertyType(null);
        setStep2((s) => ({
          ...s,
          ...step2Data,
          propertyType: (incomingType && isAllowed
            ? (incomingType as AllowedPropertyType)
            : s.propertyType),
        }));
      }
    }
    if (data.step3_location) {
      const step3Data = data.step3_location as Partial<HotelStep3LocationPayload>;
      setStep3((s) => ({ ...s, ...step3Data }));
    }
    if (data.step4_rooms) {
      const step4Data = data.step4_rooms as Partial<HotelStep4RoomsPayload>;
      setStep4((s) => ({ ...s, ...step4Data }));
    }
    if (data.step5_amenities) {
      const step5Data = data.step5_amenities as Partial<HotelStep5AmenitiesPayload>;
      setStep5((s) => ({ ...s, ...step5Data }));
    }
    if (data.step6_policies) {
      const step6Data = data.step6_policies as Partial<HotelStep6PoliciesPayload>;
      setStep6((s) => ({ ...s, ...step6Data }));
    }
  };

  const [step2, setStep2] = useState<HotelStep2BasicsPayload>({
    hotelName: '',
    propertyType: 'HOTEL',
    starRating: 0,
    description: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [step3, setStep3] = useState<HotelStep3LocationPayload>({
    streetAddress: '',
    city: '',
    stateProvince: '',
    country: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
  });

  const [step4, setStep4] = useState<HotelStep4RoomsPayload>({
    rooms: [
      {
        name: '',
        capacity: 2,
        bedConfig: '',
        basePrice: 0,
        totalUnits: 1,
      },
    ],
  });

  const [step5, setStep5] = useState<HotelStep5AmenitiesPayload>({ amenities: [] });

  const [step6, setStep6] = useState<HotelStep6PoliciesPayload>({
    checkInTime: '15:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    paymentTerms: 'FULL_AT_BOOKING',
    houseRules: '',
    ageRestrictions: '',
  });

  const [step7, setStep7] = useState<HotelStep7ReviewPayload>({ acceptTerms: false, marketingOptIn: false });

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Backend may return either { providerId } or { profile: { id } }
      const res: any = await startProviderOnboarding({ providerType: 'HOTEL_MANAGER' });
      setResult(res);

      const providerIdFromResponse = res?.providerId || res?.profile?.id;
      if (providerIdFromResponse) {
        setProviderId(providerIdFromResponse);
        await loadOnboardingStatus(providerIdFromResponse);
      }

      setSuccess('Onboarding started successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start onboarding';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const ensureProvider = () => providerId || result?.providerId || '';

  const validateStep = (stepNum: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (stepNum === 2) {
      if (!step2.hotelName.trim()) errors.hotelName = 'Hotel name is required';
      if (!step2.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step2.contactEmail)) {
        errors.contactEmail = 'Valid email is required';
      }
      if (!step2.contactPhone.trim()) errors.contactPhone = 'Contact phone is required';
      if (step2.starRating < 1 || step2.starRating > 5) errors.starRating = 'Star rating must be 1-5';
    }
    
    if (stepNum === 3) {
      if (!step3.streetAddress.trim()) errors.streetAddress = 'Street address is required';
      if (!step3.city.trim()) errors.city = 'City is required';
      if (!step3.country.trim()) errors.country = 'Country is required';
    }
    
    if (stepNum === 4) {
      if (step4.rooms.length === 0) errors.rooms = 'At least one room is required';
      step4.rooms.forEach((room, idx) => {
        if (!room.name.trim()) errors[`room_${idx}_name`] = 'Room name is required';
        if (room.capacity < 1) errors[`room_${idx}_capacity`] = 'Capacity must be at least 1';
        if (room.basePrice < 0) errors[`room_${idx}_price`] = 'Price must be positive';
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runStep = async (stepName: string, stepNum: number, fn: () => Promise<unknown>) => {
    if (!validateStep(stepNum)) {
      setError('Please fix validation errors before saving');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await fn();
      setSuccess(`${stepName} saved successfully!`);
      await loadOnboardingStatus(ensureProvider());
      if (stepNum < 7) {
        setCurrentViewStep(stepNum + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `${stepName} failed`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitForReview = async () => {
    const pid = ensureProvider();
    if (!pid) return setError('Start onboarding to generate a provider id.');
    if (!onboardingStatus?.canSubmit) {
      setError('Complete all required steps before submitting for review.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await submitProviderOnboarding('HOTEL_MANAGER');
      setSuccess('Submitted for review. We will notify you once reviewed.');
      await loadOnboardingStatus(pid);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    runStep('Step 2', 2, () => hotelStep2Basics(pid, step2));
  };

  const submitStep3 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    runStep('Step 3', 3, () => hotelStep3Location(pid, step3));
  };

  const submitStep4 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    runStep('Step 4', 4, () => hotelStep4Rooms(pid, step4));
  };

  const submitStep5 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    runStep('Step 5', 5, () => hotelStep5Amenities(pid, step5));
  };

  const submitStep6 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    runStep('Step 6', 6, () => hotelStep6Policies(pid, step6));
  };

  const submitStep7 = (event: FormEvent) => {
    event.preventDefault();
    const pid = ensureProvider();
    if (!pid) return setError('Set providerId first.');
    if (!step7.acceptTerms) {
      setError('You must accept the terms to continue');
      return;
    }
    runStep('Step 7', 7, () => hotelStep7Review(pid, step7));
  };

  const completedSteps = onboardingStatus?.completedSteps || [];
  const progress = onboardingStatus?.progress || 0;
  const verificationStatus =
    onboardingStatus?.verificationStatus || hotelProfile?.verificationStatus || 'NOT_STARTED';
  const rejectionReason = onboardingStatus?.rejectionReason || hotelProfile?.rejectionReason;
  const submitLocked = verificationStatus === 'UNDER_REVIEW' || verificationStatus === 'APPROVED';
  const canSubmitForReview = onboardingStatus?.canSubmit && !submitLocked;
  const canResubmit = verificationStatus === 'REJECTED' && onboardingStatus?.canSubmit;

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Hotel Onboarding</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Complete all 7 steps to register your property. Progress: {progress}%
          </p>
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.num);
            const isCurrent = currentViewStep === step.num;
            const isAccessible = idx === 0 || completedSteps.includes(step.num - 1) || currentViewStep === step.num;
            
            return (
              <div key={step.num} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => isAccessible && setCurrentViewStep(step.num)}
                  className={`flex flex-col items-center gap-2 flex-1 ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={!isAccessible}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-black text-white'
                          : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step.num}
                  </div>
                  <div className="text-xs text-center">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-neutral-500">{step.description}</div>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      completedSteps.includes(step.num) ? 'bg-green-500' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800 text-sm">{success}</div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase text-neutral-500">Verification status</div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  verificationStatus === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : verificationStatus === 'UNDER_REVIEW'
                      ? 'bg-amber-100 text-amber-800'
                      : verificationStatus === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {verificationStatus}
              </span>
              {onboardingStatus?.submittedAt && (
                <span className="text-xs text-neutral-600">
                  Submitted {new Date(onboardingStatus.submittedAt).toLocaleString()}
                </span>
              )}
            </div>
            {rejectionReason && (
              <p className="mt-1 text-sm text-red-700">Rejection reason: {rejectionReason}</p>
            )}
            {verificationStatus === 'UNDER_REVIEW' && (
              <p className="mt-1 text-xs text-neutral-600">
                You can keep editing drafts. Publishing remains blocked until approval.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {canResubmit && (
              <button
                onClick={submitForReview}
                disabled={loading}
                className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Resubmit'}
              </button>
            )}
            {canSubmitForReview && (
              <button
                onClick={submitForReview}
                disabled={loading}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Step */}
      {currentViewStep === 1 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Welcome to Hotel Onboarding</h2>
          <p className="text-sm text-neutral-600 mb-4">
            This process will guide you through 7 steps to register your property and start accepting bookings.
          </p>
          {!hotelProfile && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Onboarding'}
            </button>
          )}
          {hotelProfile && (
            <div className="text-sm text-neutral-700">
              <p>Provider ID: {hotelProfile.id}</p>
              {onboardingStatus && (
                <p className="mt-2">
                  Current progress: {completedSteps.length} of {onboardingStatus.totalSteps} steps completed
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step Forms */}
      {currentViewStep === 2 && (
        <form onSubmit={submitStep2} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 2: Basics</h2>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
              disabled={loading || !providerId}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                className={`w-full rounded border px-3 py-2 ${validationErrors.hotelName ? 'border-red-500' : ''}`}
                placeholder="Hotel name *"
                value={step2.hotelName}
                onChange={(e) => {
                  setStep2((s) => ({ ...s, hotelName: e.target.value }));
                  if (validationErrors.hotelName) setValidationErrors((e) => ({ ...e, hotelName: '' }));
                }}
                required
              />
              {validationErrors.hotelName && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.hotelName}</p>
              )}
            </div>
            <select
              className="rounded border px-3 py-2"
              value={step2.propertyType}
              onChange={(e) =>
                setStep2((s) => ({ ...s, propertyType: e.target.value as HotelStep2BasicsPayload['propertyType'] }))
              }
            >
              {ALLOWED_PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
              {legacyPropertyType && !ALLOWED_PROPERTY_TYPES.some((t) => t.value === legacyPropertyType) && (
                <option value={legacyPropertyType} disabled>
                  {LEGACY_PROPERTY_LABELS[legacyPropertyType] || `${legacyPropertyType} (legacy)`}
                </option>
              )}
            </select>
            {legacyPropertyType && (
              <p className="text-xs text-amber-700">
                Legacy property type detected ({LEGACY_PROPERTY_LABELS[legacyPropertyType] || legacyPropertyType}).
                Please choose one of the supported types above for new submissions.
              </p>
            )}
            <div>
              <input
                type="number"
                min="1"
                max="5"
                className={`w-full rounded border px-3 py-2 ${validationErrors.starRating ? 'border-red-500' : ''}`}
                placeholder="Star rating (1-5) *"
                value={step2.starRating || ''}
                onChange={(e) => {
                  setStep2((s) => ({ ...s, starRating: Number(e.target.value) }));
                  if (validationErrors.starRating) setValidationErrors((e) => ({ ...e, starRating: '' }));
                }}
                required
              />
              {validationErrors.starRating && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.starRating}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                className={`w-full rounded border px-3 py-2 ${validationErrors.contactEmail ? 'border-red-500' : ''}`}
                placeholder="Contact email *"
                value={step2.contactEmail}
                onChange={(e) => {
                  setStep2((s) => ({ ...s, contactEmail: e.target.value }));
                  if (validationErrors.contactEmail) setValidationErrors((e) => ({ ...e, contactEmail: '' }));
                }}
                required
              />
              {validationErrors.contactEmail && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.contactEmail}</p>
              )}
            </div>
            <div>
              <input
                className={`w-full rounded border px-3 py-2 ${validationErrors.contactPhone ? 'border-red-500' : ''}`}
                placeholder="Contact phone *"
                value={step2.contactPhone}
                onChange={(e) => {
                  setStep2((s) => ({ ...s, contactPhone: e.target.value }));
                  if (validationErrors.contactPhone) setValidationErrors((e) => ({ ...e, contactPhone: '' }));
                }}
                required
              />
              {validationErrors.contactPhone && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.contactPhone}</p>
              )}
            </div>
          </div>
          <textarea
            className="mt-3 w-full rounded border px-3 py-2 text-sm"
            rows={3}
            placeholder="Description *"
            value={step2.description}
            onChange={(e) => setStep2((s) => ({ ...s, description: e.target.value }))}
            required
          />
        </form>
      )}

      {currentViewStep === 3 && (
        <form onSubmit={submitStep3} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 3: Location</h2>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
              disabled={loading || !providerId}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                className={`w-full rounded border px-3 py-2 ${validationErrors.streetAddress ? 'border-red-500' : ''}`}
                placeholder="Street address *"
                value={step3.streetAddress}
                onChange={(e) => {
                  setStep3((s) => ({ ...s, streetAddress: e.target.value }));
                  if (validationErrors.streetAddress) setValidationErrors((e) => ({ ...e, streetAddress: '' }));
                }}
                required
              />
              {validationErrors.streetAddress && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.streetAddress}</p>
              )}
            </div>
            <div>
              <input
                className={`w-full rounded border px-3 py-2 ${validationErrors.city ? 'border-red-500' : ''}`}
                placeholder="City *"
                value={step3.city}
                onChange={(e) => {
                  setStep3((s) => ({ ...s, city: e.target.value }));
                  if (validationErrors.city) setValidationErrors((e) => ({ ...e, city: '' }));
                }}
                required
              />
              {validationErrors.city && <p className="text-xs text-red-600 mt-1">{validationErrors.city}</p>}
            </div>
            <input
              className="rounded border px-3 py-2"
              placeholder="State/Province"
              value={step3.stateProvince}
              onChange={(e) => setStep3((s) => ({ ...s, stateProvince: e.target.value }))}
            />
            <div>
              <input
                className={`w-full rounded border px-3 py-2 ${validationErrors.country ? 'border-red-500' : ''}`}
                placeholder="Country *"
                value={step3.country}
                onChange={(e) => {
                  setStep3((s) => ({ ...s, country: e.target.value }));
                  if (validationErrors.country) setValidationErrors((e) => ({ ...e, country: '' }));
                }}
                required
              />
              {validationErrors.country && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.country}</p>
              )}
            </div>
            <input
              className="rounded border px-3 py-2"
              placeholder="Postal code"
              value={step3.postalCode}
              onChange={(e) => setStep3((s) => ({ ...s, postalCode: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.000001"
                className="rounded border px-3 py-2"
                placeholder="Latitude"
                value={step3.latitude || ''}
                onChange={(e) => setStep3((s) => ({ ...s, latitude: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                step="0.000001"
                className="rounded border px-3 py-2"
                placeholder="Longitude"
                value={step3.longitude || ''}
                onChange={(e) => setStep3((s) => ({ ...s, longitude: Number(e.target.value) }))}
                required
              />
            </div>
          </div>
        </form>
      )}

      {currentViewStep === 4 && (
        <form onSubmit={submitStep4} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 4: Rooms</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setStep4((s) => ({
                    ...s,
                    rooms: [
                      ...s.rooms,
                      { name: '', capacity: 2, bedConfig: '', basePrice: 0, totalUnits: 1 },
                    ],
                  }))
                }
                className="rounded bg-neutral-100 px-3 py-1 text-sm"
              >
                Add Room
              </button>
              <button
                type="submit"
                className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
                disabled={loading || !providerId}
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
          {validationErrors.rooms && (
            <p className="text-xs text-red-600 mb-2">{validationErrors.rooms}</p>
          )}
          <div className="space-y-3">
            {step4.rooms.map((room, idx) => (
              <div key={idx} className="grid gap-3 md:grid-cols-6 border p-3 rounded">
                <input
                  className={`rounded border px-3 py-2 ${validationErrors[`room_${idx}_name`] ? 'border-red-500' : ''}`}
                  placeholder="Room name *"
                  value={room.name}
                  onChange={(e) => {
                    setStep4((s) => ({
                      ...s,
                      rooms: s.rooms.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)),
                    }));
                    if (validationErrors[`room_${idx}_name`]) {
                      setValidationErrors((e) => ({ ...e, [`room_${idx}_name`]: '' }));
                    }
                  }}
                  required
                />
                <input
                  type="number"
                  min="1"
                  className={`rounded border px-3 py-2 ${validationErrors[`room_${idx}_capacity`] ? 'border-red-500' : ''}`}
                  placeholder="Capacity *"
                  value={room.capacity || ''}
                  onChange={(e) => {
                    setStep4((s) => ({
                      ...s,
                      rooms: s.rooms.map((r, i) => (i === idx ? { ...r, capacity: Number(e.target.value) } : r)),
                    }));
                    if (validationErrors[`room_${idx}_capacity`]) {
                      setValidationErrors((e) => ({ ...e, [`room_${idx}_capacity`]: '' }));
                    }
                  }}
                  required
                />
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Bed config *"
                  value={room.bedConfig}
                  onChange={(e) =>
                    setStep4((s) => ({
                      ...s,
                      rooms: s.rooms.map((r, i) => (i === idx ? { ...r, bedConfig: e.target.value } : r)),
                    }))
                  }
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`rounded border px-3 py-2 ${validationErrors[`room_${idx}_price`] ? 'border-red-500' : ''}`}
                  placeholder="Base price *"
                  value={room.basePrice || ''}
                  onChange={(e) => {
                    setStep4((s) => ({
                      ...s,
                      rooms: s.rooms.map((r, i) => (i === idx ? { ...r, basePrice: Number(e.target.value) } : r)),
                    }));
                    if (validationErrors[`room_${idx}_price`]) {
                      setValidationErrors((e) => ({ ...e, [`room_${idx}_price`]: '' }));
                    }
                  }}
                  required
                />
                <input
                  type="number"
                  min="1"
                  className="rounded border px-3 py-2"
                  placeholder="Total units *"
                  value={room.totalUnits || ''}
                  onChange={(e) =>
                    setStep4((s) => ({
                      ...s,
                      rooms: s.rooms.map((r, i) => (i === idx ? { ...r, totalUnits: Number(e.target.value) } : r)),
                    }))
                  }
                  required
                />
                {step4.rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep4((s) => ({ ...s, rooms: s.rooms.filter((_, i) => i !== idx) }))}
                    className="rounded bg-red-100 px-3 py-2 text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>
      )}

      {currentViewStep === 5 && (
        <form onSubmit={submitStep5} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 5: Amenities</h2>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
              disabled={loading || !providerId}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Amenity IDs (comma separated)"
            value={step5.amenities.join(',')}
            onChange={(e) =>
              setStep5({ amenities: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
          />
          <p className="text-xs text-neutral-500 mt-2">Enter amenity IDs separated by commas</p>
        </form>
      )}

      {currentViewStep === 6 && (
        <form onSubmit={submitStep6} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 6: Policies</h2>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
              disabled={loading || !providerId}
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded border px-3 py-2"
              placeholder="Check-in time (HH:mm) *"
              value={step6.checkInTime}
              onChange={(e) => setStep6((s) => ({ ...s, checkInTime: e.target.value }))}
              required
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Check-out time (HH:mm) *"
              value={step6.checkOutTime}
              onChange={(e) => setStep6((s) => ({ ...s, checkOutTime: e.target.value }))}
              required
            />
            <select
              className="rounded border px-3 py-2"
              value={step6.cancellationPolicy}
              onChange={(e) =>
                setStep6((s) => ({
                  ...s,
                  cancellationPolicy: e.target.value as HotelStep6PoliciesPayload['cancellationPolicy'],
                }))
              }
            >
              <option value="FLEXIBLE">Flexible</option>
              <option value="MODERATE">Moderate</option>
              <option value="STRICT">Strict</option>
              <option value="NON_REFUNDABLE">Non-refundable</option>
            </select>
            <select
              className="rounded border px-3 py-2"
              value={step6.paymentTerms}
              onChange={(e) =>
                setStep6((s) => ({
                  ...s,
                  paymentTerms: e.target.value as HotelStep6PoliciesPayload['paymentTerms'],
                }))
              }
            >
              <option value="FULL_AT_BOOKING">Full at booking</option>
              <option value="DEPOSIT_PLUS_BALANCE">Deposit + balance</option>
              <option value="PAY_AT_ARRIVAL">Pay at arrival</option>
            </select>
            <input
              className="rounded border px-3 py-2"
              placeholder="House rules (optional)"
              value={step6.houseRules || ''}
              onChange={(e) => setStep6((s) => ({ ...s, houseRules: e.target.value }))}
            />
            <input
              className="rounded border px-3 py-2"
              placeholder="Age restrictions (optional)"
              value={step6.ageRestrictions || ''}
              onChange={(e) => setStep6((s) => ({ ...s, ageRestrictions: e.target.value }))}
            />
          </div>
        </form>
      )}

      {currentViewStep === 7 && (
        <form onSubmit={submitStep7} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Step 7: Review & Submit</h2>
            <button
              type="submit"
              className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 text-sm"
              disabled={loading || !providerId || !step7.acceptTerms}
            >
              {loading ? 'Saving...' : 'Save review step'}
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={step7.acceptTerms}
                onChange={(e) => setStep7((s) => ({ ...s, acceptTerms: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">I accept the terms and conditions *</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={step7.marketingOptIn}
                onChange={(e) => setStep7((s) => ({ ...s, marketingOptIn: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Opt in to marketing communications</span>
            </label>
          </div>
        </form>
      )}
    </div>
  );
}
