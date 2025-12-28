export enum ListingType {
  STAY = 'STAY',
  HOTEL_PACKAGE = 'HOTEL_PACKAGE',
  TOUR_PACKAGE = 'TOUR_PACKAGE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId: string;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: 'ok' | 'ready' | 'error';
  timestamp: string;
  uptime?: number;
  service?: string;
  version?: string;
  checks?: {
    database: string;
    redis: string;
    meilisearch: string;
  };
}
// Shared types for TripAvail platform
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  GUEST = 'GUEST',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

export enum BookingStatus {
  QUOTE = 'QUOTE',
  HOLD = 'HOLD',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  EXPIRED_HOLD = 'EXPIRED_HOLD',
  CANCELLED_BY_GUEST = 'CANCELLED_BY_GUEST',
  CANCELLED_BY_PROVIDER = 'CANCELLED_BY_PROVIDER',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

// Health types shared between backend and frontend
export interface HealthStatus {
  status: 'ok' | 'ready';
  timestamp: string;
  uptime?: number;
  service?: string;
  version?: string;
  checks?: {
    database: string;
    redis: string;
    meilisearch: string;
  };
}
