import { Module } from '@nestjs/common';
import { HotelPackagesController } from './hotel-packages.controller';
import { HotelPackagesService } from './hotel-packages.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [HotelPackagesController],
  providers: [HotelPackagesService, PrismaService],
})
export class HotelPackagesModule {}
