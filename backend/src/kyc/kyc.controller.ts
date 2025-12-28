import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { GenerateUploadUrlDto } from './dto/generate-upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post(':providerId/upload-url')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Generate signed URL for document upload',
    description:
      'Generates a pre-signed URL for uploading KYC documents. The URL expires after 15 minutes.',
  })
  async generateUploadUrl(
    @Param('providerId') providerId: string,
    @Body() dto: GenerateUploadUrlDto,
  ) {
    return this.kycService.generateUploadUrl(
      providerId,
      dto.documentType,
      dto.fileName,
      dto.fileSize,
      dto.mimeType,
    );
  }

  @Post(':providerId/confirm-upload')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Confirm document upload completion',
    description: 'Confirms that a document has been successfully uploaded to the signed URL.',
  })
  async confirmUpload(@Param('providerId') providerId: string, @Body() dto: ConfirmUploadDto) {
    return this.kycService.confirmUpload(providerId, dto.documentId);
  }

  @Get(':providerId/documents')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Get all KYC documents for provider',
    description: 'Retrieves all uploaded KYC documents for the specified provider.',
  })
  async getProviderDocuments(@Param('providerId') providerId: string) {
    return this.kycService.getProviderDocuments(providerId);
  }

  @Get(':providerId/status')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Get KYC completion status',
    description:
      'Returns KYC status including required documents, uploaded documents, and missing documents.',
  })
  async getKycStatus(@Param('providerId') providerId: string) {
    return this.kycService.getKycStatus(providerId);
  }

  @Get(':providerId/documents/:documentId')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Get specific document details',
    description: 'Retrieves details of a specific KYC document.',
  })
  async getDocument(
    @Param('providerId') providerId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.kycService.getDocument(providerId, documentId);
  }

  @Delete(':providerId/documents/:documentId')
  @Roles('TRAVELER', 'ADMIN')
  @ApiOperation({
    summary: 'Delete a KYC document',
    description: 'Deletes a KYC document. Only allowed if document has not been reviewed yet.',
  })
  async deleteDocument(
    @Param('providerId') providerId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.kycService.deleteDocument(providerId, documentId);
  }
}
