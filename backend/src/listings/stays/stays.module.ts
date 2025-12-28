import { Module } from '@nestjs/common';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [StaysController],
  providers: [StaysService, PrismaService],
})
export class StaysModule {}
