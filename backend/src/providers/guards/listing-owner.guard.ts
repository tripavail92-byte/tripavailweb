import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ListingOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const listingId: string | undefined = request.params?.id;

    if (!listingId) {
      throw new ForbiddenException('id route param is required');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, providerId: true },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: listing.providerId },
      select: { id: true, userId: true },
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
      throw new ForbiddenException('Listing does not belong to current user');
    }

    request.listing = listing;
    request.provider = provider;
    return true;
  }
}
