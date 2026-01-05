'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@/lib/api-client';
import { getAuthMe, setAccessToken } from '@/lib/api-client';
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const me = await getAuthMe();
      setUser(me);
      setError(null);
    } catch (err) {
      setUser(null);
      const message = err instanceof Error ? err.message : 'Unable to load session';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(() => ({ user, loading, error, refresh }), [user, loading, error]);

  return (
    <GoogleMapsProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </GoogleMapsProvider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}

export function logout() {
  setAccessToken(null);
}
