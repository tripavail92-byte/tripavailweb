import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { ListAmenitiesQueryDto } from './dto/list-amenities.query.dto';

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListAmenitiesQueryDto) {
    const take = query.pageSize ?? 20;
    const skip = ((query.page ?? 1) - 1) * take;
    return this.prisma.$transaction(async (tx) => {
      const where: Prisma.AmenityWhereInput = {
        category: query.category,
        name: query.search ? { contains: query.search, mode: 'insensitive' as const } : undefined,
      };

      const [items, total] = await Promise.all([
        tx.amenity.findMany({
          where,
          orderBy: { [query.sortBy ?? 'name']: query.sortOrder ?? 'asc' },
          skip,
          take,
        }),
        tx.amenity.count({ where }),
      ]);

      return { items, total, page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
    });
  }

  create(dto: CreateAmenityDto) {
    return this.prisma.amenity.create({ data: { name: dto.name, category: dto.category } });
  }

  async update(id: string, dto: UpdateAmenityDto) {
    try {
      return await this.prisma.amenity.update({ where: { id }, data: { ...dto } });
    } catch {
      throw new NotFoundException('Amenity not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.amenity.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Amenity not found');
    }
  }
}
