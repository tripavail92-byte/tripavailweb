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

@Injectable()
export class HotelPackagesService {
  constructor(private readonly prisma: PrismaService) {}

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

      return { items, total, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
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
    });
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

    return this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async pausePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status !== 'PUBLISHED') {
      throw new BadRequestException('Only PUBLISHED packages can be paused');
    }

    return this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'PAUSED' },
    });
  }

  async archivePackage(providerId: string, packageId: string) {
    const pkg = await this.getOwnedPackageOrThrow(providerId, packageId);
    if (pkg.status === 'ARCHIVED') {
      return this.prisma.hotelPackage.findUniqueOrThrow({ where: { id: packageId } });
    }

    return this.prisma.hotelPackage.update({
      where: { id: packageId },
      data: { status: 'ARCHIVED' },
    });
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
      return this.prisma.hotelPackage.update({ where: { id: packageId }, data: updateData });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hotelPackage.update({ where: { id: packageId }, data: updateData });
      await tx.hotelPackageAmenity.deleteMany({ where: { packageId } });
      await tx.hotelPackageAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ packageId, amenityId })),
        skipDuplicates: true,
      });
      return updated;
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
    return pkg;
  }
}
