import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    hotelStep2Basics,
    hotelStep3Location,
    hotelStep4Rooms,
    hotelStep5Amenities,
    hotelStep6Policies,
    hotelStep7Review,
    startProviderOnboarding,
    getProviderOnboardingStatus,
    submitProviderOnboarding,
    type HotelStep2BasicsPayload,
    type HotelStep3LocationPayload,
    type HotelStep4RoomsPayload,
    type HotelStep5AmenitiesPayload,
    type HotelStep6PoliciesPayload,
    type HotelStep7ReviewPayload,
    type AllowedPropertyType,
} from '@/lib/api-client';

export interface Room {
    id: string;
    name: string;
    description: string;
    maxOccupancy: number;
    bedType: string;
    basePrice: number;
    roomSize: number;
    amenities: string[];
    photos: string[];
}

export interface OnboardingData {
    // Personal Info
    fullName: string;
    email: string;
    phone: string;

    // Hotel Info
    hotelName: string;
    propertyType: AllowedPropertyType;
    starRating: number;
    hotelAddress: string;
    description: string;

    // Location
    streetAddress: string;
    city: string;
    stateProvince: string;
    country: string;
    postalCode: string;
    coordinates: { lat: number; lng: number } | null;

    // Amenities
    selectedAmenities: string[];

    // Rules & Policies
    checkIn: string;
    checkOut: string;
    cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT' | 'NON_REFUNDABLE';
    paymentTerms: 'FULL_AT_BOOKING' | 'DEPOSIT_PLUS_BALANCE' | 'PAY_AT_ARRIVAL';
    houseRules: string;
    ageRestrictions: string;
    childrenPolicy: boolean;
    childrenAgeLimit: number;
    petPolicy: boolean;
    petTypes: string[];
    petFee: number;
    otherRules: string;

    // Room Details
    rooms: Room[];

    // Review Step
    acceptTerms: boolean;
    marketingOptIn: boolean;
}

interface OnboardingState {
    // Provider and onboarding IDs
    providerId: string | null;
    onboardingId: string | null;

    // UI State
    currentStep: number;
    completedSteps: string[];
    data: OnboardingData;

    // Loading & Error States
    isLoading: boolean;
    error: string | null;
    isSaving: boolean;

    // Basic Actions
    setStep: (step: number) => void;
    updateData: (updates: Partial<OnboardingData>) => void;
    markStepComplete: (stepId: string) => void;
    addRoom: (room: Room) => void;
    removeRoom: (roomId: string) => void;
    resetOnboarding: () => void;

    // Provider Management
    setProviderId: (id: string) => void;
    setOnboardingId: (id: string) => void;

    // API Integration Actions
    initializeOnboarding: () => Promise<void>;
    loadOnboardingStatus: (providerId: string) => Promise<void>;
    saveHotelInfo: () => Promise<void>;
    saveLocation: () => Promise<void>;
    saveAmenities: () => Promise<void>;
    saveRules: () => Promise<void>;
    saveRooms: () => Promise<void>;
    saveReview: () => Promise<void>;
    submitForReview: () => Promise<void>;
}

const INITIAL_DATA: OnboardingData = {
    fullName: '',
    email: '',
    phone: '',
    hotelName: '',
    propertyType: 'HOTEL',
    starRating: 0,
    hotelAddress: '',
    description: '',
    streetAddress: '',
    city: '',
    stateProvince: '',
    country: '',
    postalCode: '',
    coordinates: null,
    selectedAmenities: [],
    checkIn: '14:00',
    checkOut: '12:00',
    cancellationPolicy: 'FLEXIBLE',
    paymentTerms: 'FULL_AT_BOOKING',
    houseRules: '',
    ageRestrictions: '',
    childrenPolicy: true,
    childrenAgeLimit: 12,
    petPolicy: false,
    petTypes: [],
    petFee: 0,
    otherRules: '',
    rooms: [],
    acceptTerms: false,
    marketingOptIn: false,
};

// Map step index to ID for completion tracking
export const ONBOARDING_STEPS = [
    { id: 'overview', title: 'Overview' },
    { id: 'welcome', title: 'Welcome' },
    { id: 'hotel-info', title: 'Hotel Info' },
    { id: 'location', title: 'Location' },
    { id: 'amenities', title: 'Amenities' },
    { id: 'rules', title: 'Rules' },
    { id: 'rooms', title: 'Rooms' },
    { id: 'review', title: 'Review' },
    { id: 'success', title: 'Success' },
];

export const useHostOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            // Initial State
            providerId: null,
            onboardingId: null,
            currentStep: 0,
            completedSteps: [],
            data: INITIAL_DATA,
            isLoading: false,
            error: null,
            isSaving: false,

            // Basic Actions
            setStep: (step) => set({ currentStep: step }),

            updateData: (updates) =>
                set((state) => ({
                    data: { ...state.data, ...updates },
                })),

            markStepComplete: (stepId) =>
                set((state) => {
                    if (state.completedSteps.includes(stepId)) return state;
                    return { completedSteps: [...state.completedSteps, stepId] };
                }),

            addRoom: (room) =>
                set((state) => ({
                    data: { ...state.data, rooms: [...state.data.rooms, room] },
                })),

            removeRoom: (roomId) =>
                set((state) => ({
                    data: {
                        ...state.data,
                        rooms: state.data.rooms.filter((r) => r.id !== roomId),
                    },
                })),

            resetOnboarding: () =>
                set({
                    currentStep: 0,
                    completedSteps: [],
                    data: INITIAL_DATA,
                    providerId: null,
                    onboardingId: null,
                    error: null,
                }),

            // Provider Management
            setProviderId: (id) => set({ providerId: id }),
            setOnboardingId: (id) => set({ onboardingId: id }),

            // API Integration Actions
            initializeOnboarding: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await startProviderOnboarding({ providerType: 'HOTEL_MANAGER' });
                    set({
                        providerId: response.providerId,
                        onboardingId: response.onboardingId,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to start onboarding',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            loadOnboardingStatus: async (providerId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const status = await getProviderOnboardingStatus(providerId);

                    // Update store with server state
                    const updates: Partial<OnboardingState> = {
                        isLoading: false,
                        currentStep: Math.max(status.currentStep || 0, 0),
                        completedSteps: (status.completedSteps || []).map(step =>
                            ONBOARDING_STEPS[step]?.id || `step-${step}`
                        ),
                    };

                    // Hydrate data from onboardingData if available
                    if (status.onboardingData) {
                        const serverData: any = status.onboardingData;
                        if (serverData.step2_basics) {
                            Object.assign(updates, {
                                data: {
                                    ...get().data,
                                    hotelName: serverData.step2_basics.hotelName || get().data.hotelName,
                                    propertyType: serverData.step2_basics.propertyType || get().data.propertyType,
                                    starRating: serverData.step2_basics.starRating || get().data.starRating,
                                    description: serverData.step2_basics.description || get().data.description,
                                    email: serverData.step2_basics.contactEmail || get().data.email,
                                    phone: serverData.step2_basics.contactPhone || get().data.phone,
                                },
                            });
                        }
                    }

                    set(updates);
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to load status',
                        isLoading: false,
                    });
                }
            },

            saveHotelInfo: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep2BasicsPayload = {
                        hotelName: state.data.hotelName,
                        propertyType: state.data.propertyType,
                        starRating: state.data.starRating,
                        description: state.data.description,
                        contactEmail: state.data.email,
                        contactPhone: state.data.phone,
                    };

                    await hotelStep2Basics(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('hotel-info');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save hotel info',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            saveLocation: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep3LocationPayload = {
                        streetAddress: state.data.streetAddress,
                        city: state.data.city,
                        stateProvince: state.data.stateProvince,
                        country: state.data.country,
                        postalCode: state.data.postalCode,
                        latitude: state.data.coordinates?.lat || 0,
                        longitude: state.data.coordinates?.lng || 0,
                    };

                    await hotelStep3Location(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('location');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save location',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            saveAmenities: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep5AmenitiesPayload = {
                        amenities: state.data.selectedAmenities,
                    };

                    await hotelStep5Amenities(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('amenities');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save amenities',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            saveRules: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep6PoliciesPayload = {
                        checkInTime: state.data.checkIn,
                        checkOutTime: state.data.checkOut,
                        cancellationPolicy: state.data.cancellationPolicy,
                        paymentTerms: state.data.paymentTerms,
                        houseRules: state.data.houseRules,
                        ageRestrictions: state.data.ageRestrictions,
                    };

                    await hotelStep6Policies(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('rules');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save policies',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            saveRooms: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep4RoomsPayload = {
                        rooms: state.data.rooms.map(room => ({
                            name: room.name,
                            capacity: room.maxOccupancy,
                            bedConfig: room.bedType,
                            basePrice: room.basePrice,
                            totalUnits: 1, // Default to 1 unit per room type
                        })),
                    };

                    await hotelStep4Rooms(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('rooms');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save rooms',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            saveReview: async () => {
                const state = get();
                if (!state.providerId) throw new Error('Provider ID not set');

                try {
                    set({ isSaving: true, error: null });

                    const payload: HotelStep7ReviewPayload = {
                        acceptTerms: state.data.acceptTerms,
                        marketingOptIn: state.data.marketingOptIn,
                    };

                    await hotelStep7Review(state.providerId, payload);
                    set({ isSaving: false });
                    get().markStepComplete('review');
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to save review',
                        isSaving: false,
                    });
                    throw error;
                }
            },

            submitForReview: async () => {
                try {
                    set({ isSaving: true, error: null });
                    await submitProviderOnboarding('HOTEL_MANAGER');
                    set({ isSaving: false });
                    // Move to success step
                    get().setStep(ONBOARDING_STEPS.length - 1);
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to submit for review',
                        isSaving: false,
                    });
                    throw error;
                }
            },
        }),
        {
            name: 'tripavail-host-onboarding',
        }
    )
);

