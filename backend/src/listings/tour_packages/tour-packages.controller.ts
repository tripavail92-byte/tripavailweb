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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TourPackagesService } from './tour-packages.service';
import { JwtAuthGuard } from '../../rbac/guards/jwt-auth.guard';
import { ProviderOwnerGuard } from '../../providers/guards/provider-owner.guard';
import { VerifiedProviderGuard } from '../../providers/guards/verified-provider.guard';
import { CreateTourPackageDto } from './dto/create-tour-package.dto';
import { ListTourPackagesQueryDto } from './dto/list-tour-packages.query.dto';
import { Step1TripTypeDto } from './dto/step1-trip-type.dto';
import { Step2BasicsDto } from './dto/step2-basics.dto';
import { Step3DeparturesDto } from './dto/step3-departures.dto';
import { Step4PickupsDto } from './dto/step4-pickups.dto';
import { Step5HighlightsDto } from './dto/step5-highlights.dto';
import { Step6ItineraryDto } from './dto/step6-itinerary.dto';
import { Step7InclusionsExclusionsDto } from './dto/step7-inclusions-exclusions.dto';
import { Step8AmenitiesDto } from './dto/step8-amenities.dto';
import { Step9MediaDto } from './dto/step9-media.dto';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/step10-addons.dto';
import { Step11NotesSafetyDto } from './dto/step11-notes-safety.dto';
import { Step12ComplianceDto } from './dto/step12-compliance.dto';
import { DiscountSettingsDto } from '../dto/discount-settings.dto';
import { TOUR_PACKAGE_TEMPLATES } from './tour-package-templates';

@ApiTags('tour-packages')
@Controller('tour-packages')
export class TourPackagesController {
  constructor(public readonly service: TourPackagesService) {}

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  ping() {
    return { ok: true, module: 'tour-packages' };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List tour package templates' })
  @ApiResponse({ status: 200, description: 'List of supported tour package templates' })
  templates() {
    return { items: TOUR_PACKAGE_TEMPLATES };
  }

  @Get()
  @ApiOperation({ summary: 'List tour packages' })
  @ApiResponse({ status: 200, description: 'List of tour packages' })
  list(@Query() query: ListTourPackagesQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tour package by id' })
  @ApiResponse({ status: 200, description: 'Tour package detail' })
  getOne(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post(':providerId/packages')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Create tour package' })
  @ApiResponse({ status: 201, description: 'Tour package created in DRAFT status' })
  async createTourPackage(
    @Param('providerId') providerId: string,
    @Body() dto: CreateTourPackageDto,
  ) {
    return this.service.createPackage(providerId, dto);
  }

  @Post(':providerId/packages/:packageId/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, VerifiedProviderGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'TourPackage id' })
  @ApiOperation({ summary: 'Publish a tour package (requires verified provider)' })
  @ApiResponse({ status: 200, description: 'Tour package published' })
  async publish(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.publishPackage(providerId, packageId);
  }

  @Post(':providerId/packages/:packageId/pause')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'TourPackage id' })
  @ApiOperation({ summary: 'Pause a published tour package' })
  @ApiResponse({ status: 200, description: 'Tour package paused' })
  async pause(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.pausePackage(providerId, packageId);
  }

  @Post(':providerId/packages/:packageId/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'packageId', description: 'TourPackage id' })
  @ApiOperation({ summary: 'Archive a tour package' })
  @ApiResponse({ status: 200, description: 'Tour package archived' })
  async archive(@Param('providerId') providerId: string, @Param('packageId') packageId: string) {
    return this.service.archivePackage(providerId, packageId);
  }

  @Post(':providerId/packages/step1')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 1: Set trip type (creates DRAFT package)' })
  @ApiResponse({ status: 201, description: 'Tour package created in DRAFT status' })
  async step1TripType(@Param('providerId') providerId: string, @Body() dto: Step1TripTypeDto) {
    return this.service.step1TripType(providerId, dto);
  }

  @Patch(':providerId/packages/:id/step2-basics')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 2: Set basics' })
  async step2Basics(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step2BasicsDto,
  ) {
    return this.service.step2Basics(providerId, id, dto);
  }

  @Put(':providerId/packages/:id/step3-departures')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 3: Set departures (replace)' })
  async step3Departures(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step3DeparturesDto,
  ) {
    return this.service.step3Departures(providerId, id, dto);
  }

  @Put(':providerId/packages/:id/step4-pickups')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 4: Set pickups (replace)' })
  async step4Pickups(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step4PickupsDto,
  ) {
    return this.service.step4Pickups(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/step5-highlights')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 5: Set highlights' })
  async step5Highlights(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step5HighlightsDto,
  ) {
    return this.service.step5Highlights(providerId, id, dto);
  }

  @Put(':providerId/packages/:id/step6-itinerary')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 6: Set itinerary (replace)' })
  async step6Itinerary(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step6ItineraryDto,
  ) {
    return this.service.step6Itinerary(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/step7-inclusions-exclusions')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 7: Set inclusions and exclusions' })
  async step7InclusionsExclusions(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step7InclusionsExclusionsDto,
  ) {
    return this.service.step7InclusionsExclusions(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/step8-amenities')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 8: Select amenities from global list' })
  async step8Amenities(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step8AmenitiesDto,
  ) {
    return this.service.step8Amenities(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/step9-media')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 9: Set media (images)' })
  async step9Media(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step9MediaDto,
  ) {
    return this.service.step9Media(providerId, id, dto);
  }

  @Get(':providerId/packages/:id/addons')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'List add-ons for a tour package' })
  async listAddOns(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
  ) {
    return this.service.listAddOns(providerId, id);
  }

  @Post(':providerId/packages/:id/addons')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Create an add-on for a tour package' })
  async createAddOn(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: CreateAddOnDto,
  ) {
    return this.service.createAddOn(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/addons/:addOnId')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Update an add-on for a tour package' })
  async updateAddOn(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Param('addOnId') addOnId: string,
    @Body() dto: UpdateAddOnDto,
  ) {
    return this.service.updateAddOn(providerId, id, addOnId, dto);
  }

  @Delete(':providerId/packages/:id/addons/:addOnId')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Delete an add-on for a tour package' })
  async deleteAddOn(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Param('addOnId') addOnId: string,
  ) {
    return this.service.deleteAddOn(providerId, id, addOnId);
  }

  @Patch(':providerId/packages/:id/step11-notes-safety')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 11: Set special notes and safety information' })
  async step11NotesSafety(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step11NotesSafetyDto,
  ) {
    return this.service.step11NotesSafety(providerId, id, dto);
  }

  @Patch(':providerId/packages/:id/step12-compliance')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 12: Set compliance acceptance' })
  async step12Compliance(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: Step12ComplianceDto,
  ) {
    return this.service.step12Compliance(providerId, id, dto);
  }

  @Get(':providerId/packages/:id/step13-preview')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiOperation({ summary: 'Step 13: Preview all package data for final review' })
  async step13Preview(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
  ) {
    return this.service.step13Preview(providerId, id);
  }

  @Patch(':providerId/packages/:id/discount')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'providerId', description: 'ProviderProfile id' })
  @ApiParam({ name: 'id', description: 'TourPackage id' })
  @ApiOperation({ summary: 'Update discount settings for a tour package' })
  @ApiResponse({ status: 200, description: 'Tour package discount updated' })
  async updateDiscount(
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() dto: DiscountSettingsDto,
  ) {
    return this.service.updateDiscount(providerId, id, dto);
  }
}
