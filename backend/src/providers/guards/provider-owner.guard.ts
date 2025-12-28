import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProviderOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const providerId: string | undefined = request.params?.providerId;

    if (!providerId) {
      throw new ForbiddenException('providerId route param is required');
    }

    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authenticated user is required');
    }

    const isAdmin = user.role === 'ADMIN';
    const isOwner = provider.userId === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Provider does not belong to current user');
    }

    request.provider = provider;
    return true;
  }
}
