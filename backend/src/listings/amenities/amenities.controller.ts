import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../rbac/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { AmenitiesService } from './amenities.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { ListAmenitiesQueryDto } from './dto/list-amenities.query.dto';

@ApiTags('amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(public readonly service: AmenitiesService) {}

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  ping() {
    return { ok: true, module: 'amenities' };
  }

  @Get()
  @ApiOperation({ summary: 'List amenities' })
  @ApiResponse({ status: 200, description: 'List of amenities' })
  list(@Query() query: ListAmenitiesQueryDto) {
    return this.service.list(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create amenity' })
  @ApiResponse({ status: 201, description: 'Amenity created' })
  create(@Body() dto: CreateAmenityDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update amenity' })
  @ApiResponse({ status: 200, description: 'Amenity updated' })
  update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete amenity' })
  @ApiResponse({ status: 200, description: 'Amenity deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
