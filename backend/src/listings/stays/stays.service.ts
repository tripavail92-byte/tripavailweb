import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListStaysQueryDto } from './dto/list-stays.query.dto';

@Injectable()
export class StaysService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListStaysQueryDto) {
    const take = query.pageSize ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const statusFilter =
        query.status !== undefined
          ? query.status
          : query.includeArchived
            ? undefined
            : { not: 'ARCHIVED' as const };

      const where: Prisma.ListingWhereInput = {
        providerId: query.providerId,
        status: statusFilter,
        city: query.city,
        name: query.search ? { contains: query.search, mode: 'insensitive' as const } : undefined,
      };

      const [items, total] = await Promise.all([
        tx.listing.findMany({
          where,
          orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
          skip,
          take,
          include: {
            amenities: { include: { amenity: true } },
          },
        }),
        tx.listing.count({ where }),
      ]);
      return { items, total, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    });
  }

  async getById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { amenities: { include: { amenity: true } } },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async createListing(providerId: string, dto: CreateListingDto) {
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

    return this.prisma.listing.create({
      data: {
        providerId,
        name: dto.name,
        address: dto.address,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        status: 'DRAFT',
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
}
