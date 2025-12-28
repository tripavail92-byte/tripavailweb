'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  createTourStep1,
  listTourPackages,
  mutateTourStatus,
  updateTourBasics,
  updateTourDepartures,
  updateTourHighlights,
  updateTourInclusions,
  updateTourItinerary,
  updateTourPickups,
} from '@/lib/api-client';

export default function OperatorToursPage() {
  const { user } = useAuth();
  const operatorProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'TOUR_OPERATOR') || null,
    [user],
  );

  const [tripType, setTripType] = useState('Adventure');
  const [packageId, setPackageId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [basics, setBasics] = useState({
    name: 'Sample Tour',
    description: 'Describe the experience and inclusions.',
    duration: 3,
    basePrice: 299,
    maxSeats: 20,
  });
  const [departuresText, setDeparturesText] = useState('2026-01-15\n2026-02-01');
  const [pickupsText, setPickupsText] = useState('Airport\nHotel Lobby');
  const [highlightsText, setHighlightsText] = useState('Sunrise hike\nLocal cuisine');
  const [itineraryText, setItineraryText] = useState('Day 1: Arrival and city walk\nDay 2: Mountain hike');
  const [inclusionsText, setInclusionsText] = useState('Guide\nMeals');
  const [exclusionsText, setExclusionsText] = useState('Flights');
  const [recent, setRecent] = useState<{ id?: string; name?: string; status?: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const tours = await listTourPackages().catch(() => []);
      setRecent(tours || []);
    };
    load();
  }, []);

  if (!operatorProfile) {
    return <div className="text-sm text-neutral-700">Create a tour operator profile to manage tours.</div>;
  }

  const runStep = async (fn: () => Promise<unknown>) => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await fn();
      if (res && typeof res === 'object' && 'id' in res && typeof res.id === 'string') {
        setPackageId(res.id);
      }
      setStatusMessage('Step saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async (event: FormEvent) => {
    event.preventDefault();
    await runStep(() => createTourStep1(operatorProfile.id, tripType));
  };

  const handleBasics = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    await runStep(() => updateTourBasics(operatorProfile.id, packageId, basics));
  };

  const handleDepartures = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    const departures = departuresText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    await runStep(() => updateTourDepartures(operatorProfile.id, packageId, departures));
  };

  const handlePickups = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    const pickups = pickupsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    await runStep(() => updateTourPickups(operatorProfile.id, packageId, pickups));
  };

  const handleHighlights = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    const highlights = highlightsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    await runStep(() => updateTourHighlights(operatorProfile.id, packageId, highlights));
  };

  const handleItinerary = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    const itinerary = itineraryText
      .split('\n')
      .map((line, idx) => ({ day: idx + 1, title: line, description: line }));
    await runStep(() => updateTourItinerary(operatorProfile.id, packageId, itinerary));
  };

  const handleInclusions = async (event: FormEvent) => {
    event.preventDefault();
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    const inclusions = inclusionsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    const exclusions = exclusionsText
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean);
    await runStep(() => updateTourInclusions(operatorProfile.id, packageId, inclusions, exclusions));
  };

  const handleStatus = async (action: 'publish' | 'pause' | 'archive') => {
    if (!packageId) return setStatusMessage('Set packageId from step1 first');
    await runStep(() => mutateTourStatus(operatorProfile.id, packageId, action));
    setStatusMessage(`Package ${action}d`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Tour builder (steps 1-7)</h1>
        <div className="text-sm text-neutral-700">Use your providerId: {operatorProfile.id}</div>

        <form onSubmit={handleCreateDraft} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            Trip type
            <input
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="rounded border px-3 py-2"
              required
            />
          </label>
          <button type="submit" className="rounded bg-black px-4 py-2 text-white" disabled={loading}>
            {loading ? 'Saving…' : 'Step 1: create draft'}
          </button>
        </form>

        <div className="mt-3 text-sm text-neutral-700">
          Current packageId: <span className="font-mono">{packageId || '—'}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormCard title="Step 2: Basics" onSubmit={handleBasics} disabled={loading}>
          <div className="grid gap-3">
            <input
              className="rounded border px-3 py-2"
              placeholder="Name"
              value={basics.name}
              onChange={(e) => setBasics((b) => ({ ...b, name: e.target.value }))}
              required
            />
            <textarea
              className="rounded border px-3 py-2"
              placeholder="Description"
              value={basics.description}
              rows={2}
              onChange={(e) => setBasics((b) => ({ ...b, description: e.target.value }))}
              required
            />
            <div className="grid grid-cols-3 gap-3 text-sm">
              <input
                type="number"
                className="rounded border px-3 py-2"
                placeholder="Duration (days)"
                value={basics.duration}
                onChange={(e) => setBasics((b) => ({ ...b, duration: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                className="rounded border px-3 py-2"
                placeholder="Base price"
                value={basics.basePrice}
                onChange={(e) => setBasics((b) => ({ ...b, basePrice: Number(e.target.value) }))}
                required
              />
              <input
                type="number"
                className="rounded border px-3 py-2"
                placeholder="Max seats"
                value={basics.maxSeats}
                onChange={(e) => setBasics((b) => ({ ...b, maxSeats: Number(e.target.value) }))}
                required
              />
            </div>
          </div>
        </FormCard>

        <FormCard title="Step 3: Departures" onSubmit={handleDepartures} disabled={loading}>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            value={departuresText}
            onChange={(e) => setDeparturesText(e.target.value)}
          />
          <p className="text-xs text-neutral-600">One date per line (YYYY-MM-DD)</p>
        </FormCard>

        <FormCard title="Step 4: Pickups" onSubmit={handlePickups} disabled={loading}>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            value={pickupsText}
            onChange={(e) => setPickupsText(e.target.value)}
          />
          <p className="text-xs text-neutral-600">One pickup location per line</p>
        </FormCard>

        <FormCard title="Step 5: Highlights" onSubmit={handleHighlights} disabled={loading}>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
          />
          <p className="text-xs text-neutral-600">One highlight per line</p>
        </FormCard>

        <FormCard title="Step 6: Itinerary" onSubmit={handleItinerary} disabled={loading}>
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            rows={4}
            value={itineraryText}
            onChange={(e) => setItineraryText(e.target.value)}
          />
          <p className="text-xs text-neutral-600">One line per day. Day order is preserved.</p>
        </FormCard>

        <FormCard title="Step 7: Inclusions/Exclusions" onSubmit={handleInclusions} disabled={loading}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={3}
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
              />
              <p className="text-xs text-neutral-600">Inclusions (one per line)</p>
            </div>
            <div>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                rows={3}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
              />
              <p className="text-xs text-neutral-600">Exclusions (one per line)</p>
            </div>
          </div>
        </FormCard>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Lifecycle</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="min-w-[220px] rounded border px-3 py-2"
            placeholder="packageId"
          />
          <button onClick={() => handleStatus('publish')} className="rounded bg-emerald-600 px-3 py-2 text-white">
            Publish
          </button>
          <button onClick={() => handleStatus('pause')} className="rounded bg-amber-600 px-3 py-2 text-white">
            Pause
          </button>
          <button onClick={() => handleStatus('archive')} className="rounded bg-red-600 px-3 py-2 text-white">
            Archive
          </button>
        </div>
      </div>

      {statusMessage && <div className="rounded-lg border bg-white p-3 text-sm text-neutral-800">{statusMessage}</div>}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Recent tours</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-neutral-700">No tours yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-neutral-800">
            {recent.slice(0, 5).map((tour) => (
              <li key={tour.id} className="rounded border p-2">
                <div className="font-medium">{tour.name || 'Untitled'}</div>
                {tour.status && <p className="text-xs text-neutral-600">Status: {tour.status}</p>}
                {tour.id && <p className="text-xs text-neutral-500">ID: {tour.id}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FormCard({
  title,
  children,
  onSubmit,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: FormEvent) => void;
  disabled: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button type="submit" disabled={disabled} className="rounded bg-black px-3 py-1 text-white text-sm">
          Save
        </button>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </form>
  );
}
