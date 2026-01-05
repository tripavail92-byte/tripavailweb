import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { ProviderOwnerGuard } from '../providers/guards/provider-owner.guard';
import { OperatorProfileService } from './operator-profile.service';
import { UpdateOperatorProfileDto } from './dto';

@ApiTags('Operator Profile')
@Controller('operator-profile')
@ApiBearerAuth()
export class OperatorProfileController {
  constructor(private service: OperatorProfileService) {}

  @Get(':providerId')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiOperation({ summary: 'Get operator profile by provider ID' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Operator profile retrieved' })
  @ApiResponse({ status: 404, description: 'Provider or operator profile not found' })
  async getOperatorProfile(@Param('providerId') providerId: string) {
    return this.service.getOperatorProfile(providerId);
  }

  @Patch(':providerId')
  @UseGuards(JwtAuthGuard, ProviderOwnerGuard)
  @ApiOperation({ summary: 'Update operator profile location and contact info' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiBody({
    type: UpdateOperatorProfileDto,
    description: 'Operator profile fields to update',
  })
  @ApiResponse({ status: 200, description: 'Operator profile updated' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 400, description: 'Invalid provider type or data' })
  async updateOperatorProfile(
    @Param('providerId') providerId: string,
    @Body() dto: UpdateOperatorProfileDto,
  ) {
    return this.service.updateOperatorProfile(providerId, dto);
  }
}
