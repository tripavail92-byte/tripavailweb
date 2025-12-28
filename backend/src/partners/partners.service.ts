import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StartPartnerDto } from './dto/start-partner.dto';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async start(dto: StartPartnerDto) {
    if (!dto.userId) throw new BadRequestException('userId is required temporarily');

    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId_providerType: { userId: dto.userId, providerType: dto.providerType } },
    });

    if (existing) {
      return { providerId: existing.id, verificationStatus: existing.verificationStatus };
    }

    const profile = await this.prisma.providerProfile.create({
      data: {
        userId: dto.userId,
        providerType: dto.providerType,
        verificationStatus: VerificationStatus.NOT_STARTED,
      },
    });

    await this.prisma.providerOnboarding.upsert({
      where: { providerId: profile.id },
      update: {},
      create: { providerId: profile.id },
    });

    return { providerId: profile.id, verificationStatus: profile.verificationStatus };
  }

  async me(userId: string) {
    if (!userId) throw new BadRequestException('userId is required temporarily');
    const profiles = await this.prisma.providerProfile.findMany({
      where: { userId },
      include: { onboarding: true },
    });
    return profiles;
  }
}
