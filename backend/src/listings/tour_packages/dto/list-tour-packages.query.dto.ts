import { IsOptional, IsString, IsIn, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const packageStatuses = ['DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED'] as const;
export type PackageStatusType = (typeof packageStatuses)[number];
const sortFields = ['createdAt', 'name'] as const;
const sortOrders = ['asc', 'desc'] as const;

export class ListTourPackagesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by provider ID' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: packageStatuses })
  @IsOptional()
  @IsIn(packageStatuses)
  status?: PackageStatusType;

  @ApiPropertyOptional({ description: 'Filter by trip type' })
  @IsOptional()
  @IsString()
  tripType?: string;

  @ApiPropertyOptional({ description: 'Search by name (ILIKE)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Include archived packages', default: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean = false;

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

  @ApiPropertyOptional({ description: 'Sort field', enum: sortFields, default: 'createdAt' })
  @IsOptional()
  @IsIn(sortFields)
  sortBy?: (typeof sortFields)[number] = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: sortOrders, default: 'desc' })
  @IsOptional()
  @IsIn(sortOrders)
  sortOrder?: (typeof sortOrders)[number] = 'desc';
}
