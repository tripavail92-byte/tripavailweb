# TripAvail Next.js Coding Standards

> **Based on:** Actual codebase patterns + Flutter principles translated to Next.js 14  
> **Last Updated:** January 7, 2026  
> **Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS

---

## Table of Contents

1. [Component Patterns](#component-patterns)
2. [State Management](#state-management)
3. [Data Fetching](#data-fetching)
4. [Form Validation](#form-validation)
5. [Responsive Design](#responsive-design)
6. [Navigation](#navigation)
7. [Error Handling](#error-handling)
8. [TypeScript Patterns](#typescript-patterns)
9. [API Integration](#api-integration)
10. [Code Organization](#code-organization)
11. [Checklist for New Components](#checklist-for-new-components)

---

## Component Patterns

### Server Components vs Client Components

```tsx
// DEFAULT: Server Component (no directive)
// Use for: Static content, SEO-critical pages, server-side data fetching
export default function ProductPage() {
  return <div>Static content</div>;
}

// CLIENT COMPONENT: 'use client' directive
// Use when you need:
// - useState, useEffect, useCallback, useMemo
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (window, document, localStorage)
// - Third-party libraries that use browser features
'use client';

import { useState, useEffect } from 'react';

export default function InteractivePage() {
  const [count, setCount] = useState(0);
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Component Structure

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 1. Type definitions at top
interface User {
  id: string;
  name: string;
  email: string;
}

interface MyPageProps {
  userId: string;
  initialData?: User;
}

// 2. Main component with destructured props
export default function MyPage({ userId, initialData }: MyPageProps) {
  // 3. Hooks first (useState, useEffect, useRouter, etc.)
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 4. Effects
  useEffect(() => {
    if (!initialData) {
      loadUser();
    }
  }, [userId]); // ← Always specify dependencies
  
  // 5. Event handlers (use 'handle' prefix)
  const handleSave = async () => {
    try {
      setLoading(true);
      await saveUser(user);
      router.push('/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };
  
  // 6. Helper functions (use underscore for private)
  const _formatUserName = (user: User) => {
    return `${user.name} (${user.email})`;
  };
  
  // 7. Conditional returns (loading, error, empty states)
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  if (!user) {
    return <EmptyState message="No user found" />;
  }
  
  // 8. Main render
  return (
    <div className="space-y-4">
      <h1>{_formatUserName(user)}</h1>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Prop Patterns

```tsx
// Required parameters first, then optional
interface ButtonProps {
  // Required
  label: string;
  onClick: () => void;
  
  // Optional (with defaults)
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Destructure with defaults
export function Button({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  children,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {loading ? <Spinner /> : children || label}
    </button>
  );
}
```

---

## State Management

### useState Patterns

```tsx
// Primitive state
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [isOpen, setIsOpen] = useState(false);

// Object state (use interface)
interface FormData {
  email: string;
  password: string;
}

const [formData, setFormData] = useState<FormData>({
  email: '',
  password: '',
});

// Update object state (immutable)
const handleEmailChange = (email: string) => {
  setFormData(prev => ({ ...prev, email }));
};

// Array state
const [items, setItems] = useState<string[]>([]);

// Add to array
setItems(prev => [...prev, newItem]);

// Remove from array
setItems(prev => prev.filter(item => item !== targetItem));

// Update array item
setItems(prev => prev.map(item => 
  item.id === targetId ? { ...item, name: newName } : item
));
```

### useEffect Cleanup Pattern

```tsx
// CRITICAL: Always cleanup side effects
useEffect(() => {
  // Setup
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal,
      });
      const data = await response.json();
      setData(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
      }
    }
  }
  
  fetchData();
  
  // Cleanup function
  return () => {
    controller.abort(); // Cancel fetch if component unmounts
  };
}, []);

// Timer cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);
  
  return () => clearTimeout(timer);
}, []);

// Event listener cleanup
useEffect(() => {
  const handleResize = () => {
    setWidth(window.innerWidth);
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### useCallback & useMemo

```tsx
// useCallback: Memoize functions to prevent recreating on every render
const handleSubmit = useCallback(async (data: FormData) => {
  try {
    await submitForm(data);
  } catch (err) {
    showError(err);
  }
}, []); // ← Empty deps = function never changes

// With dependencies
const handleFilter = useCallback((query: string) => {
  return items.filter(item => item.name.includes(query));
}, [items]); // ← Recreates when items changes

// useMemo: Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Complex calculation
const stats = useMemo(() => {
  return {
    total: items.length,
    active: items.filter(i => i.active).length,
    average: items.reduce((sum, i) => sum + i.value, 0) / items.length,
  };
}, [items]);
```

### useRef Pattern

```tsx
// DOM reference
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus(); // ← Safe optional chaining
}, []);

return <input ref={inputRef} />;

// Store mutable value (doesn't trigger re-render)
const timerRef = useRef<number | null>(null);

const startTimer = () => {
  timerRef.current = window.setTimeout(() => {
    console.log('Timer fired');
  }, 1000);
};

const stopTimer = () => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};
```

---

## Data Fetching

### Standard Fetch Pattern (Client Component)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getProviders } from '@/lib/api-client';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  
  useEffect(() => {
    fetchProviders();
  }, []);
  
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await getProviders();
      setProviders(data.providers);
      setError(null);
    } catch (err) {
      setError(err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} onRetry={fetchProviders} />;
  }
  
  return <ProvidersList providers={providers} />;
}
```

### Server Component Data Fetching

```tsx
// app/products/page.tsx
// NO 'use client' directive = Server Component

async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    // Revalidate every 60 seconds
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Parallel Data Fetching

```tsx
// Fetch multiple endpoints concurrently
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // Fire all requests in parallel
    const [stats, users, disputes] = await Promise.all([
      getStats(),
      getUsers(),
      getDisputes(),
    ]);
    
    setStats(stats);
    setUsers(users);
    setDisputes(disputes);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

---

## Form Validation

### Basic Validation Pattern

```tsx
// Validation functions return string (error) or null (valid)
function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  
  if (!email.includes('@')) {
    return 'Please enter a valid email address';
  }
  
  if (email.length < 3) {
    return 'Email must be at least 3 characters';
  }
  
  return null; // ← Valid
}

function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) {
    return 'Phone is required';
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return 'Phone must be 10 digits';
  }
  
  return null;
}
```

### Form Component with Validation

```tsx
'use client';

import { useState, FormEvent } from 'react';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      await signup({ email, password });
      // Success
    } catch (err) {
      setErrors({ email: 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          disabled={loading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          disabled={loading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Real-time Validation

```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);

const handleEmailChange = (value: string) => {
  setEmail(value);
  
  // Validate on change
  const error = validateEmail(value);
  setEmailError(error);
};

// Or validate on blur (better UX)
const handleEmailBlur = () => {
  const error = validateEmail(email);
  setEmailError(error);
};

return (
  <input
    value={email}
    onChange={e => setEmail(e.target.value)}
    onBlur={handleEmailBlur}
    className={emailError ? 'border-red-500' : 'border-gray-300'}
  />
);
```

---

## Responsive Design

### Tailwind Responsive Classes

```tsx
// Mobile-first approach
<div className="
  px-4           // 16px padding on mobile
  md:px-8        // 32px on tablets (768px+)
  lg:px-16       // 64px on desktop (1024px+)
  
  text-sm        // Small text on mobile
  md:text-base   // Normal text on tablets
  
  grid
  grid-cols-1    // 1 column on mobile
  md:grid-cols-2 // 2 columns on tablets
  lg:grid-cols-4 // 4 columns on desktop
  
  gap-4          // 16px gap on mobile
  md:gap-6       // 24px gap on tablets
">
  <Card />
  <Card />
  <Card />
</div>
```

### Container Max Width

```tsx
// Always constrain content width for large screens
<div className="max-w-7xl mx-auto px-4">
  {/* Content max 1280px wide, centered, with 16px side padding */}
</div>

// Common max widths:
max-w-sm   // 384px  - Forms, modals
max-w-2xl  // 672px  - Article content
max-w-4xl  // 896px  - Landing pages
max-w-7xl  // 1280px - Dashboard layouts
max-w-full // No limit
```

### Spacing System (Tailwind)

```tsx
// Use 4px base unit (Tailwind's default)
gap-1   // 4px
gap-2   // 8px
gap-3   // 12px
gap-4   // 16px   ← Most common
gap-6   // 24px
gap-8   // 32px
gap-12  // 48px
gap-16  // 64px

// Padding follows same scale
p-4     // 16px padding all sides
px-4    // 16px horizontal padding
py-2    // 8px vertical padding
pt-8    // 32px top padding
```

### Responsive Text

```tsx
<h1 className="
  text-2xl       // 24px on mobile
  md:text-3xl    // 30px on tablets
  lg:text-4xl    // 36px on desktop
  font-bold
  leading-tight
">
  Heading
</h1>

<p className="
  text-sm        // 14px on mobile
  md:text-base   // 16px on tablets
  leading-relaxed
  text-neutral-700
">
  Body text
</p>
```

---

## Navigation

### Next.js App Router Navigation

```tsx
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyComponent() {
  const router = useRouter();
  
  // Method 1: Link component (preferred for static links)
  <Link 
    href="/about" 
    className="text-blue-600 hover:underline"
  >
    About Us
  </Link>
  
  // Method 2: Programmatic navigation
  const handleLogin = async () => {
    await loginUser();
    router.push('/dashboard'); // Navigate forward
  };
  
  // Replace current route (no back button)
  router.replace('/new-path');
  
  // Go back
  router.back();
  
  // Navigate with query params
  router.push('/search?q=hotels&location=goa');
  
  // Refresh current route data
  router.refresh();
}
```

### Dynamic Routes

```tsx
// File: app/listings/[type]/[id]/page.tsx
interface PageProps {
  params: {
    type: string;
    id: string;
  };
  searchParams: {
    date?: string;
    guests?: string;
  };
}

export default function ListingPage({ params, searchParams }: PageProps) {
  const { type, id } = params;
  const { date, guests } = searchParams;
  
  return (
    <div>
      Listing Type: {type}
      Listing ID: {id}
      Date: {date}
      Guests: {guests}
    </div>
  );
}

// Navigate: /listings/hotel-packages/abc123?date=2026-01-10&guests=2
```

### Conditional Navigation Based on Auth

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login');
    }
  }, [user, router]);
  
  if (!user) {
    return null; // Or loading spinner
  }
  
  return <div>Protected content</div>;
}
```

---

## Error Handling

### Loading States

```tsx
// Pattern 1: Inline spinner
if (loading) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading data...</p>
      </div>
    </div>
  );
}

// Pattern 2: Skeleton loader
if (loading) {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
      <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
      <div className="h-8 bg-gray-200 animate-pulse rounded w-3/4"></div>
    </div>
  );
}

// Pattern 3: Loading component
import { LoadingSpinner } from '@/components/LoadingSpinner';

if (loading) {
  return <LoadingSpinner message="Loading providers..." />;
}
```

### Error Display

```tsx
// Pattern 1: ErrorToast component (TripAvail standard)
import { ErrorToast } from '@/app/components/ErrorToast';
import { formatApiError } from '@/lib/error-utils';

const [error, setError] = useState<unknown | null>(null);

return (
  <>
    {error && (
      <ErrorToast
        error={error}
        message={formatApiError(error)}
        onDismiss={() => setError(null)}
      />
    )}
    {/* Rest of content */}
  </>
);

// Pattern 2: Inline error message
if (error) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      <h3 className="text-red-800 font-semibold mb-2">Error</h3>
      <p className="text-red-700">{formatApiError(error)}</p>
      <button
        onClick={retry}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Try-Catch Pattern

```tsx
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await submitData(formData);
    
    // Success handling
    showSuccessMessage('Data saved!');
    router.push('/success');
    
  } catch (err) {
    // Error handling
    console.error('Submit error:', err);
    
    if (err instanceof ApiError) {
      setError(err.message);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError('An unexpected error occurred');
    }
    
  } finally {
    // Always runs (cleanup)
    setLoading(false);
  }
};
```

### Empty States

```tsx
if (!items || items.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <svg className="w-16 h-16 text-gray-400 mb-4">
        {/* Empty state icon */}
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No items found
      </h3>
      <p className="text-gray-600 mb-4">
        Get started by creating your first item.
      </p>
      <button
        onClick={handleCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Create Item
      </button>
    </div>
  );
}
```

---

## TypeScript Patterns

### Type vs Interface

```tsx
// Use TYPE for:
// - Unions
// - Primitives
// - Function signatures
// - Type aliases

type Status = 'pending' | 'approved' | 'rejected';
type ID = string | number;
type Callback = (data: string) => void;

// Use INTERFACE for:
// - Object shapes
// - React components props
// - Anything you might extend

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminUser extends User {
  permissions: string[];
}

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

### Enums (Avoid - Use Union Types Instead)

```tsx
// ❌ DON'T: Enums add runtime code
enum Status {
  Pending = 'PENDING',
  Approved = 'APPROVED',
}

// ✅ DO: Union types are type-only (no runtime cost)
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

const status: Status = 'PENDING'; // Type-safe
```

### Utility Types

```tsx
// Partial: Make all properties optional
interface User {
  id: string;
  name: string;
  email: string;
}

type UserUpdate = Partial<User>; // All fields optional

// Pick: Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>; // Only id and name

// Omit: Exclude specific properties
type UserWithoutId = Omit<User, 'id'>; // name and email only

// Required: Make all properties required
type RequiredUser = Required<Partial<User>>; // All fields required

// Record: Key-value object
type UserMap = Record<string, User>; // { [key: string]: User }
```

### Generic Components

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage
<List
  items={users}
  renderItem={user => <UserCard user={user} />}
  keyExtractor={user => user.id}
/>
```

### Type Guards

```tsx
// Type guard function
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

// Usage
try {
  await fetchData();
} catch (error) {
  if (isApiError(error)) {
    console.log(error.status); // TypeScript knows it has .status
  } else if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('Unknown error');
  }
}
```

---

## API Integration

### API Client Pattern (TripAvail Standard)

```typescript
// lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100';

// Build URL helper
function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (base.endsWith('/v1') && normalizedPath.startsWith('/v1/')) {
    return base + normalizedPath.substring('/v1'.length);
  }
  
  return base + normalizedPath;
}

// Token management
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

// Build headers
function buildHeaders(extra?: HeadersInit): HeadersInit {
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = getAccessToken();
  if (token) {
    base.Authorization = `Bearer ${token}`;
  }
  
  return { ...base, ...(extra || {}) };
}

// Generic fetch wrapper
export async function apiFetch<T>(
  path: string,
  opts?: { method?: string; body?: unknown; headers?: HeadersInit },
): Promise<T> {
  const url = buildApiUrl(path);
  
  try {
    const res = await fetch(url, {
      method: opts?.method || 'GET',
      headers: buildHeaders(opts?.headers),
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new ApiError(error.message || 'Request failed', res.status, error);
    }
    
    return res.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('Network error', 0, err);
  }
}

// Custom error class
export class ApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;
  
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.requestId = (details as any)?.requestId;
  }
}

// Typed API functions
export async function getProviders(): Promise<{ providers: Provider[] }> {
  return apiFetch('/v1/admin/providers');
}

export async function approveProvider(providerId: string): Promise<void> {
  return apiFetch(`/v1/admin/providers/${providerId}/approve`, {
    method: 'POST',
  });
}

export async function createHotelPackage(data: CreatePackagePayload): Promise<Package> {
  return apiFetch('/v1/host/packages', {
    method: 'POST',
    body: data,
  });
}
```

### API Usage in Components

```tsx
'use client';

import { useState } from 'react';
import { getProviders, approveProvider, ApiError } from '@/lib/api-client';

export default function ProvidersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleApprove = async (providerId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await approveProvider(providerId);
      
      // Refresh data
      await fetchProviders();
      
      // Show success message
      showToast('Provider approved successfully');
      
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error ${err.status}: ${err.message}`);
        console.error('RequestId:', err.requestId);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
}
```

---

## Code Organization

### File Structure

```
app/
├── (auth)/                    # Route group
│   ├── login/
│   │   └── page.tsx          # Client Component
│   └── signup/
│       └── page.tsx
├── admin/
│   ├── layout.tsx            # Admin layout
│   ├── page.tsx              # Dashboard
│   ├── providers/
│   │   └── page.tsx
│   └── users/
│       └── page.tsx
├── components/               # Shared components
│   ├── ErrorToast.tsx
│   ├── LoadingSpinner.tsx
│   └── PartnerStatusBanner.tsx
├── providers.tsx             # Context providers
├── layout.tsx                # Root layout
└── page.tsx                  # Homepage

components/                   # Standalone components
├── LocationMap.tsx
├── LocationAutocomplete.tsx
└── GoogleMapsProvider.tsx

lib/                          # Utilities
├── api-client.ts             # API functions
├── api-types.ts              # Generated types
├── error-utils.ts            # Error formatting
└── google-maps-config.ts     # Config constants

shared/                       # Backend/Frontend shared types
└── types/
    └── index.ts
```

### Naming Conventions

```tsx
// Files: kebab-case or PascalCase
login-page.tsx
LoginPage.tsx
api-client.ts

// Components: PascalCase
export function Button() {}
export default function HomePage() {}

// Hooks: camelCase with 'use' prefix
export function useAuth() {}
export function useDebounce() {}

// Utils: camelCase
export function formatDate() {}
export function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = '...';
export const MAX_FILE_SIZE = 5242880;

// Types/Interfaces: PascalCase
export interface User {}
export type Status = '...';

// Private functions: camelCase with underscore prefix
function _validateInput() {}
function _formatData() {}
```

### Imports Order

```tsx
// 1. React imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party imports
import { format } from 'date-fns';

// 3. Absolute imports (@ alias)
import { getProviders } from '@/lib/api-client';
import { ErrorToast } from '@/app/components/ErrorToast';

// 4. Relative imports
import { formatDate } from './utils';
import { Button } from '../Button';

// 5. Type imports (if separated)
import type { User, Provider } from '@/lib/api-client';
```

### Component Files Structure

```tsx
// 1. Imports
import { useState } from 'react';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Constants
const MAX_ITEMS = 10;

// 4. Helper functions (outside component)
function formatName(name: string) {
  return name.toUpperCase();
}

// 5. Main component
export default function MyComponent({ }: Props) {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {};
  
  // Render
  return <div />;
}

// 6. Sub-components (if small and file-specific)
function SubComponent() {
  return <div />;
}
```

---

## Checklist for New Components

### Before Writing Code

- [ ] Determine if it needs 'use client' directive
- [ ] Define TypeScript interfaces for props
- [ ] Plan state variables needed
- [ ] Identify external dependencies (API calls, context)

### During Development

- [ ] Use destructured props with defaults
- [ ] TypeScript types for all state variables
- [ ] Proper dependency arrays in useEffect
- [ ] Cleanup functions in useEffect (if needed)
- [ ] Error boundaries around risky operations
- [ ] Loading states for async operations
- [ ] Empty states for zero data
- [ ] Disabled states for forms during submission

### Styling

- [ ] Use Tailwind utility classes
- [ ] Mobile-first responsive design (sm:, md:, lg:)
- [ ] Consistent spacing (4px increments)
- [ ] Max width constraints (max-w-7xl mx-auto)
- [ ] Hover/focus states on interactive elements
- [ ] Accessible color contrast (AA or AAA)

### Error Handling

- [ ] Try-catch around async operations
- [ ] Display user-friendly error messages
- [ ] Console.error for debugging
- [ ] Include requestId in error logs (if from API)

### Accessibility

- [ ] Semantic HTML (header, nav, main, footer)
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Alt text on images
- [ ] Labels for form inputs (htmlFor + id)
- [ ] Keyboard navigation support (Tab, Enter, Escape)
- [ ] ARIA labels where needed

### Performance

- [ ] Memoize expensive calculations (useMemo)
- [ ] Memoize callbacks passed to children (useCallback)
- [ ] Avoid inline object/array creation in render
- [ ] Use keys on list items
- [ ] Lazy load images (loading="lazy")
- [ ] Code splitting for large components (dynamic import)

### Testing Checklist

- [ ] Component renders without errors
- [ ] Loading state displays correctly
- [ ] Error state displays correctly
- [ ] Empty state displays correctly
- [ ] Form validation works
- [ ] API calls complete successfully
- [ ] Mobile responsive (test 375px, 768px, 1280px)
- [ ] Keyboard navigation works
- [ ] Error messages are clear

---

## Quick Reference

### Common Hooks

```tsx
useState      // Local component state
useEffect     // Side effects, lifecycle
useCallback   // Memoize functions
useMemo       // Memoize values
useRef        // DOM refs, mutable values
useContext    // Consume context
useRouter     // Next.js navigation (next/navigation)
```

### TripAvail-Specific Imports

```tsx
// API
import { apiFetch, getAccessToken, setAccessToken } from '@/lib/api-client';

// Auth
import { useAuthContext, logout } from '@/app/providers';

// Errors
import { ErrorToast } from '@/app/components/ErrorToast';
import { formatApiError } from '@/lib/error-utils';

// Google Maps
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { LocationMap } from '@/components/LocationMap';
```

### Common Tailwind Patterns

```tsx
// Container
<div className="max-w-7xl mx-auto px-4">

// Card
<div className="rounded-lg border bg-white shadow-sm p-6">

// Button Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// Loading Spinner
<div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Flexbox
<div className="flex items-center justify-between gap-4">
```

---

## Conclusion

These standards are **living rules** - update them as you discover new patterns. When in doubt:

1. Check existing codebase for similar patterns
2. Follow Next.js 14 App Router conventions
3. Prioritize TypeScript safety
4. Keep components small and focused
5. Test on mobile first, then desktop

**Next Steps:**
- Apply these standards to new components
- Refactor existing code gradually (not all at once)
- Create reusable component library following these patterns
- Document deviations with comments explaining why

---

**Version:** 1.0  
**Last Updated:** January 7, 2026  
**Maintainer:** TripAvail Engineering Team
