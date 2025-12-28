import { Module } from '@nestjs/common';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AmenitiesController],
  providers: [AmenitiesService, PrismaService],
})
export class AmenitiesModule {}
