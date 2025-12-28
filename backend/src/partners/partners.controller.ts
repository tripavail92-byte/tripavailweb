import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { StartPartnerDto } from './dto/start-partner.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';

@ApiTags('partners')
@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('start')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'Start partner onboarding (hotel manager or tour operator)' })
  @ApiResponse({ status: 201 })
  start(@Body() dto: StartPartnerDto, @CurrentUser() user: any) {
    return this.partnersService.start({ ...dto, userId: user.id });
  }

  @Get('me')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({ summary: 'List provider profiles for current user' })
  @ApiResponse({ status: 200 })
  me(@CurrentUser() user: any) {
    return this.partnersService.me(user.id);
  }
}
