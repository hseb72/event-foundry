import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { CreateRegionDto, RegionResponseDto, UpdateRegionDto } from './region.dto';
import { RegionMapper } from './region.mapper';
import { RegionsService } from './regions.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('regions')
export class RegionsController {
  constructor(private readonly service: RegionsService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('countryId') countryId?: string,
  ): Promise<RegionResponseDto[]> {
    const regions = await this.service.list(includeInactive === 'true', countryId);
    return regions.map(RegionMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateRegionDto): Promise<RegionResponseDto> {
    return RegionMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
  ): Promise<RegionResponseDto> {
    return RegionMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<RegionResponseDto> {
    return RegionMapper.toResponse(await this.service.deactivate(id));
  }
}
