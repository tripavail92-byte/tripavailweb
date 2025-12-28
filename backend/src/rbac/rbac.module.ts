import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  providers: [PrismaService, JwtAuthGuard, RolesGuard],
  exports: [PrismaService, JwtAuthGuard, RolesGuard],
})
export class RbacModule {}
