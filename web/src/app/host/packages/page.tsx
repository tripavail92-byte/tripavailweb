'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  CreateHotelPackagePayload,
  createHotelPackage,
  updateHotelPackage,
  deleteHotelPackage,
  listHotelPackages,
  getHotelPackage,
  getHotelPackageTemplates,
  mutateHotelPackageStatus,
  getPropertySnapshot,
  HotelPackage,
  HotelPackageTemplate,
  PropertySnapshot,
} from '@/lib/api-client';
import DiscountSettingsStep from './discount';

type ViewMode = 'list' | 'create' | 'edit';

export default function HostPackagesPage() {
  const { user } = useAuth();
  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [packages, setPackages] = useState<HotelPackage[]>([]);
  const [templates, setTemplates] = useState<HotelPackageTemplate[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, PropertySnapshot>>({});
  const [selectedPackage, setSelectedPackage] = useState<HotelPackage | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CreateHotelPackagePayload>({
    templateId: '',
    listingId: '',
    name: '',
    description: '',
    pricePerPerson: 0,
    availabilityRule: 'FLEXIBLE',
    inclusions: [],
    exclusions: [],
    amenityIds: [],
  });

  useEffect(() => {
    if (hotelProfile) {
      loadPackages();
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, hotelProfile?.id]);

  const loadPackages = async () => {
    if (!hotelProfile) return;
    try {
      setLoading(true);
      const response = await listHotelPackages({
        providerId: hotelProfile.id,
        status: statusFilter || undefined,
      });
      setPackages(response.items || []);
      // Load snapshots for properties
      const listingIds = [
        ...new Set(response.items.map((p) => p.listingId).filter(Boolean) as string[]),
      ];
      const snapshotPromises = listingIds.map((id) =>
        getPropertySnapshot(id)
          .then((snapshot) => ({ id, snapshot }))
          .catch(() => null),
      );
      const results = await Promise.all(snapshotPromises);
      const snapshotMap: Record<string, PropertySnapshot> = {};
      results.forEach((r) => {
        if (r) snapshotMap[r.id] = r.snapshot;
      });
      setSnapshots(snapshotMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getHotelPackageTemplates();
      setTemplates(response.items || []);
      if (response.items && response.items.length > 0 && !form.templateId) {
        setForm((f) => ({ ...f, templateId: response.items[0].id }));
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadPackageForEdit = async (id: string) => {
    try {
      setLoading(true);
      const pkg = await getHotelPackage(id);
      setSelectedPackage(pkg);
      setForm({
        templateId: pkg.templateId || '',
        listingId: pkg.listingId || '',
        name: pkg.name || '',
        description: pkg.description || '',
        pricePerPerson: pkg.pricePerPerson || 0,
        availabilityRule:
          (pkg.availabilityRule as 'WEEKEND_ONLY' | 'SEASONAL' | 'FLEXIBLE') || 'FLEXIBLE',
        inclusions: [],
        exclusions: [],
        amenityIds: [],
      });
      setViewMode('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!hotelProfile) return;

    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const payload = {
        ...form,
        pricePerPerson: Number(form.pricePerPerson),
        inclusions: form.inclusions?.filter(Boolean) || [],
        exclusions: form.exclusions?.filter(Boolean) || [],
        amenityIds: form.amenityIds?.filter(Boolean) || [],
      };

      if (viewMode === 'create') {
        await createHotelPackage(hotelProfile.id, payload);
        setSuccess('Package created successfully!');
      } else if (viewMode === 'edit' && selectedPackage) {
        await updateHotelPackage(hotelProfile.id, selectedPackage.id, payload);
        setSuccess('Package updated successfully!');
      }

      setForm({
        templateId: templates[0]?.id || '',
        listingId: '',
        name: '',
        description: '',
        pricePerPerson: 0,
        availabilityRule: 'FLEXIBLE',
        inclusions: [],
        exclusions: [],
        amenityIds: [],
      });
      setSelectedPackage(null);
      setViewMode('list');
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!hotelProfile || !confirm('Are you sure you want to delete this package?')) return;
    try {
      setLoading(true);
      await deleteHotelPackage(hotelProfile.id, id);
      setSuccess('Package deleted successfully!');
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (packageId: string, action: 'publish' | 'pause' | 'archive') => {
    if (!hotelProfile) return;
    try {
      setLoading(true);
      await mutateHotelPackageStatus(hotelProfile.id, packageId, action);
      setSuccess(`Package ${action}ed successfully!`);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} package`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillFromSnapshot = (listingId: string) => {
    const snapshot = snapshots[listingId];
    if (snapshot && snapshot.policies) {
      setForm((f) => ({
        ...f,
        listingId,
        amenityIds: snapshot.amenities?.map((a) => a.id) || [],
      }));
    }
  };

  if (!hotelProfile) {
    return (
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-sm text-neutral-700">
          Create a hotel provider profile to manage packages.
        </div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {viewMode === 'create' ? 'Create Hotel Package' : 'Edit Hotel Package'}
          </h1>
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedPackage(null);
              setForm({
                templateId: templates[0]?.id || '',
                listingId: '',
                name: '',
                description: '',
                pricePerPerson: 0,
                availabilityRule: 'FLEXIBLE',
                inclusions: [],
                exclusions: [],
                amenityIds: [],
              });
            }}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              Template
              <select
                value={form.templateId}
                onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                className="rounded border px-3 py-2"
                required
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              Listing ID
              <div className="flex gap-2">
                <input
                  value={form.listingId}
                  onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))}
                  className="flex-1 rounded border px-3 py-2"
                  placeholder="listing cuid from onboarding"
                  required
                />
                {form.listingId && snapshots[form.listingId] && (
                  <button
                    type="button"
                    onClick={() => handlePrefillFromSnapshot(form.listingId)}
                    className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-700"
                  >
                    Prefill
                  </button>
                )}
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded border px-3 py-2"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded border px-3 py-2"
              rows={4}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              Price per person
              <input
                type="number"
                step="0.01"
                value={form.pricePerPerson}
                onChange={(e) => setForm((f) => ({ ...f, pricePerPerson: Number(e.target.value) }))}
                className="rounded border px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              Availability rule
              <select
                value={form.availabilityRule}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    availabilityRule: e.target
                      .value as CreateHotelPackagePayload['availabilityRule'],
                  }))
                }
                className="rounded border px-3 py-2"
              >
                <option value="WEEKEND_ONLY">Weekend only</option>
                <option value="SEASONAL">Seasonal</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              Inclusions (one per line)
              <textarea
                value={form.inclusions?.join('\n') || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    inclusions: e.target.value
                      .split('\n')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }))
                }
                className="rounded border px-3 py-2"
                rows={3}
                placeholder="Breakfast&#10;Spa access"
              />
            </label>
            <label className="flex flex-col gap-1">
              Exclusions (one per line)
              <textarea
                value={form.exclusions?.join('\n') || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    exclusions: e.target.value
                      .split('\n')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }))
                }
                className="rounded border px-3 py-2"
                rows={3}
                placeholder="Flights not included"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            Amenity IDs (comma separated)
            <input
              value={form.amenityIds?.join(',') || ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  amenityIds: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                }))
              }
              className="rounded border px-3 py-2"
              placeholder="amenity_id1, amenity_id2"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {loading ? 'Saving...' : viewMode === 'create' ? 'Create Package' : 'Update Package'}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSelectedPackage(null);
              }}
              className="rounded-md border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>

        <DiscountSettingsStep />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hotel Packages</h1>
        <button
          onClick={() => setViewMode('create')}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Create Package
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        {hotelProfile.verificationStatus !== 'APPROVED' && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Publishing is gated until your provider profile is approved. You can still create and
            edit drafts.
          </div>
        )}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="PAUSED">Paused</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-neutral-600">Loading packages...</div>
        ) : packages.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-600">No packages found.</div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{pkg.name || 'Untitled Package'}</h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          pkg.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : pkg.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : pkg.status === 'ARCHIVED'
                                ? 'bg-neutral-100 text-neutral-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {pkg.status || 'DRAFT'}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                      {pkg.pricePerPerson && <span>${pkg.pricePerPerson} per person</span>}
                      {pkg.templateId && <span>Template: {pkg.templateId}</span>}
                      {pkg.createdAt && (
                        <span>Created: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      {pkg.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => loadPackageForEdit(pkg.id)}
                            className="rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            className="rounded bg-red-100 px-3 py-1 text-xs text-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {pkg.status === 'DRAFT' && (
                        <button
                          onClick={() => handleStatusChange(pkg.id, 'publish')}
                          className="rounded bg-green-100 px-3 py-1 text-xs text-green-700"
                          disabled={loading || hotelProfile.verificationStatus !== 'APPROVED'}
                        >
                          Publish
                        </button>
                      )}
                      {pkg.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleStatusChange(pkg.id, 'pause')}
                          className="rounded bg-amber-100 px-3 py-1 text-xs text-amber-700"
                          disabled={loading}
                        >
                          Pause
                        </button>
                      )}
                      {pkg.status === 'PAUSED' && (
                        <button
                          onClick={() => handleStatusChange(pkg.id, 'publish')}
                          className="rounded bg-green-100 px-3 py-1 text-xs text-green-700"
                          disabled={loading || hotelProfile.verificationStatus !== 'APPROVED'}
                        >
                          Resume
                        </button>
                      )}
                      {pkg.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleStatusChange(pkg.id, 'archive')}
                          className="rounded bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
                          disabled={loading}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
