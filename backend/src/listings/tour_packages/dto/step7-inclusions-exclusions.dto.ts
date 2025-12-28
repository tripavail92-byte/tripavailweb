import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class Step7InclusionsExclusionsDto {
  @ApiProperty({ example: ['Guided hikes', 'Camping gear'] })
  @IsArray()
  @IsString({ each: true })
  inclusions!: string[];

  @ApiProperty({ example: ['Flights', 'Travel insurance'] })
  @IsArray()
  @IsString({ each: true })
  exclusions!: string[];
}
