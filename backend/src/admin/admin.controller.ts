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
    const approvedDocs = allDocuments.filter((doc) => doc.status === 'APPROVED');

    const allDocsApproved =
      approvedDocs.length === requiredDocTypes.length &&
      requiredDocTypes.every((type) => approvedDocs.some((doc) => doc.documentType === type));

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

  private getRequiredDocuments(providerType: string): string[] {
    const required = ['business_license', 'owner_id', 'tax_certificate'];
    if (providerType === 'TOUR_OPERATOR') {
      required.push('tour_license');
    }
    return required;
  }
}
