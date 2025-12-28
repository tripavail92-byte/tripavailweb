import { IsString, IsInt, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateUploadUrlDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: ['business_license', 'owner_id', 'tax_certificate', 'tour_license', 'insurance', 'other'],
    example: 'business_license',
  })
  @IsNotEmpty()
  @IsEnum(['business_license', 'owner_id', 'tax_certificate', 'tour_license', 'insurance', 'other'])
  documentType!: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'business_license.pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileName!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
    minimum: 1,
    maximum: 10485760, // 10MB
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10485760) // 10MB limit
  fileSize!: number;

  @ApiProperty({
    description: 'MIME type of the file',
    enum: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    example: 'application/pdf',
  })
  @IsNotEmpty()
  @IsEnum(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'])
  mimeType!: string;
}
