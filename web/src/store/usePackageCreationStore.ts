import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    createHotelPackage,
    updateHotelPackage,
    mutateHotelPackageStatus,
    type CreateHotelPackagePayload,
    type UpdateHotelPackagePayload,
} from '@/lib/api-client';

export interface PackageFormData {
    // Step 1: Type
    packageType: string | null;
    templateId: string | null;
    listingId: string | null; // Hotel/Property ID

    // Step 2: Basics
    title: string;
    description: string;
    duration: number; // days
    category: string;
    tags: string[];
    targetAudience: string[];

    // Step 3: Media (future)
    photos: string[];
    videoUrl: string;

    // Step 4: Highlights
    highlights: string[];

    // Step 5: Inclusions & Exclusions
    inclusions: string[];
    exclusions: string[];

    // Step 6: Fine Print
    finePrint: string;
    cancellationPolicy: string;

    // Step 7: Pricing
    basePrice: number;
    pricePerPerson: number;
    availabilityRule: 'WEEKEND_ONLY' | 'SEASONAL' | 'FLEXIBLE';

    // Step 8: Calendar (future)
    availableDates: Date[];
    blackoutDates: Date[];

    // Step 9: Policies
    minimumBookingNotice: number; // hours
    maximumGuests: number;

    // Step 10: Review & Publish
    amenityIds: string[];
}

interface WizardState {
    // IDs
    providerId: string | null;
    packageId: string | null;

    // UI State
    currentStep: number;
    totalSteps: number;
    formData: PackageFormData;

    // Loading & Error States
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Basic Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    updateFormData: (data: Partial<PackageFormData>) => void;
    resetWizard: () => void;

    // Provider Management
    setProviderId: (id: string) => void;
    setPackageId: (id: string) => void;

    // API Integration Actions
    createPackage: () => Promise<void>;
    updateBasics: () => Promise<void>;
    updateInclusions: () => Promise<void>;
    updatePricing: () => Promise<void>;
    publishPackage: () => Promise<void>;
}

const INITIAL_DATA: PackageFormData = {
    packageType: null,
    templateId: null,
    listingId: null,
    title: '',
    description: '',
    duration: 2,
    category: '',
    tags: [],
    targetAudience: [],
    photos: [],
    videoUrl: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    finePrint: '',
    cancellationPolicy: '',
    basePrice: 0,
    pricePerPerson: 0,
    availabilityRule: 'FLEXIBLE',
    availableDates: [],
    blackoutDates: [],
    minimumBookingNotice: 24,
    maximumGuests: 2,
    amenityIds: [],
};

export const usePackageCreationStore = create<WizardState>()(
    persist(
        (set, get) => ({
            // Initial State
            providerId: null,
            packageId: null,
            currentStep: 1,
            totalSteps: 10,
            formData: INITIAL_DATA,
            isLoading: false,
            isSaving: false,
            error: null,

            // Basic Actions
            setStep: (step) => {
                const { totalSteps } = get();
                if (step >= 1 && step <= totalSteps) {
                    set({ currentStep: step });
                }
            },

            nextStep: () => {
                const { currentStep, totalSteps } = get();
                if (currentStep < totalSteps) {
                    set({ currentStep: currentStep + 1 });
                }
            },

            prevStep: () => {
                const { currentStep } = get();
                if (currentStep > 1) {
                    set({ currentStep: currentStep - 1 });
                }
            },

            updateFormData: (updates) => {
                set((state) => ({
                    formData: { ...state.formData, ...updates },
                }));
            },

            resetWizard: () => {
                set({
                    currentStep: 1,
                    formData: INITIAL_DATA,
                    packageId: null,
                    error: null,
                });
            },

            // Provider Management
            setProviderId: (id) => set({ providerId: id }),
            setPackageId: (id) => set({ packageId: id }),

            // API Integration Actions
            createPackage: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');
                if (!state.formData.listingId) throw new Error('Listing ID not set');
                if (!state.formData.templateId) throw new Error('Template ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: CreateHotelPackagePayload = {
                        templateId: state.formData.templateId,
                        listingId: state.formData.listingId,
                        name: state.formData.title,
                        description: state.formData.description,
                        pricePerPerson: state.formData.pricePerPerson,
                        availabilityRule: state.formData.availabilityRule,
                        inclusions: state.formData.inclusions,
                        exclusions: state.formData.exclusions,
                        amenityIds: state.formData.amenityIds,
                    };

                    const response = await createHotelPackage(state.providerId, payload);
                    set({ packageId: response.id, isSaving: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to create package',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            updateBasics: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');
                if (!state.packageId) {
                    // If no package created yet, create it
                    await get().createPackage();
                    return;
                }

                try {
                    set({ isSaving: true, error: null });

                    const payload: UpdateHotelPackagePayload = {
                        name: state.formData.title,
                        description: state.formData.description,
                    };

                    await updateHotelPackage(state.providerId, state.packageId, payload);
                    set({ isSaving: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update basics',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            updateInclusions: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');
                if (!state.packageId) throw new Error('Package ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: UpdateHotelPackagePayload = {
                        inclusions: state.formData.inclusions,
                        exclusions: state.formData.exclusions,
                    };

                    await updateHotelPackage(state.providerId, state.packageId, payload);
                    set({ isSaving: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update inclusions',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            updatePricing: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');
                if (!state.packageId) throw new Error('Package ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: UpdateHotelPackagePayload = {
                        pricePerPerson: state.formData.pricePerPerson,
                        availabilityRule: state.formData.availabilityRule,
                    };

                    await updateHotelPackage(state.providerId, state.packageId, payload);
                    set({ isSaving: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update pricing',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            publishPackage: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');
                if (!state.packageId) throw new Error('Package ID not set');

                try {
                    set({ isSaving: true, error: null });
                    await mutateHotelPackageStatus(state.providerId, state.packageId, 'publish');
                    set({ isSaving: false });
                    // Move to success step
                    get().setStep(get().totalSteps);
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to publish package',
                        isSaving: false,
                    });
                    throw error;
                }
            },
        }),
        {
            name: 'tripavail-package-wizard',
        }
    )
);

