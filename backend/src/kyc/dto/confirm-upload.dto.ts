import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'Document ID returned from generate upload URL',
    example: 'abc123def456',
  })
  @IsNotEmpty()
  @IsString()
  documentId!: string;
}
