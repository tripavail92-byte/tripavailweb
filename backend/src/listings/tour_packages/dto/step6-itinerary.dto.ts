import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';

export class ItineraryDayInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  day!: number;

  @ApiProperty({ example: 'Arrival and Base Camp Setup' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Meet at the trailhead, gear check, and hike to base camp.' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class Step6ItineraryDto {
  @ApiProperty({ type: [ItineraryDayInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayInputDto)
  days!: ItineraryDayInputDto[];
}
