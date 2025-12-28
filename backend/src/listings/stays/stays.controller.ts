import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StaysService } from './stays.service';
import { JwtAuthGuard } from '../../rbac/guards/jwt-auth.guard';
import { ProviderOwnerGuard } from '../../providers/guards/provider-owner.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListStaysQueryDto } from './dto/list-stays.query.dto';

@ApiTags('stays')
@Controller('stays')
export class StaysController {
  // inject to keep pattern consistent; use in future methods
  constructor(public readonly service: StaysService) {}

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  ping() {
    return { ok: true, module: 'stays' };
  }

  @Get()
  @ApiOperation({ summary: 'List stay listings' })
  @ApiResponse({ status: 200, description: 'List of stays' })
  list(@Query() query: ListStaysQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stay listing by id' })
  @ApiResponse({ status: 200, description: 'Stay listing detail with amenities' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  // Placeholder for creating a stay listing - gated by provider verification
  @Post(':providerId/listings')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create stay listing' })
  @ApiResponse({ status: 201, description: 'Stay created in DRAFT status' })
  async createStayListing(@Param('providerId') providerId: string, @Body() dto: CreateListingDto) {
    return this.service.createListing(providerId, dto);
  }
}
