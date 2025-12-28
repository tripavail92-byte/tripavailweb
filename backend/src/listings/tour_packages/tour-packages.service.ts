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

@Injectable()
export class TourPackagesService {
  constructor(private readonly prisma: PrismaService) {}

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
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT packages can be published');
    }

    return this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async pausePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED packages can be paused');
    }

    return this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'PAUSED' },
    });
  }

  async archivePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status === 'ARCHIVED') {
      return this.prisma.tourPackage.findUniqueOrThrow({ where: { id: packageId } });
    }

    return this.prisma.tourPackage.update({
      where: { id: packageId },
      data: { status: 'ARCHIVED' },
    });
  }

  list(query: ListTourPackagesQueryDto) {
    const take = query.pageSize ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;
    return this.prisma.$transaction(async (tx) => {
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

      return { items, total, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
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
    // Create a minimal DRAFT package. Required fields are filled with placeholders
    // and will be set properly in Step 2.
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

    await this.prisma.$transaction(async (tx) => {
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

    await this.prisma.$transaction(async (tx) => {
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

    await this.prisma.$transaction(async (tx) => {
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

  async getById(id: string) {
    const pkg = await this.prisma.tourPackage.findUnique({
      where: { id },
      include: {
        itinerary: { orderBy: { day: 'asc' } },
        pickups: { orderBy: { createdAt: 'asc' } },
        departures: { orderBy: { departureDate: 'asc' } },
      },
    });
    if (!pkg) {
      throw new NotFoundException('Tour package not found');
    }
    return pkg;
  }
}
