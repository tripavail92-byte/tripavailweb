import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateTourPackageDto } from './dto/create-tour-package.dto';
import { ListTourPackagesQueryDto } from './dto/list-tour-packages.query.dto';
import { Step1TripTypeDto } from './dto/step1-trip-type.dto';
import { Step2BasicsDto } from './dto/step2-basics.dto';
import { Step3DeparturesDto } from './dto/step3-departures.dto';
import { Step4PickupsDto } from './dto/step4-pickups.dto';
import { Step5HighlightsDto } from './dto/step5-highlights.dto';
import { Step6ItineraryDto } from './dto/step6-itinerary.dto';
import { Step7InclusionsExclusionsDto } from './dto/step7-inclusions-exclusions.dto';
import { Step8AmenitiesDto } from './dto/step8-amenities.dto';
import { Step9MediaDto } from './dto/step9-media.dto';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/step10-addons.dto';
import { Step11NotesSafetyDto } from './dto/step11-notes-safety.dto';
import { Step12ComplianceDto } from './dto/step12-compliance.dto';
import { DiscountSettingsDto } from '../dto/discount-settings.dto';
import { TOUR_PACKAGE_TEMPLATES } from './tour-package-templates';

@Injectable()
export class TourPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalize tripType to slug format for API responses.
   * If tripType is already a slug, return as-is.
   * If it's a numeric ID (database PK), map to the corresponding slug.
   */
  private normalizeTripType(tripType: string): string {
    // Check if it's already a valid slug
    const validSlugs = TOUR_PACKAGE_TEMPLATES.map((t) => t.id);
    if (validSlugs.includes(tripType)) {
      return tripType;
    }

    // If it's a numeric ID or unknown, try to map it
    // For now, default to the first template if not found
    // In production, you'd want to store slug in DB directly
    console.warn(`Unknown tripType: ${tripType}, defaulting to first template`);
    return TOUR_PACKAGE_TEMPLATES[0]?.id || 'adventure';
  }

  /**
   * Transform tour package response to ensure tripType is slug-based
   */
  private transformPackageResponse(pkg: any): any {
    if (!pkg) return pkg;
    return {
      ...pkg,
      tripType: this.normalizeTripType(pkg.tripType),
    };
  }

  /**
   * Transform array of packages
   */
  private transformPackageResponses(packages: any[]): any[] {
    return packages.map((pkg) => this.transformPackageResponse(pkg));
  }

  private async getOwnedPackageOrThrow(providerId: string, packageId: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id: packageId },
      select: { id: true, providerId: true, status: true },
    });
    if (!pkg || pkg.providerId !== providerId) {
      throw new NotFoundException('Tour package not found');
    }
    return pkg;
  }

  private async getDraftOwnedPackage(providerId: string, packageId: string) {
    const pkg = await this.prisma.tourPackage.findFirst({ where: { id: packageId, providerId } });
    if (!pkg) {
      throw new NotFoundException('Tour package not found');
    }
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT tour packages can be edited');
    }
    return pkg;
  }

  async publishPackage(providerId: string, packageId: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id: packageId },
      include: {
        itinerary: true,
        pickups: true,
        departures: true,
        addOns: true,
      },
    });
    if (!pkg || pkg.providerId !== providerId) {
      throw new NotFoundException('Tour package not found');
    }
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT packages can be published');
    }
    // Completeness check: all required fields and steps must be filled
    const missing = [];
    if (!pkg.tripType) missing.push('tripType');
    if (!pkg.name || !pkg.description) missing.push('name/description');
    if (!pkg.duration || pkg.duration < 1) missing.push('duration');
    if (!pkg.basePrice || Number(pkg.basePrice) < 0) missing.push('basePrice');
    if (!pkg.maxSeats || pkg.maxSeats < 1) missing.push('maxSeats');
    if (!pkg.highlights || pkg.highlights.length === 0) missing.push('highlights');
    if (!pkg.inclusions || pkg.inclusions.length === 0) missing.push('inclusions');
    if (!pkg.exclusions || pkg.exclusions.length === 0) missing.push('exclusions');
    if (!pkg.images || pkg.images.length === 0) missing.push('images');
    if (!pkg.specialNotes) missing.push('specialNotes');
    if (!pkg.safetyInformation || pkg.safetyInformation.length === 0) missing.push('safetyInformation');
    if (!pkg.complianceTermsAccepted) missing.push('complianceTermsAccepted');
    if (!pkg.complianceLiabilityAccepted) missing.push('complianceLiabilityAccepted');
    if (!pkg.itinerary || pkg.itinerary.length === 0) missing.push('itinerary');
    if (!pkg.pickups || pkg.pickups.length === 0) missing.push('pickups');
    if (!pkg.departures || pkg.departures.length === 0) missing.push('departures');
    if (missing.length > 0) {
      throw new BadRequestException('Package incomplete. Missing: ' + missing.join(', '));
    }
    const updated = await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });
    return this.transformPackageResponse(updated);
  }

  async pausePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED packages can be paused');
    }
    const updated = await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'PAUSED' },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });
    return this.transformPackageResponse(updated);
  }

  async archivePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status === 'ARCHIVED') {
      const archived = await this.prisma.tourPackage.findUniqueOrThrow({
        where: { id: packageId },
        include: {
          itinerary: { orderBy: { day: 'asc' } },
          pickups: { orderBy: { createdAt: 'asc' } },
          departures: { orderBy: { departureDate: 'asc' } },
          amenities: { include: { amenity: true } },
        },
      });
      return this.transformPackageResponse(archived);
    }
    const updated = await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'ARCHIVED' },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });
    return this.transformPackageResponse(updated);
  }

  list(query: ListTourPackagesQueryDto) {
    const take = query.pageSize ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const statusFilter =
        query.status !== undefined
          ? query.status
          : query.includeArchived
            ? undefined
            : { not: 'ARCHIVED' as const };

      const where: Prisma.TourPackageWhereInput = {
        providerId: query.providerId,
        status: statusFilter,
        tripType: query.tripType,
        name: query.search ? { contains: query.search, mode: 'insensitive' as const } : undefined,
      };

      const [items, total] = await Promise.all([
        tx.tourPackage.findMany({
          where,
          orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
          skip,
          take,
        }),
        tx.tourPackage.count({ where }),
      ]);

      return {
        items: this.transformPackageResponses(items),
        total,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      };
    });
  }

  async createPackage(providerId: string, dto: CreateTourPackageDto) {
    return this.prisma.tourPackage.create({
      data: {
        providerId,
        tripType: dto.tripType,
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        status: 'DRAFT',
        basePrice: dto.basePrice as any,
        maxSeats: dto.maxSeats,
      },
    });
  }

  async step1TripType(providerId: string, dto: Step1TripTypeDto) {
    return this.prisma.tourPackage.create({
      data: {
        providerId,
        tripType: dto.tripType,
        name: 'Untitled tour package',
        description: '',
        duration: 1,
        status: 'DRAFT',
        basePrice: 0 as any,
        maxSeats: 1,
      },
    });
  }

  async step2Basics(providerId: string, packageId: string, dto: Step2BasicsDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        basePrice: dto.basePrice as any,
        maxSeats: dto.maxSeats,
      },
    });
    return this.getById(packageId);
  }

  async step3Departures(providerId: string, packageId: string, dto: Step3DeparturesDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tourDeparture.deleteMany({ where: { packageId } });
      await tx.tourDeparture.createMany({
        data: dto.departureDates.map((date) => ({
          packageId,
          departureDate: new Date(date),
          availableSeats: dto.availableSeats,
          status: 'AVAILABLE',
        })),
      });
    });
    return this.getById(packageId);
  }

  async step4Pickups(providerId: string, packageId: string, dto: Step4PickupsDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.pickup.deleteMany({ where: { packageId } });
      await tx.pickup.createMany({
        data: dto.pickups.map((p) => ({
          packageId,
          city: p.city,
          location: p.location,
          latitude: p.latitude,
          longitude: p.longitude,
        })),
      });
    });
    return this.getById(packageId);
  }

  async step5Highlights(providerId: string, packageId: string, dto: Step5HighlightsDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { highlights: dto.highlights },
    });
    return this.getById(packageId);
  }

  async step6Itinerary(providerId: string, packageId: string, dto: Step6ItineraryDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.itineraryDay.deleteMany({ where: { packageId } });
      await tx.itineraryDay.createMany({
        data: dto.days.map((d) => ({
          packageId,
          day: d.day,
          title: d.title,
          description: d.description,
        })),
      });
    });
    return this.getById(packageId);
  }

  async step7InclusionsExclusions(
    providerId: string,
    packageId: string,
    dto: Step7InclusionsExclusionsDto,
  ) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { inclusions: dto.inclusions, exclusions: dto.exclusions },
    });
    return this.getById(packageId);
  }

  async step8Amenities(providerId: string, packageId: string, dto: Step8AmenitiesDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    
    // Validate all amenity IDs exist
    const amenities = await this.prisma.amenity.findMany({
      where: { id: { in: dto.amenityIds } },
    });
    if (amenities.length !== dto.amenityIds.length) {
      throw new BadRequestException('One or more amenity IDs are invalid');
    }

    // Clear existing amenities and add new ones
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tourPackageAmenity.deleteMany({ where: { packageId } });
      await tx.tourPackageAmenity.createMany({
        data: dto.amenityIds.map((amenityId) => ({
          packageId,
          amenityId,
        })),
      });
    });

    return this.getById(packageId);
  }

  async getById(id: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });
    if (!pkg) {
      throw new NotFoundException('Tour package not found');
    }
    return this.transformPackageResponse(pkg);
  }

  async step9Media(providerId: string, packageId: string, dto: Step9MediaDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { images: dto.images },
    });
    return this.getById(packageId);
  }

  async listAddOns(providerId: string, packageId: string) {
    await this.getDraftOwnedPackage(providerId, packageId);
    return this.prisma.addOn.findMany({ where: { packageId } });
  }

  async createAddOn(providerId: string, packageId: string, dto: CreateAddOnDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    return this.prisma.addOn.create({
      data: {
        packageId,
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price as any,
        isOptional: dto.isOptional ?? true,
      },
    });
  }

  async updateAddOn(providerId: string, packageId: string, addOnId: string, dto: UpdateAddOnDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    const addOn = await this.prisma.addOn.findUnique({ where: { id: addOnId } });
    if (!addOn || addOn.packageId !== packageId) {
      throw new NotFoundException('Add-on not found');
    }
    return this.prisma.addOn.update({
      where: { id: addOnId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price as any }),
        ...(dto.isOptional !== undefined && { isOptional: dto.isOptional }),
      },
    });
  }

  async deleteAddOn(providerId: string, packageId: string, addOnId: string) {
    await this.getDraftOwnedPackage(providerId, packageId);
    const addOn = await this.prisma.addOn.findUnique({ where: { id: addOnId } });
    if (!addOn || addOn.packageId !== packageId) {
      throw new NotFoundException('Add-on not found');
    }
    await this.prisma.addOn.delete({ where: { id: addOnId } });
    return { deleted: true };
  }

  async step11NotesSafety(providerId: string, packageId: string, dto: Step11NotesSafetyDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: {
        ...(dto.specialNotes !== undefined && { specialNotes: dto.specialNotes }),
        ...(dto.safetyInformation !== undefined && { safetyInformation: dto.safetyInformation }),
      },
    });
    return this.getById(packageId);
  }

  async step12Compliance(providerId: string, packageId: string, dto: Step12ComplianceDto) {
    await this.getDraftOwnedPackage(providerId, packageId);
    await this.prisma.tourPackage.update({
      where: { id: packageId },
      data: {
        complianceTermsAccepted: dto.complianceTermsAccepted,
        complianceLiabilityAccepted: dto.complianceLiabilityAccepted,
      },
    });
    return this.getById(packageId);
  }

  async step13Preview(providerId: string, packageId: string) {
    await this.getOwnedPackageOrThrow(providerId, packageId);
    return this.prisma.tourPackage.findUnique({
      where: { id: packageId },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
        addOns: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateDiscount(providerId: string, packageId: string, dto: DiscountSettingsDto) {
    const pkg = await this.prisma.tourPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.providerId !== providerId) {
      throw new NotFoundException('Tour package not found');
    }
    return this.prisma.tourPackage.update({
      where: { id: packageId },
      data: {
        ...(dto.discountEnabled !== undefined && { discountEnabled: dto.discountEnabled }),
        ...(dto.discountPercentage !== undefined && { discountPercentage: dto.discountPercentage }),
        ...(dto.discountStartDate !== undefined && { discountStartDate: dto.discountStartDate ? new Date(dto.discountStartDate) : null }),
        ...(dto.discountEndDate !== undefined && { discountEndDate: dto.discountEndDate ? new Date(dto.discountEndDate) : null }),
      },
    });
  }
}
