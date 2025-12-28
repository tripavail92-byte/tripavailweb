import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a signed URL for document upload
   * In production, this would integrate with S3/MinIO
   * For now, we'll return a mock signed URL structure
   */
  async generateUploadUrl(
    providerId: string,
    documentType: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
  ): Promise<{
    uploadUrl: string;
    documentId: string;
    expiresAt: Date;
  }> {
    // Validate provider exists
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Validate file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Validate MIME type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid file type. Allowed: PDF, JPEG, PNG');
    }

    // Generate unique document ID
    const documentId = crypto.randomBytes(16).toString('hex');

    // Create document record with PENDING status
    const document = await this.prisma.kycDocument.create({
      data: {
        id: documentId,
        providerId,
        documentType,
        fileName,
        fileSize,
        mimeType,
        status: 'PENDING',
        uploadUrl: `https://storage.tripavail.com/kyc/${providerId}/${documentId}/${fileName}`,
      },
    });

    // In production, generate actual S3/MinIO signed URL
    // For now, return mock URL structure
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return {
      uploadUrl: `https://storage.tripavail.com/upload?key=${documentId}&signature=${crypto.randomBytes(32).toString('hex')}`,
      documentId: document.id,
      expiresAt,
    };
  }

  /**
   * Confirm document upload completion
   */
  async confirmUpload(
    providerId: string,
    documentId: string,
  ): Promise<{ success: boolean; document: any }> {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.providerId !== providerId) {
      throw new BadRequestException('Document does not belong to this provider');
    }

    // Update document status to UPLOADED
    const updated = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: 'UPLOADED',
        uploadedAt: new Date(),
      },
    });

    return {
      success: true,
      document: updated,
    };
  }

  /**
   * Get all documents for a provider
   */
  async getProviderDocuments(providerId: string) {
    const documents = await this.prisma.kycDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  /**
   * Get document by ID
   */
  async getDocument(providerId: string, documentId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.providerId !== providerId) {
      throw new BadRequestException('Document does not belong to this provider');
    }

    return document;
  }

  /**
   * Delete a document (only if not yet reviewed)
   */
  async deleteDocument(providerId: string, documentId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.providerId !== providerId) {
      throw new BadRequestException('Document does not belong to this provider');
    }

    if (document.status === 'APPROVED' || document.status === 'REJECTED') {
      throw new BadRequestException('Cannot delete document that has been reviewed');
    }

    await this.prisma.kycDocument.delete({
      where: { id: documentId },
    });

    return { success: true, message: 'Document deleted successfully' };
  }

  /**
   * Get KYC completion status for provider
   */
  async getKycStatus(providerId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const documents = await this.prisma.kycDocument.findMany({
      where: { providerId },
    });

    // Required document types based on provider type
    const requiredDocs =
      provider.providerType === 'HOTEL_MANAGER'
        ? ['business_license', 'owner_id', 'tax_certificate']
        : ['business_license', 'owner_id', 'tax_certificate', 'tour_license'];

    const uploadedDocs = documents
      .filter((doc) => doc.status === 'UPLOADED' || doc.status === 'APPROVED')
      .map((doc) => doc.documentType);

    const missingDocs = requiredDocs.filter((type) => !uploadedDocs.includes(type));

    const allDocsUploaded = missingDocs.length === 0;
    const allDocsApproved = documents
      .filter((doc) => requiredDocs.includes(doc.documentType))
      .every((doc) => doc.status === 'APPROVED');

    return {
      providerId,
      providerType: provider.providerType,
      requiredDocuments: requiredDocs,
      uploadedDocuments: uploadedDocs,
      missingDocuments: missingDocs,
      allDocsUploaded,
      allDocsApproved,
      documents: documents.map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        reviewedAt: doc.reviewedAt,
      })),
    };
  }
}
