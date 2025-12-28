import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KycModule } from '../kyc/kyc.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [KycModule, AuditModule],
  controllers: [AdminController],
  providers: [PrismaService],
})
export class AdminModule {}
