import { Module } from '@nestjs/common';
import { TourPackagesController } from './tour-packages.controller';
import { TourPackagesService } from './tour-packages.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TourPackagesController],
  providers: [TourPackagesService, PrismaService],
})
export class TourPackagesModule {}
