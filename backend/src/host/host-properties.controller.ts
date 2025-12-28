import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { ListingOwnerGuard } from '../providers/guards/listing-owner.guard';
import { HostPropertiesService } from './host-properties.service';

@ApiTags('host-properties')
@Controller('host/properties')
export class HostPropertiesController {
  constructor(private readonly service: HostPropertiesService) {}

  @Get(':id/snapshot')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ListingOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Listing id (property)' })
  @ApiOperation({ summary: 'Get host property snapshot (property + rooms + amenities + policies)' })
  @ApiResponse({ status: 200, description: 'Snapshot for prefilling hotel package creation' })
  async snapshot(@Param('id') listingId: string) {
    return this.service.getSnapshot(listingId);
  }
}
