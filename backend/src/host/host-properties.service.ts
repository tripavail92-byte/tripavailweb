import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type OnboardingDataShape = {
  step6_policies?: unknown;
  step9_media?: unknown;
};

@Injectable()
export class HostPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        rooms: true,
        amenities: { include: { amenity: true } },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId: listing.providerId },
      select: {
        providerId: true,
        currentStep: true,
        completedSteps: true,
        onboardingData: true,
      },
    });

    const onboardingData = (onboarding?.onboardingData ??
      null) as unknown as OnboardingDataShape | null;
    const policies = onboardingData?.step6_policies ?? null;
    const media = (onboardingData as any)?.step9_media ?? null;

    return {
      property: {
        id: listing.id,
        providerId: listing.providerId,
        name: listing.name,
        address: listing.address,
        city: listing.city,
        latitude: listing.latitude,
        longitude: listing.longitude,
        description: listing.description,
        status: listing.status,
        checkInTime: listing.checkInTime,
        checkOutTime: listing.checkOutTime,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      },
      rooms: listing.rooms,
      amenities: listing.amenities.map((a: any) => a.amenity),
      policies,
      media,
      onboarding: onboarding
        ? {
            providerId: onboarding.providerId,
            currentStep: onboarding.currentStep,
            completedSteps: onboarding.completedSteps,
          }
        : null,
    };
  }
}
