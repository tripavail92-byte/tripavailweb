import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  HotelStep2BasicsDto,
  HotelStep3LocationDto,
  HotelStep4RoomsDto,
  HotelStep5AmenitiesDto,
  HotelStep6PoliciesDto,
  HotelStep7ReviewDto,
} from './dto';

@Injectable()
export class ProviderOnboardingService {
  constructor(private prisma: PrismaService) {}

  async startOnboarding(userId: string, providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR') {
    // Create or get provider profile
    const profile = await this.prisma.providerProfile.upsert({
      where: {
        userId_providerType: {
          userId,
          providerType,
        },
      },
      create: {
        userId,
        providerType,
        verificationStatus: 'NOT_STARTED',
      },
      update: {},
    });

    // Create or get onboarding tracker
    const onboarding = await this.prisma.providerOnboarding.upsert({
      where: { providerId: profile.id },
      create: {
        providerId: profile.id,
        currentStep: 1,
        completedSteps: [],
      },
      update: {},
    });

    return {
      profile,
      onboarding,
      message: 'Onboarding started successfully',
    };
  }

  async updateStep(providerId: string, step: number, _stepData: any) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      include: { provider: true },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Validate step sequence (can't skip steps)
    if (step > onboarding.currentStep + 1) {
      throw new BadRequestException(
        `Complete step ${onboarding.currentStep} before proceeding to step ${step}`,
      );
    }

    // Update completed steps array
    const completedSteps = Array.isArray(onboarding.completedSteps)
      ? [...(onboarding.completedSteps as number[])]
      : [];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    // Update onboarding record
    const updated = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        currentStep: Math.max(step, onboarding.currentStep),
        completedSteps,
      },
      include: { provider: true },
    });

    return {
      success: true,
      onboarding: updated,
      message: `Step ${step} completed successfully`,
    };
  }

  async submitForReview(providerId: string) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      include: { provider: true },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Determine required steps based on provider type
    const profile = onboarding.provider;
    const totalSteps = profile.providerType === 'HOTEL_MANAGER' ? 7 : 14;

    const completedSteps = Array.isArray(onboarding.completedSteps)
      ? (onboarding.completedSteps as number[])
      : [];

    if (completedSteps.length < totalSteps) {
      throw new BadRequestException(
        `Complete all ${totalSteps} steps before submitting. ` +
          `Currently completed: ${completedSteps.length}`,
      );
    }

    // Update verification status to SUBMITTED
    await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { verificationStatus: 'SUBMITTED' },
    });

    // Mark submission timestamp
    await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        submittedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Profile submitted for admin review',
      status: 'SUBMITTED',
    };
  }

  async getOnboardingStatus(providerId: string) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      include: { provider: true },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    const completedSteps = Array.isArray(onboarding.completedSteps)
      ? (onboarding.completedSteps as number[])
      : [];
    const totalSteps = onboarding.provider.providerType === 'HOTEL_MANAGER' ? 7 : 14;
    const progress = Math.round((completedSteps.length / totalSteps) * 100);

    return {
      currentStep: onboarding.currentStep,
      completedSteps,
      totalSteps,
      progress,
      canSubmit: completedSteps.length >= totalSteps,
      submittedAt: onboarding.submittedAt,
      approvedAt: onboarding.approvedAt,
      rejectedAt: onboarding.rejectedAt,
      onboardingData: onboarding.onboardingData, // Include step data for review
    };
  }

  async listOnboardings(userId: string) {
    const profiles = await this.prisma.providerProfile.findMany({
      where: { userId },
      include: {
        onboarding: true,
      },
    });

    return profiles.map((profile) => {
      const completedSteps =
        profile.onboarding && Array.isArray(profile.onboarding.completedSteps)
          ? (profile.onboarding.completedSteps as number[])
          : [];
      const totalSteps = profile.providerType === 'HOTEL_MANAGER' ? 7 : 14;

      return {
        id: profile.id,
        providerType: profile.providerType,
        verificationStatus: profile.verificationStatus,
        onboarding: profile.onboarding
          ? {
              currentStep: profile.onboarding.currentStep,
              progress: Math.round((completedSteps.length / totalSteps) * 100),
              submittedAt: profile.onboarding.submittedAt,
            }
          : null,
      };
    });
  }

  // ===== HOTEL LISTING 7-STEP FLOW =====

  /**
   * Step 2: Hotel Basics (name, type, rating, description, contact)
   */
  async hotelStep2Basics(providerId: string, dto: HotelStep2BasicsDto) {
    await this.validateStepSequence(providerId, 2);

    // Store step data in onboardingData JSON field
    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...(await this.getOnboardingData(providerId)),
          step2_basics: dto,
        },
        currentStep: 2,
        completedSteps: await this.addCompletedStep(providerId, 2),
      },
    });

    return {
      success: true,
      message: 'Hotel basics saved successfully',
      currentStep: onboarding.currentStep,
      data: dto,
    };
  }

  /**
   * Step 3: Location (address, coordinates)
   */
  async hotelStep3Location(providerId: string, dto: HotelStep3LocationDto) {
    await this.validateStepSequence(providerId, 3);

    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...(await this.getOnboardingData(providerId)),
          step3_location: dto,
        },
        currentStep: 3,
        completedSteps: await this.addCompletedStep(providerId, 3),
      },
    });

    return {
      success: true,
      message: 'Location details saved successfully',
      currentStep: onboarding.currentStep,
      data: dto,
    };
  }

  /**
   * Step 4: Rooms (room types with capacity, pricing, inventory)
   */
  async hotelStep4Rooms(providerId: string, dto: HotelStep4RoomsDto) {
    await this.validateStepSequence(providerId, 4);

    // Validate at least one room type
    if (!dto.rooms || dto.rooms.length === 0) {
      throw new BadRequestException('At least one room type is required');
    }

    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...(await this.getOnboardingData(providerId)),
          step4_rooms: dto,
        },
        currentStep: 4,
        completedSteps: await this.addCompletedStep(providerId, 4),
      },
    });

    return {
      success: true,
      message: `${dto.rooms.length} room type(s) saved successfully`,
      currentStep: onboarding.currentStep,
      data: dto,
    };
  }

  /**
   * Step 5: Amenities (select from Amenity master list)
   */
  async hotelStep5Amenities(providerId: string, dto: HotelStep5AmenitiesDto) {
    await this.validateStepSequence(providerId, 5);

    // Validate amenities exist in master list
    if (dto.amenities.length > 0) {
      const amenities = await this.prisma.amenity.findMany({
        where: { id: { in: dto.amenities } },
      });

      if (amenities.length !== dto.amenities.length) {
        throw new BadRequestException('Some amenity IDs are invalid');
      }
    }

    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...(await this.getOnboardingData(providerId)),
          step5_amenities: dto,
        },
        currentStep: 5,
        completedSteps: await this.addCompletedStep(providerId, 5),
      },
    });

    return {
      success: true,
      message: `${dto.amenities.length} amenity(ies) selected`,
      currentStep: onboarding.currentStep,
      data: dto,
    };
  }

  /**
   * Step 6: Policies (cancellation, payment terms, check-in/out times, rules)
   */
  async hotelStep6Policies(providerId: string, dto: HotelStep6PoliciesDto) {
    await this.validateStepSequence(providerId, 6);

    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...(await this.getOnboardingData(providerId)),
          step6_policies: dto,
        },
        currentStep: 6,
        completedSteps: await this.addCompletedStep(providerId, 6),
      },
    });

    return {
      success: true,
      message: 'Policies saved successfully',
      currentStep: onboarding.currentStep,
      data: dto,
    };
  }

  /**
   * Step 7: Review & Submit (terms acceptance, create Listing + Rooms)
   */
  async hotelStep7Review(providerId: string, dto: HotelStep7ReviewDto) {
    await this.validateStepSequence(providerId, 7);

    if (!dto.acceptTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    // Get all step data
    const onboardingData = await this.getOnboardingData(providerId);
    const step2 = onboardingData.step2_basics as HotelStep2BasicsDto;
    const step3 = onboardingData.step3_location as HotelStep3LocationDto;
    const step4 = onboardingData.step4_rooms as HotelStep4RoomsDto;
    const step5 = onboardingData.step5_amenities as HotelStep5AmenitiesDto;
    const step6 = onboardingData.step6_policies as HotelStep6PoliciesDto;

    // Validate all required steps are complete
    if (!step2 || !step3 || !step4 || !step5 || !step6) {
      throw new BadRequestException('All previous steps must be completed');
    }

    // Create Listing with transaction
    const listing = await this.prisma.$transaction(async (tx) => {
      // Create Listing
      const newListing = await tx.listing.create({
        data: {
          providerId,
          name: step2.hotelName,
          address: `${step3.streetAddress}, ${step3.city}`,
          city: step3.city,
          latitude: step3.latitude,
          longitude: step3.longitude,
          description: step2.description,
          status: 'DRAFT',
          checkInTime: step6.checkInTime,
          checkOutTime: step6.checkOutTime,
        },
      });

      // Create Room types
      const rooms = await Promise.all(
        step4.rooms.map((room) =>
          tx.room.create({
            data: {
              listingId: newListing.id,
              name: room.name,
              capacity: room.capacity,
              bedConfig: room.bedConfig,
              basePrice: room.basePrice,
              totalUnits: room.totalUnits,
            },
          }),
        ),
      );

      // Create ListingAmenity junction records
      if (step5.amenities.length > 0) {
        await tx.listingAmenity.createMany({
          data: step5.amenities.map((amenityId: string) => ({
            listingId: newListing.id,
            amenityId,
          })),
        });
      }

      return { listing: newListing, rooms };
    });

    // Update onboarding status
    const onboarding = await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        onboardingData: {
          ...onboardingData,
          step7_review: dto,
          listingId: listing.listing.id, // Store created listing ID
        },
        currentStep: 7,
        completedSteps: await this.addCompletedStep(providerId, 7),
      },
    });

    return {
      success: true,
      message: 'Hotel listing created successfully',
      currentStep: onboarding.currentStep,
      listingId: listing.listing.id,
      roomsCreated: listing.rooms.length,
    };
  }

  // ===== HELPER METHODS =====

  /**
   * Validate user cannot skip steps
   */
  private async validateStepSequence(providerId: string, requestedStep: number) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      include: { provider: true },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding record not found');
    }

    // Step 2 can always be accessed after step 1 (welcome)
    if (requestedStep === 2) {
      return;
    }

    // For other steps, validate previous step is completed
    const completedSteps = Array.isArray(onboarding.completedSteps)
      ? (onboarding.completedSteps as number[])
      : [];

    const previousStep = requestedStep - 1;
    if (!completedSteps.includes(previousStep)) {
      throw new BadRequestException(
        `Complete step ${previousStep} before proceeding to step ${requestedStep}`,
      );
    }
  }

  /**
   * Get current onboarding data JSON
   */
  private async getOnboardingData(providerId: string): Promise<any> {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      select: { onboardingData: true },
    });

    return (onboarding?.onboardingData as any) || {};
  }

  /**
   * Add step to completedSteps array (idempotent)
   */
  private async addCompletedStep(providerId: string, step: number): Promise<number[]> {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      select: { completedSteps: true },
    });

    const completedSteps = Array.isArray(onboarding?.completedSteps)
      ? [...(onboarding.completedSteps as number[])]
      : [];

    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    return completedSteps.sort((a, b) => a - b);
  }
}
