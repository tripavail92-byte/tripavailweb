'use client';

import { useEffect, useState } from 'react';
import { listHotelPackages, listTourPackages, listStays, type ListingSummary } from '@/lib/api-client';

export default function TravelerHome() {
  const [stays, setStays] = useState<ListingSummary[]>([]);
  const [hotels, setHotels] = useState<ListingSummary[]>([]);
  const [tours, setTours] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [staysRes, hotelRes, tourRes] = await Promise.all([
          listStays('PUBLISHED').catch(() => []),
          listHotelPackages({ status: 'PUBLISHED' }).catch(() => ({ items: [] })),
          listTourPackages('PUBLISHED').catch(() => []),
        ]);
        setStays(staysRes || []);
        setHotels(hotelRes?.items || []);
        setTours(tourRes || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load content';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Plan your next trip</h1>
        <p className="text-neutral-600">Browse published stays, hotel packages, and tours.</p>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>}
      {loading && <div className="rounded-lg border bg-white p-3">Loading listings...</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Hotel Packages" items={hotels} empty="No published hotel packages yet." />
        <Card title="Tours" items={tours} empty="No published tours yet." />
        <Card title="Stays" items={stays} empty="No published stays yet." />
      </section>
    </div>
  );
}

function Card({ title, items, empty }: { title: string; items: ListingSummary[]; empty: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-600">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-neutral-800">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded border p-2">
              <div className="font-medium">{item.name || item.title || 'Untitled'}</div>
              {item.description && <p className="text-neutral-600">{item.description}</p>}
              {item.status && <p className="text-xs text-neutral-500">Status: {item.status}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
