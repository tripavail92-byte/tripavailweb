import { IsArray, ArrayNotEmpty, ArrayMaxSize, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step9MediaDto {
  @ApiProperty({
    description: 'Array of image URLs for the tour package',
    type: [String],
    example: [
      'https://cdn.example.com/tours/1.jpg',
      'https://cdn.example.com/tours/2.jpg'
    ],
    maxItems: 10
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsUrl(undefined, { each: true })
  images!: string[];
}
