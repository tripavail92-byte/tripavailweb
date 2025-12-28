import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StartOtpDto } from './dto/start-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { randomUUID } from 'crypto';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async start(dto: StartOtpDto) {
    const target = dto.channel === 'phone' ? dto.phone : dto.email;
    if (!target) throw new BadRequestException('Target is required');

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.authOtp.create({
      data: {
        id: randomUUID(),
        target,
        channel: dto.channel,
        purpose: dto.purpose,
        code,
        expiresAt,
      },
    });

    // TODO: integrate SMS/email provider. For now, return code for local testing only.
    return { status: 'sent', channel: dto.channel, target, code }; // remove code in production
  }

  async verify(dto: VerifyOtpDto) {
    const target = dto.channel === 'phone' ? dto.phone : dto.email;
    if (!target) throw new BadRequestException('Target is required');

    const otp = await this.prisma.authOtp.findFirst({
      where: {
        target,
        channel: dto.channel,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new UnauthorizedException('Code expired or not found');
    if (otp.code !== dto.code) throw new UnauthorizedException('Invalid code');

    await this.prisma.authOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date(), attempts: { increment: 1 } },
    });

    // Upsert user with default TRAVELER role
    const user = await this.prisma.user.upsert({
      where: target.includes('@') ? { email: target } : { phone: target },
      update: {
        email: dto.channel === 'email' ? target : undefined,
        phone: dto.channel === 'phone' ? target : undefined,
        emailVerified: dto.channel === 'email' ? true : undefined,
        phoneVerified: dto.channel === 'phone' ? true : undefined,
      },
      create: {
        email: dto.channel === 'email' ? target : undefined,
        phone: dto.channel === 'phone' ? target : undefined,
        role: 'TRAVELER',
        emailVerified: dto.channel === 'email',
        phoneVerified: dto.channel === 'phone',
      },
    });

    // TODO: replace with real JWTs
    return {
      accessToken: `mock-access-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
      user,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: {
          include: { onboarding: true },
        },
      },
    });
    return user ?? {};
  }
}
