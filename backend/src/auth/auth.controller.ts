import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { StartOtpDto } from './dto/start-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('start')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({ summary: 'Start OTP flow (phone/email)' })
  @ApiResponse({ status: 201, description: 'OTP created and sent' })
  startOtp(@Body() dto: StartOtpDto) {
    return this.authService.start(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes
  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP and login/upsert user' })
  @ApiResponse({ status: 200, description: 'Returns access/refresh tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verify(dto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200 })
  refresh(@CurrentUser() user: any) {
    // Will implement proper refresh token logic later
    return { accessToken: 'mock-access', refreshToken: 'mock-refresh', userId: user.id };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: any) {
    return this.authService.me(user.id);
  }
}
