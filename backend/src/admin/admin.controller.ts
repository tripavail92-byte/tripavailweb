import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { KycService } from '../kyc/kyc.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';
import { ReviewDocumentDto, ReviewAction } from '../kyc/dto/review-document.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private kycService: KycService,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  @Get('kyc/pending')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all pending KYC documents for review' })
  async getPendingDocuments() {
    const documents = await this.prisma.kycDocument.findMany({
      where: {
        status: {
          in: ['UPLOADED', 'UNDER_REVIEW'],
        },
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            providerType: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'asc',
      },
    });

    return { documents, count: documents.length };
  }

  @Post('kyc/:documentId/review')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Review a KYC document (approve/reject)' })
  async reviewDocument(
    @Param('documentId') documentId: string,
    @Body() reviewDto: ReviewDocumentDto,
    @Request() req: any,
  ) {
    // Get document
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: {
        provider: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status !== 'UPLOADED' && document.status !== 'UNDER_REVIEW') {
      throw new BadRequestException('Document must be in UPLOADED or UNDER_REVIEW status');
    }

    // Require notes for REJECT/REQUEST_RESUBMIT
    if (
      (reviewDto.action === ReviewAction.REJECT ||
        reviewDto.action === ReviewAction.REQUEST_RESUBMIT) &&
      !reviewDto.notes
    ) {
      throw new BadRequestException('Review notes are required for rejection or resubmit requests');
    }

    // Update document status
    let newStatus: string;
    switch (reviewDto.action) {
      case ReviewAction.APPROVE:
        newStatus = 'APPROVED';
        break;
      case ReviewAction.REJECT:
        newStatus = 'REJECTED';
        break;
      case ReviewAction.REQUEST_RESUBMIT:
        newStatus = 'REJECTED'; // Same as reject, provider can reupload
        break;
    }

    const updatedDocument = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus as any,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
        reviewNotes: reviewDto.notes || null,
      },
    });

    // Create audit log
    await this.auditService.log({
      userId: req.user.id,
      action: `KYC_DOCUMENT_${reviewDto.action}`,
      targetType: 'KycDocument',
      targetId: documentId,
      metadata: {
        providerId: document.providerId,
        documentType: document.documentType,
        notes: reviewDto.notes,
      },
    });

    // Check if all provider documents are approved
    const allDocuments = await this.kycService.getProviderDocuments(document.providerId);
    const requiredDocTypes = this.getRequiredDocuments(document.provider.providerType);
    const approvedDocs = allDocuments.filter((doc: any) => doc.status === 'APPROVED');

    const allDocsApproved =
      approvedDocs.length === requiredDocTypes.length &&
      requiredDocTypes.every((type) => approvedDocs.some((doc: any) => doc.documentType === type));

    // Update provider verification status if all docs approved
    if (allDocsApproved && document.provider.verificationStatus !== 'APPROVED') {
      await this.prisma.providerProfile.update({
        where: { id: document.providerId },
        data: {
          verificationStatus: 'APPROVED',
        },
      });

      // Audit provider approval
      await this.auditService.log({
        userId: req.user.id,
        action: 'PROVIDER_APPROVED',
        targetType: 'ProviderProfile',
        targetId: document.providerId,
        metadata: {
          reason: 'All KYC documents approved',
        },
      });
    }

    return {
      success: true,
      document: updatedDocument,
      providerApproved: allDocsApproved,
    };
  }

  @Get('kyc/:documentId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get document details with audit history' })
  async getDocumentDetails(@Param('documentId') documentId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            providerType: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const auditLogs = await this.auditService.getLogsForTarget('KycDocument', documentId);

    return {
      document,
      auditLogs,
    };
  }

  @Get('providers/pending')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get providers pending verification' })
  @ApiQuery({ name: 'type', required: false, enum: ['HOTEL_MANAGER', 'TOUR_OPERATOR'] })
  async getPendingProviders(@Query('type') providerType?: string) {
    const where: any = {
      verificationStatus: {
        in: ['PENDING', 'UNDER_REVIEW'],
      },
    };

    if (providerType) {
      where.providerType = providerType;
    }

    const providers = await this.prisma.providerProfile.findMany({
      where,
      include: {
        kycDocuments: true,
        onboarding: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return { providers, count: providers.length };
  }

  @Get('audit-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get recent audit logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAuditLogs(@Query('limit') limit?: string) {
    const logs = await this.auditService.getRecentLogs(limit ? parseInt(limit) : 100);
    return { logs, count: logs.length };
  }

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    const [totalUsers, totalProviders, totalBookings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.providerProfile.count(),
      this.prisma.booking.count({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
    ]);

    // Calculate revenue from bookings
    const revenueData = await this.prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      _sum: {
        totalPrice: true,
      },
    });

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      revenue: revenueData._sum?.totalPrice || 0,
      openDisputes: 0, // Stub
    };
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiQuery({ name: 'role', required: false, enum: ['TRAVELER', 'ADMIN'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getUsers(@Query('role') role?: string, @Query('search') search?: string) {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        phoneVerified: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { users, count: users.length };
  }

  @Post('users/:userId/toggle-role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle user role between TRAVELER and ADMIN' })
  async toggleUserRole(@Param('userId') userId: string, @Request() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newRole = user.role === 'ADMIN' ? 'TRAVELER' : 'ADMIN';
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });

    await this.auditService.log({
      userId: req.user.id,
      action: 'USER_ROLE_CHANGED',
      targetType: 'User',
      targetId: userId,
      metadata: { email: user.email, oldRole: user.role, newRole },
    });

    return { success: true, user: updatedUser };
  }

  @Post('users/:userId/delete')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a user account' })
  async deleteUser(@Param('userId') userId: string, @Request() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.auditService.log({
      userId: req.user.id,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: userId,
      metadata: { email: user.email },
    });

    return { success: true };
  }

  @Get('providers')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all providers with filters' })
  @ApiQuery({ name: 'verificationStatus', required: false })
  @ApiQuery({ name: 'providerType', required: false })
  async getProviders(
    @Query('verificationStatus') verificationStatus?: string,
    @Query('providerType') providerType?: string,
  ) {
    const where: any = {};

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (providerType) {
      where.providerType = providerType;
    }

    const providers = await this.prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Count packages for each provider manually
    const providersWithCounts = await Promise.all(
      providers.map(async (p: any) => {
        const [hotelCount, tourCount] = await Promise.all([
          this.prisma.hotelPackage.count({ where: { providerId: p.id } }),
          this.prisma.tourPackage.count({ where: { providerId: p.id } }),
        ]);

        return {
          ...p,
          _count: {
            hotelPackages: hotelCount,
            tourPackages: tourCount,
          },
        };
      }),
    );

    return { providers: providersWithCounts, count: providersWithCounts.length };
  }

  @Post('providers/:providerId/toggle-status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle provider between APPROVED and REJECTED' })
  async toggleProviderStatus(@Param('providerId') providerId: string, @Request() req: any) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const newStatus =
      provider.verificationStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED';

    const updatedProvider = await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { verificationStatus: newStatus as any },
    });

    await this.auditService.log({
      userId: req.user.id,
      action: `PROVIDER_${newStatus}`,
      targetType: 'ProviderProfile',
      targetId: providerId,
      metadata: { businessName: provider.businessName },
    });

    return { success: true, provider: updatedProvider };
  }

  @Post('providers/:providerId/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject provider verification' })
  async rejectProvider(
    @Param('providerId') providerId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const updatedProvider = await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { 
        verificationStatus: 'REJECTED' as any,
        rejectionReason: body.reason || 'Rejected by admin',
      },
    });

    await this.auditService.log({
      userId: req.user.id,
      action: 'PROVIDER_REJECTED',
      targetType: 'ProviderProfile',
      targetId: providerId,
      metadata: { businessName: provider.businessName, reason: body.reason },
    });

    return { success: true, provider: updatedProvider };
  }

  @Post('providers/:providerId/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve provider verification' })
  async approveProvider(@Param('providerId') providerId: string, @Request() req: any) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const updatedProvider = await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { verificationStatus: 'APPROVED' as any },
    });

    await this.auditService.log({
      userId: req.user.id,
      action: 'PROVIDER_APPROVED',
      targetType: 'ProviderProfile',
      targetId: providerId,
      metadata: { businessName: provider.businessName },
    });

    return { success: true, provider: updatedProvider };
  }

  @Get('disputes')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all disputes with filters (stub)' })
  async getDisputes() {
    // Stub - return empty array as disputes table may not exist
    return { disputes: [], count: 0 };
  }

  @Post('disputes/:disputeId/assign')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign dispute to support agent (stub)' })
  async assignDispute(
    @Param('disputeId') disputeId: string,
    @Body() body: { assignedTo: string },
    @Request() req: any,
  ) {
    // Stub - for now just log the action
    await this.auditService.log({
      userId: req.user.id,
      action: 'DISPUTE_ASSIGNED',
      targetType: 'Dispute',
      targetId: disputeId,
      metadata: { assignedTo: body.assignedTo },
    });

    return { success: true, message: 'Dispute assigned (stub)' };
  }

  @Post('disputes/:disputeId/resolve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolve a dispute (stub)' })
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() body: { resolution: string },
    @Request() req: any,
  ) {
    // Stub - for now just log the action
    await this.auditService.log({
      userId: req.user.id,
      action: 'DISPUTE_RESOLVED',
      targetType: 'Dispute',
      targetId: disputeId,
      metadata: { resolution: body.resolution },
    });

    return { success: true, message: 'Dispute resolved (stub)' };
  }

  private getRequiredDocuments(providerType: string): string[] {
    const required = ['business_license', 'owner_id', 'tax_certificate'];
    if (providerType === 'TOUR_OPERATOR') {
      required.push('tour_license');
    }
    return required;
  }
}
