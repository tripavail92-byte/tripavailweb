import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProviderOnboardingService } from './provider_onboarding.service';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import {
  HotelStep2BasicsDto,
  HotelStep3LocationDto,
  HotelStep4RoomsDto,
  HotelStep5AmenitiesDto,
  HotelStep6PoliciesDto,
  HotelStep7ReviewDto,
} from './dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';

@ApiTags('provider-onboarding')
@Controller('provider-onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProviderOnboardingController {
  constructor(private readonly service: ProviderOnboardingService) {}

  @Post('start')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Start provider onboarding flow' })
  @ApiResponse({ status: 201, description: 'Onboarding started' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async start(@CurrentUser() user: any, @Body() dto: StartOnboardingDto) {
    return this.service.startOnboarding(user.id, dto.providerType);
  }

  @Patch(':providerId/step')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Update onboarding step progress' })
  @ApiResponse({ status: 200, description: 'Step updated' })
  @ApiResponse({ status: 400, description: 'Invalid step or data' })
  @ApiResponse({ status: 404, description: 'Onboarding not found' })
  async updateStep(@Param('providerId') providerId: string, @Body() dto: UpdateStepDto) {
    return this.service.updateStep(providerId, dto.step, dto.data);
  }

  @Post(':providerId/submit')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Submit onboarding for admin review' })
  @ApiResponse({ status: 200, description: 'Submitted for review' })
  @ApiResponse({ status: 400, description: 'Incomplete steps' })
  @ApiResponse({ status: 404, description: 'Onboarding not found' })
  async submit(@Param('providerId') providerId: string) {
    return this.service.submitForReview(providerId);
  }

  @Get(':providerId/status')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Get onboarding status and progress' })
  @ApiResponse({ status: 200, description: 'Onboarding status' })
  @ApiResponse({ status: 404, description: 'Onboarding not found' })
  async getStatus(@Param('providerId') providerId: string) {
    return this.service.getOnboardingStatus(providerId);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all onboardings for current user' })
  @ApiResponse({ status: 200, description: 'User onboardings' })
  @Roles('TRAVELER', 'ADMIN')
  async list(@CurrentUser() user: any) {
    return this.service.listOnboardings(user.id);
  }

  // ===== HOTEL LISTING 7-STEP ENDPOINTS =====

  @Post(':providerId/hotel/step-2-basics')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 2: Submit hotel basics (name, type, rating, description)' })
  @ApiResponse({ status: 201, description: 'Hotel basics saved' })
  @ApiResponse({ status: 400, description: 'Invalid data or step sequence' })
  async hotelStep2Basics(
    @Param('providerId') providerId: string,
    @Body() dto: HotelStep2BasicsDto,
  ) {
    return this.service.hotelStep2Basics(providerId, dto);
  }

  @Post(':providerId/hotel/step-3-location')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 3: Submit hotel location (address, coordinates)' })
  @ApiResponse({ status: 201, description: 'Location details saved' })
  @ApiResponse({ status: 400, description: 'Invalid data or step sequence' })
  async hotelStep3Location(
    @Param('providerId') providerId: string,
    @Body() dto: HotelStep3LocationDto,
  ) {
    return this.service.hotelStep3Location(providerId, dto);
  }

  @Post(':providerId/hotel/step-4-rooms')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 4: Submit room types (capacity, pricing, inventory)' })
  @ApiResponse({ status: 201, description: 'Room types saved' })
  @ApiResponse({ status: 400, description: 'Invalid data or step sequence' })
  async hotelStep4Rooms(@Param('providerId') providerId: string, @Body() dto: HotelStep4RoomsDto) {
    return this.service.hotelStep4Rooms(providerId, dto);
  }

  @Post(':providerId/hotel/step-5-amenities')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 5: Select amenities from master list' })
  @ApiResponse({ status: 201, description: 'Amenities selected' })
  @ApiResponse({ status: 400, description: 'Invalid amenity IDs or step sequence' })
  async hotelStep5Amenities(
    @Param('providerId') providerId: string,
    @Body() dto: HotelStep5AmenitiesDto,
  ) {
    return this.service.hotelStep5Amenities(providerId, dto);
  }

  @Post(':providerId/hotel/step-6-policies')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 6: Submit policies (cancellation, payment, check-in/out, rules)' })
  @ApiResponse({ status: 201, description: 'Policies saved' })
  @ApiResponse({ status: 400, description: 'Invalid data or step sequence' })
  async hotelStep6Policies(
    @Param('providerId') providerId: string,
    @Body() dto: HotelStep6PoliciesDto,
  ) {
    return this.service.hotelStep6Policies(providerId, dto);
  }

  @Post(':providerId/hotel/step-7-review')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Step 7: Review & submit - creates Listing + Rooms' })
  @ApiResponse({ status: 201, description: 'Hotel listing created successfully' })
  @ApiResponse({ status: 400, description: 'Terms not accepted or incomplete steps' })
  async hotelStep7Review(
    @Param('providerId') providerId: string,
    @Body() dto: HotelStep7ReviewDto,
  ) {
    return this.service.hotelStep7Review(providerId, dto);
  }
}
