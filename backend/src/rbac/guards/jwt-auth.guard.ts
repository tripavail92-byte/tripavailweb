import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {
    console.log('[JwtAuthGuard] ===== GUARD CONSTRUCTED =====');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('[JwtAuthGuard] ===== GUARD ACTIVATED =====');
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    console.log('[JwtAuthGuard] Token received:', token ? `${token.substring(0, 20)}...` : 'none');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Dev-mode support: accept mock-access-<userId> tokens from frontend
      if (token.startsWith('mock-access-')) {
        const userId = token.replace('mock-access-', '');
        console.log('[JwtAuthGuard] Mock token detected, userId:', userId);
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        console.log('[JwtAuthGuard] User lookup result:', user ? `Found: ${user.email}` : 'Not found');
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        request.user = user;
        console.log('[JwtAuthGuard] Mock auth successful');
        return true;
      }

      // Default: expect JWT-like structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
