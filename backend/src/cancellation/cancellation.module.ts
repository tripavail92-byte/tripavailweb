import { Module } from '@nestjs/common';
import { CancellationService } from './cancellation.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [CancellationService, PrismaService],
  exports: [CancellationService],
})
export class CancellationModule {}
