import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateOperatorProfileDto } from './dto';

@Injectable()
export class OperatorProfileService {
  constructor(private prisma: PrismaService) {}

  async getOperatorProfile(providerId: string) {
    // Verify provider exists and is a TOUR_OPERATOR
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (provider.providerType !== 'TOUR_OPERATOR') {
      throw new BadRequestException('This provider is not a tour operator');
    }

    // Get or create operator profile
    let operatorProfile = await this.prisma.operatorProfile.findUnique({
      where: { providerId },
    });

    if (!operatorProfile) {
      operatorProfile = await this.prisma.operatorProfile.create({
        data: { providerId },
      });
    }

    return operatorProfile;
  }

  async updateOperatorProfile(providerId: string, dto: UpdateOperatorProfileDto) {
    // Verify provider exists and is a TOUR_OPERATOR
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (provider.providerType !== 'TOUR_OPERATOR') {
      throw new BadRequestException('This provider is not a tour operator');
    }

    // Get or create operator profile if it doesn't exist
    let operatorProfile = await this.prisma.operatorProfile.findUnique({
      where: { providerId },
    });

    if (!operatorProfile) {
      operatorProfile = await this.prisma.operatorProfile.create({
        data: { providerId },
      });
    }

    // Update with provided fields
    const updated = await this.prisma.operatorProfile.update({
      where: { providerId },
      data: {
        ...(dto.baseCity !== undefined && { baseCity: dto.baseCity || null }),
        ...(dto.baseLatitude !== undefined && { baseLatitude: dto.baseLatitude || null }),
        ...(dto.baseLongitude !== undefined && { baseLongitude: dto.baseLongitude || null }),
        ...(dto.meetingPoint !== undefined && { meetingPoint: dto.meetingPoint || null }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone || null }),
      },
    });

    return updated;
  }

  async getByProviderId(providerId: string) {
    return this.prisma.operatorProfile.findUnique({
      where: { providerId },
    });
  }
}
