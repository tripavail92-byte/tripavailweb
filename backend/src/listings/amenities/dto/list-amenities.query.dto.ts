import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const sortFields = ['name', 'createdAt'] as const;
const sortOrders = ['asc', 'desc'] as const;

export class ListAmenitiesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Search by name (ILIKE)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', enum: sortFields, default: 'name' })
  @IsOptional()
  @IsIn(sortFields)
  sortBy?: (typeof sortFields)[number] = 'name';

  @ApiPropertyOptional({ description: 'Sort order', enum: sortOrders, default: 'asc' })
  @IsOptional()
  @IsIn(sortOrders)
  sortOrder?: (typeof sortOrders)[number] = 'asc';
}
