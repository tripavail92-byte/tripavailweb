'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

export default function HostPropertiesPage() {
  const [listingId, setListingId] = useState('');
  const [snapshot, setSnapshot] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSnapshot = async () => {
    if (!listingId) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/v1/host/properties/${listingId}/snapshot`);
      setSnapshot(res);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch snapshot';
      setError(message);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Property snapshots</h1>
        <p className="text-sm text-neutral-700">
          Enter a listing id (created in onboarding) to pull rooms, amenities, and policies for package prefilling.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="min-w-[220px] rounded border px-3 py-2"
            placeholder="listing cuid"
          />
          <button
            onClick={fetchSnapshot}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
            disabled={loading || !listingId}
          >
            {loading ? 'Loading…' : 'Load snapshot'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        {snapshot !== null && (
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-neutral-100 p-3 text-xs text-neutral-800">
            {JSON.stringify(snapshot, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
