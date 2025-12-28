import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AuditLogData {
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Get audit logs for a specific target
   */
  async getLogsForTarget(targetType: string, targetId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        targetType,
        targetId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for a user's actions
   */
  async getLogsForUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent audit logs (admin view)
   */
  async getRecentLogs(limit = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
