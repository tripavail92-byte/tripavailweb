import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class Step5HighlightsDto {
  @ApiProperty({ example: ['Summit hike to Eagle Peak', 'Alpine Lake swim'] })
  @IsArray()
  @IsString({ each: true })
  highlights!: string[];
}
