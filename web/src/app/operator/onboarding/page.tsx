'use client';

import { useState } from 'react';
import { startProviderOnboarding } from '@/lib/api-client';

export default function OperatorOnboardingPage() {
  const [result, setResult] = useState<{ onboardingId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await startProviderOnboarding({ providerType: 'TOUR_OPERATOR' });
      setResult(res);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start onboarding';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Tour operator onboarding</h1>
        <p className="text-sm text-neutral-700">
          Kick off the 14-step onboarding for tour operators. You can continue later with your onboarding id.
        </p>
        <button
          onClick={handleStart}
          disabled={loading}
          className="mt-3 rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Start onboarding'}
        </button>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {result && (
          <pre className="mt-3 overflow-x-auto rounded bg-neutral-100 p-3 text-xs text-neutral-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
