export type ProviderType = 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
export type VerificationStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type AllowedPropertyType = 'HOTEL' | 'MOTEL' | 'RESORT' | 'INN';
export type LegacyPropertyType = 'BED_AND_BREAKFAST' | 'HOSTEL' | 'APARTMENT' | 'VILLA';
export type PropertyType = AllowedPropertyType | LegacyPropertyType;

export interface ProviderProfile {
  id: string;
  providerType: ProviderType;
  businessName?: string | null;
  verificationStatus: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  rejectionReason?: string | null;
  onboarding?: {
    currentStep?: number;
    completedSteps?: number[];
    submittedAt?: string | null;
    reviewedAt?: string | null;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  role: 'TRAVELER' | 'ADMIN';
  profiles?: ProviderProfile[];
}

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
  requestId?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100';

function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Avoid double "/v1" when API_BASE_URL already includes it
  if (base.endsWith('/v1') && normalizedPath.startsWith('/v1/')) {
    return base + normalizedPath.substring('/v1'.length);
  }

  return base + normalizedPath;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

function getIdempotencyKey(): string {
  // Generate a stable idempotency key for mutating requests
  try {
    const g: any = globalThis as any;
    if (g?.crypto && typeof g.crypto.randomUUID === 'function') {
      return g.crypto.randomUUID();
    }
  } catch {
    // ignore and fallback
  }
  return `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeHeaders(extra?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!extra) return out;
  if (extra instanceof Headers) {
    for (const [k, v] of extra.entries()) {
      out[k] = String(v);
    }
  } else if (Array.isArray(extra)) {
    for (const [k, v] of extra) {
      out[k] = String(v);
    }
  } else {
    Object.entries(extra as Record<string, string>).forEach(([k, v]) => {
      out[k] = String(v);
    });
  }
  return out;
}

function buildHeaders(extra?: HeadersInit, method?: string): HeadersInit {
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }

  const headers: Record<string, string> = { ...base, ...normalizeHeaders(extra) };

  // Add Idempotency-Key for mutating requests if not already provided
  const m = (method || 'GET').toUpperCase();
  const isMutating = m === 'POST' || m === 'PATCH' || m === 'PUT' || m === 'DELETE';
  const hasIdempotency = Object.keys(headers).some((k) => k.toLowerCase() === 'idempotency-key');
  if (isMutating && !hasIdempotency) {
    headers['Idempotency-Key'] = getIdempotencyKey();
  }

  return headers;
}

export async function apiFetch<T>(
  path: string,
  opts?: { method?: string; body?: unknown; headers?: HeadersInit },
): Promise<T> {
  const url = buildApiUrl(path);

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts?.method || 'GET',
      headers: buildHeaders(opts?.headers, opts?.method),
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    const original = err instanceof Error ? err.message : String(err);
    const error: ApiError = new Error(`Network error calling ${url}: ${original}`);
    throw error;
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data: unknown = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Request failed';
    const error: ApiError = new Error(message);
    error.status = res.status;
    error.details = data;
    // Extract requestId from error response for support/debugging
    // Try JSON body first, then fall back to response header
    if (typeof data === 'object' && data && 'requestId' in data) {
      error.requestId = (data as { requestId: unknown }).requestId as string | undefined;
    } else {
      const headerRequestId = res.headers.get('x-request-id');
      if (headerRequestId) {
        error.requestId = headerRequestId;
      }
    }
    throw error;
  }

  return data as T;
}

export async function getAuthMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/v1/auth/me');
}

export interface StartOtpPayload {
  channel: 'phone' | 'email';
  phone?: string;
  email?: string;
  purpose: 'login';
}

export interface StartOtpResponse {
  status: string;
  channel: 'phone' | 'email';
  target: string;
  code: string; // Returned in development mode for testing
}

export async function startOtp(payload: StartOtpPayload): Promise<StartOtpResponse> {
  return apiFetch<StartOtpResponse>('/v1/auth/start', { method: 'POST', body: payload });
}

export interface VerifyOtpPayload {
  channel: 'phone' | 'email';
  phone?: string;
  email?: string;
  code: string;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<Tokens> {
  return apiFetch<Tokens>('/v1/auth/verify', { method: 'POST', body: payload });
}

export interface ListingSummary {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
}

export async function listStays(status?: string): Promise<ListingSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<ListingSummary[]>(`/v1/stays${query}`);
}

export interface HotelPackageTemplate {
  id: string;
  name: string;
}

export async function getHotelPackageTemplates(): Promise<{ items: HotelPackageTemplate[] }> {
  return apiFetch<{ items: HotelPackageTemplate[] }>('/v1/hotel-packages/templates');
}

export interface HotelPackage {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  templateId?: string;
  listingId?: string;
  pricePerPerson?: number;
  availabilityRule?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HotelPackagesListResponse {
  items: HotelPackage[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listHotelPackages(params?: {
  status?: string;
  providerId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<HotelPackagesListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.providerId) queryParams.append('providerId', params.providerId);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
  if (params?.search) queryParams.append('search', params.search);
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiFetch<HotelPackagesListResponse>(`/v1/hotel-packages${query}`);
}

export async function getHotelPackage(id: string): Promise<HotelPackage> {
  return apiFetch<HotelPackage>(`/v1/hotel-packages/${id}`);
}

export async function listTourPackages(status?: string): Promise<ListingSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<ListingSummary[]>(`/v1/tour-packages${query}`);
}

export interface CreateHotelPackagePayload {
  templateId: string;
  listingId: string;
  name: string;
  description: string;
  pricePerPerson: number;
  availabilityRule: 'WEEKEND_ONLY' | 'SEASONAL' | 'FLEXIBLE';
  inclusions?: string[];
  exclusions?: string[];
  amenityIds?: string[];
}

export interface UpdateHotelPackagePayload {
  templateId?: string;
  name?: string;
  description?: string;
  pricePerPerson?: number;
  availabilityRule?: 'WEEKEND_ONLY' | 'SEASONAL' | 'FLEXIBLE';
  inclusions?: string[];
  exclusions?: string[];
  amenityIds?: string[];
}

export async function createHotelPackage(providerId: string, payload: CreateHotelPackagePayload) {
  return apiFetch<{ id: string }>(`/v1/hotel-packages/${providerId}/packages`, {
    method: 'POST',
    body: payload,
  });
}

export async function updateHotelPackage(
  providerId: string,
  packageId: string,
  payload: UpdateHotelPackagePayload,
) {
  return apiFetch<HotelPackage>(`/v1/hotel-packages/${providerId}/packages/${packageId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteHotelPackage(providerId: string, packageId: string) {
  return apiFetch(`/v1/hotel-packages/${providerId}/packages/${packageId}`, { method: 'DELETE' });
}

export async function mutateHotelPackageStatus(
  providerId: string,
  packageId: string,
  action: 'publish' | 'pause' | 'archive',
) {
  return apiFetch(`/v1/hotel-packages/${providerId}/packages/${packageId}/${action}`, {
    method: 'POST',
  });
}

export async function createTourStep1(providerId: string, tripType: string) {
  return apiFetch<{ id: string }>(`/v1/tour-packages/${providerId}/packages/step1`, {
    method: 'POST',
    body: { tripType },
  });
}

export interface TourBasicsPayload {
  name: string;
  description: string;
  duration: number;
  basePrice: number;
  maxSeats: number;
}

export async function updateTourBasics(
  providerId: string,
  packageId: string,
  payload: TourBasicsPayload,
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step2-basics`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function updateTourDepartures(
  providerId: string,
  packageId: string,
  departures: string[],
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step3-departures`, {
    method: 'PUT',
    body: { departures },
  });
}

export async function updateTourPickups(providerId: string, packageId: string, pickups: string[]) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step4-pickups`, {
    method: 'PUT',
    body: { pickups },
  });
}

export async function updateTourHighlights(
  providerId: string,
  packageId: string,
  highlights: string[],
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step5-highlights`, {
    method: 'PATCH',
    body: { highlights },
  });
}

export async function updateTourItinerary(
  providerId: string,
  packageId: string,
  itinerary: { day: number; title: string; description: string }[],
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step6-itinerary`, {
    method: 'PUT',
    body: { itinerary },
  });
}

export async function updateTourInclusions(
  providerId: string,
  packageId: string,
  inclusions: string[],
  exclusions: string[],
) {
  return apiFetch(
    `/v1/tour-packages/${providerId}/packages/${packageId}/step7-inclusions-exclusions`,
    {
      method: 'PATCH',
      body: { inclusions, exclusions },
    },
  );
}

export async function updateTourAmenities(
  providerId: string,
  packageId: string,
  amenityIds: string[],
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/step8-amenities`, {
    method: 'PATCH',
    body: { amenityIds },
  });
}

export interface UpdateOperatorProfilePayload {
  baseCity?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  meetingPoint?: string;
  contactPhone?: string;
}

export async function updateOperatorProfile(
  providerId: string,
  payload: UpdateOperatorProfilePayload,
) {
  return apiFetch(`/v1/operator-profile/${providerId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function getOperatorProfile(providerId: string) {
  return apiFetch(`/v1/operator-profile/${providerId}`, { method: 'GET' });
}

export async function mutateTourStatus(
  providerId: string,
  packageId: string,
  action: 'publish' | 'pause' | 'archive',
) {
  return apiFetch(`/v1/tour-packages/${providerId}/packages/${packageId}/${action}`, {
    method: 'POST',
  });
}

export interface StartOnboardingPayload {
  providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
}

export async function startProviderOnboarding(payload: StartOnboardingPayload) {
  return apiFetch<{ onboardingId: string; providerId: string }>(`/v1/provider-onboarding/start`, {
    method: 'POST',
    body: payload,
  });
}

export interface OnboardingStatus {
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  progress: number;
  canSubmit: boolean;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  onboardingData?: Record<string, unknown>;
}

export async function getProviderOnboardingStatus(providerId: string): Promise<OnboardingStatus> {
  return apiFetch<OnboardingStatus>(`/v1/provider-onboarding/${providerId}/status`);
}

export interface HotelStep2BasicsPayload {
  hotelName: string;
  propertyType: AllowedPropertyType;
  starRating: number;
  description: string;
  contactEmail: string;
  contactPhone: string;
}

export interface HotelStep3LocationPayload {
  streetAddress: string;
  city: string;
  stateProvince: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface RoomTypePayload {
  name: string;
  capacity: number;
  bedConfig: string;
  basePrice: number;
  totalUnits: number;
}

export interface HotelStep4RoomsPayload {
  rooms: RoomTypePayload[];
}

export interface HotelStep5AmenitiesPayload {
  amenities: string[];
}

export interface HotelStep6PoliciesPayload {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE';
  paymentTerms: 'FULL_AT_BOOKING' | 'DEPOSIT_PLUS_BALANCE' | 'PAY_AT_ARRIVAL';
  houseRules?: string;
  ageRestrictions?: string;
}

export interface HotelStep7ReviewPayload {
  acceptTerms: boolean;
  marketingOptIn: boolean;
}

export async function hotelStep2Basics(providerId: string, payload: HotelStep2BasicsPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-2-basics`, {
    method: 'POST',
    body: payload,
  });
}

export async function hotelStep3Location(providerId: string, payload: HotelStep3LocationPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-3-location`, {
    method: 'POST',
    body: payload,
  });
}

export async function hotelStep4Rooms(providerId: string, payload: HotelStep4RoomsPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-4-rooms`, {
    method: 'POST',
    body: payload,
  });
}

export async function hotelStep5Amenities(providerId: string, payload: HotelStep5AmenitiesPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-5-amenities`, {
    method: 'POST',
    body: payload,
  });
}

export async function hotelStep6Policies(providerId: string, payload: HotelStep6PoliciesPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-6-policies`, {
    method: 'POST',
    body: payload,
  });
}

export async function hotelStep7Review(providerId: string, payload: HotelStep7ReviewPayload) {
  return apiFetch(`/v1/provider-onboarding/${providerId}/hotel/step-7-review`, {
    method: 'POST',
    body: payload,
  });
}

export async function submitProviderOnboarding(providerType: ProviderType) {
  return apiFetch<{ status: VerificationStatus; submittedAt?: string | null }>(
    `/v1/provider-onboarding/${providerType}/submit`,
    {
      method: 'POST',
    },
  );
}

export interface PropertySnapshot {
  property: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    description?: string;
  };
  rooms: Array<{
    id: string;
    name: string;
    capacity: number;
    bedConfig: string;
    basePrice: number;
    totalUnits: number;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    category?: string;
  }>;
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
    paymentTerms?: string;
  };
  media?: unknown;
}

export async function getPropertySnapshot(listingId: string): Promise<PropertySnapshot> {
  return apiFetch<PropertySnapshot>(`/v1/host/properties/${listingId}/snapshot`);
}

export interface ProviderReviewItem extends ProviderProfile {
  user?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  onboarding?: {
    currentStep?: number;
    progress?: number;
    submittedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
  } | null;
}

export async function getProviderReviewQueue(
  status?: 'UNDER_REVIEW' | 'SUBMITTED' | 'REJECTED' | 'APPROVED',
) {
  const params = status ? `?status=${status}` : '';
  return apiFetch<{ providers: ProviderReviewItem[]; count: number }>(
    `/v1/admin/providers/review-queue${params}`,
  );
}

export async function approveProvider(providerId: string) {
  return apiFetch(`/v1/admin/providers/${providerId}/approve`, { method: 'POST' });
}

export async function rejectProvider(providerId: string, reason: string) {
  return apiFetch(`/v1/admin/providers/${providerId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}
