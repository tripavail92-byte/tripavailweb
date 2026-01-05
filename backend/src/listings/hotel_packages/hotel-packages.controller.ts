import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HotelPackagesService } from './hotel-packages.service';
import { JwtAuthGuard } from '../../rbac/guards/jwt-auth.guard';
import { ProviderOwnerGuard } from '../../providers/guards/provider-owner.guard';
import { VerifiedProviderGuard } from '../../providers/guards/verified-provider.guard';
import { CreateHotelPackageDto } from './dto/create-hotel-package.dto';
import { ListHotelPackagesQueryDto } from './dto/list-hotel-packages.query.dto';
import { HOTEL_PACKAGE_TEMPLATES } from './hotel-package-templates';
import { UpdateHotelPackageDto } from './dto/update-hotel-package.dto';
import { DiscountSettingsDto } from '../dto/discount-settings.dto';

@ApiTags('hotel-packages')
@Controller('hotel-packages')
export class HotelPackagesController {
  // inject to keep pattern consistent; use in future methods
  constructor(public readonly service: HotelPackagesService) {}

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  ping() {
    return { ok: true, module: 'hotel-packages' };
  }

  @Get()
  @ApiOperation({ summary: 'List hotel packages' })
  @ApiResponse({ status: 200, description: 'List of hotel packages' })
  list(@Query() query: ListHotelPackagesQueryDto) {
    return this.service.list(query);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List hotel package templates' })
  @ApiResponse({ status: 200, description: 'List of supported hotel package templates' })
  templates() {
    return { items: HOTEL_PACKAGE_TEMPLATES };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hotel package by id' })
  @ApiResponse({ status: 200, description: 'Hotel package detail with amenities' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post(':providerId/packages')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Create hotel package' })
  @ApiResponse({ status: 201, description: 'Hotel package created in DRAFT status' })
  async createHotelPackage(
    @Param('providerId') providerId: string,
    @Body() dto: CreateHotelPackageDto,
  ) {
    return this.service.createPackage(providerId, dto);
  }

  @Post(':providerId/packages/:packageId/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, VerifiedProviderGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Publish a hotel package (requires verified provider)' })
  @ApiResponse({ status: 200, description: 'Hotel package published' })
  async publish(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.publishPackage(providerId, packageId);
  }

  @Post(':providerId/packages/:packageId/pause')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Pause a published hotel package' })
  @ApiResponse({ status: 200, description: 'Hotel package paused' })
  async pause(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.pausePackage(providerId, packageId);
  }

  @Post(':providerId/packages/:packageId/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Archive a hotel package' })
  @ApiResponse({ status: 200, description: 'Hotel package archived' })
  async archive(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.archivePackage(providerId, packageId);
  }

  @Patch(':providerId/packages/:packageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Update a hotel package (DRAFT only)' })
  @ApiResponse({ status: 200, description: 'Hotel package updated' })
  async update(
    @Param('providerId') providerId: string,
    @Param('packageId') packageId: string,
    @Body() dto: UpdateHotelPackageDto,
  ) {
    return this.service.updatePackage(providerId, packageId, dto);
  }

  @Delete(':providerId/packages/:packageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Delete a hotel package (DRAFT only)' })
  @ApiResponse({ status: 200, description: 'Hotel package deleted' })
  async remove(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.deletePackage(providerId, packageId);
  }

  @Patch(':providerId/packages/:packageId/discount')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'HotelPackage id' })
  @ApiOperation({ summary: 'Update discount settings for a hotel package' })
  @ApiResponse({ status: 200, description: 'Hotel package discount updated' })
  async updateDiscount(
    @Param('providerId') providerId: string,
    @Param('packageId') packageId: string,
    @Body() dto: DiscountSettingsDto,
  ) {
    return this.service.updateDiscount(providerId, packageId, dto);
  }
}
