import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateHotelPackageDto } from './dto/create-hotel-package.dto';
import { ListHotelPackagesQueryDto } from './dto/list-hotel-packages.query.dto';
import { UpdateHotelPackageDto } from './dto/update-hotel-package.dto';
import { DiscountSettingsDto } from '../dto/discount-settings.dto';
import { HOTEL_PACKAGE_TEMPLATES } from './hotel-package-templates';

@Injectable()
export class HotelPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalize templateId to slug format for API responses.
   * If templateId is already a slug, return as-is.
   * If it's a numeric ID (database PK), map to the corresponding slug.
   */
  private normalizeTemplateId(templateId: string): string {
    // Check if it's already a valid slug
    const validSlugs = HOTEL_PACKAGE_TEMPLATES.map((t) => t.id);
    if (validSlugs.includes(templateId)) {
      return templateId;
    }

    // If it's a numeric ID or unknown, try to map it
    // For now, default to the first template if not found
    // In production, you'd want to store slug in DB directly
    console.warn(`Unknown templateId: ${templateId}, defaulting to first template`);
    return HOTEL_PACKAGE_TEMPLATES[0]?.id || 'weekend-getaway';
  }

  /**
   * Transform hotel package response to ensure templateId is slug-based
   */
  private transformPackageResponse(pkg: any): any {
    if (!pkg) return pkg;
    return {
      ...pkg,
      templateId: this.normalizeTemplateId(pkg.templateId),
    };
  }

  /**
   * Transform array of packages
   */
  private transformPackageResponses(packages: any[]): any[] {
    return packages.map((pkg) => this.transformPackageResponse(pkg));
  }

  list(query: ListHotelPackagesQueryDto) {
    const take = query.pageSize ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;
    return this.prisma.$transaction(async (tx) => {
      const statusFilter =
        query.status !== undefined
          ? query.status
          : query.includeArchived
            ? undefined
            : { not: 'ARCHIVED' as const };

      const where: Prisma.HotelPackageWhereInput = {
        providerId: query.providerId,
        status: statusFilter,
        templateId: query.templateId,
        listingId: query.listingId,
        name: query.search ? { contains: query.search, mode: 'insensitive' as const } : undefined,
      };

      const [items, total] = await Promise.all([
        tx.hotelPackage.findMany({
          where,
          orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
          skip,
          take,
          include: {
            amenities: { include: { amenity: true } },
          },
        }),
        tx.hotelPackage.count({ where }),
      ]);

      return {
        items: this.transformPackageResponses(items),
        total,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      };
    });
  }

  async createPackage(providerId: string, dto: CreateHotelPackageDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, providerId: true },
    });
    if (!listing) {
      throw new BadRequestException('listingId is invalid');
    }
    if (listing.providerId !== providerId) {
      throw new ForbiddenException('Listing does not belong to provider');
    }

    if (dto.amenityIds && dto.amenityIds.length > 0) {
      const amenities = await this.prisma.amenity.findMany({
        where: { id: { in: dto.amenityIds } },
        select: { id: true },
      });
      if (amenities.length !== dto.amenityIds.length) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'One or more amenityIds are invalid',
          error: 'Bad Request',
          code: 'INVALID_AMENITY_IDS',
          path: 'amenityIds',
        });
      }
    }

    return this.prisma.hotelPackage.create({
      data: {
        providerId,
        listingId: dto.listingId,
        templateId: dto.templateId,
        name: dto.name,
        description: dto.description,
        status: 'DRAFT',
        pricePerPerson: dto.pricePerPerson as any,
        inclusions: dto.inclusions ?? [],
        exclusions: dto.exclusions ?? [],
        availabilityRule: dto.availabilityRule,
        amenities: dto.amenityIds
          ? {
              createMany: {
                data: dto.amenityIds.map((amenityId) => ({ amenityId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: { amenities: { include: { amenity: true } } },
    }).then((pkg) => this.transformPackageResponse(pkg));
  }

  private async getOwnedPackageOrThrow(providerId: string, packageId: string) {
    const pkg = await this.prisma.hotelPackage.findUnique({
      where: { id: packageId },
      select: { id: true, providerId: true, status: true },
    });
    if (!pkg || pkg.providerId !== providerId) {
      throw new NotFoundException('Hotel package not found');
    }
    return pkg;
  }

  async publishPackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT packages can be published');
    }

    const updated = await this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: { amenities: { include: { amenity: true } } },
    });
    return this.transformPackageResponse(updated);
  }

  async pausePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED packages can be paused');
    }

    const updated = await this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'PAUSED' },
      include: { amenities: { include: { amenity: true } } },
    });
    return this.transformPackageResponse(updated);
  }

  async archivePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status === 'ARCHIVED') {
      const archived = await this.prisma.hotelPackage.findUniqueOrThrow({
        where: { id: packageId },
        include: { amenities: { include: { amenity: true } } },
      });
      return this.transformPackageResponse(archived);
    }

    const updated = await this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'ARCHIVED' },
      include: { amenities: { include: { amenity: true } } },
    });
    return this.transformPackageResponse(updated);
  }

  async updatePackage(providerId: string, packageId: string, dto: UpdateHotelPackageDto) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT packages can be updated');
    }

    if (dto.amenityIds && dto.amenityIds.length > 0) {
      const amenities = await this.prisma.amenity.findMany({
        where: { id: { in: dto.amenityIds } },
        select: { id: true },
      });
      if (amenities.length !== dto.amenityIds.length) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'One or more amenityIds are invalid',
          error: 'Bad Request',
          code: 'INVALID_AMENITY_IDS',
          path: 'amenityIds',
        });
      }
    }

    const updateData: Prisma.HotelPackageUpdateInput = {
      templateId: dto.templateId,
      name: dto.name,
      description: dto.description,
      pricePerPerson: dto.pricePerPerson !== undefined ? (dto.pricePerPerson as any) : undefined,
      inclusions: dto.inclusions,
      exclusions: dto.exclusions,
      availabilityRule: dto.availabilityRule,
    };

    const amenityIds = dto.amenityIds;
    if (!amenityIds) {
      const updated = await this.prisma.hotelPackage.update({
        where: { id: packageId },
        data: updateData,
        include: { amenities: { include: { amenity: true } } },
      });
      return this.transformPackageResponse(updated);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hotelPackage.update({
        where: { id: packageId },
        data: updateData,
        include: { amenities: { include: { amenity: true } } },
      });
      await tx.hotelPackageAmenity.deleteMany({ where: { packageId } });
      await tx.hotelPackageAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ packageId, amenityId })),
        skipDuplicates: true,
      });
      return this.transformPackageResponse(updated);
    });
  }

  async deletePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT packages can be deleted');
    }
    await this.prisma.hotelPackage.delete({ where: { id: packageId } });
    return { deleted: true };
  }

  async getById(id: string) {
    const pkg = await this.prisma.hotelPackage.findUnique({
      where: { id },
      include: { amenities: { include: { amenity: true } } },
    });
    if (!pkg) {
      throw new NotFoundException('Hotel package not found');
    }
    return this.transformPackageResponse(pkg);
  }

  async updateDiscount(providerId: string, packageId: string, dto: DiscountSettingsDto) {
    const pkg = await this.prisma.hotelPackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.providerId !== providerId) {
      throw new NotFoundException('Hotel package not found');
    }
    const updated = await this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: {
        ...(dto.discountEnabled !== undefined && { discountEnabled: dto.discountEnabled }),
        ...(dto.discountPercentage !== undefined && { discountPercentage: dto.discountPercentage }),
        ...(dto.discountStartDate !== undefined && { discountStartDate: dto.discountStartDate ? new Date(dto.discountStartDate) : null }),
        ...(dto.discountEndDate !== undefined && { discountEndDate: dto.discountEndDate ? new Date(dto.discountEndDate) : null }),
      },
      include: { amenities: { include: { amenity: true } } },
    });
    return this.transformPackageResponse(updated);
  }
}
