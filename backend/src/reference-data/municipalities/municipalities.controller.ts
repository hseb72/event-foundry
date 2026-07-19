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
import {
  CreateMunicipalityDto,
  MunicipalityResponseDto,
  UpdateMunicipalityDto,
} from './municipality.dto';
import { MunicipalityMapper } from './municipality.mapper';
import { MunicipalitiesService } from './municipalities.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly service: MunicipalitiesService) {}

  @Get()
  async list(
    @Query('includeInactive') includeInactive?: string,
    @Query('regionId') regionId?: string,
  ): Promise<MunicipalityResponseDto[]> {
    const municipalities = await this.service.list(includeInactive === 'true', regionId);
    return municipalities.map(MunicipalityMapper.toResponse);
  }

  @Post()
  @RequirePermissions('reference.manage')
  async create(@Body() dto: CreateMunicipalityDto): Promise<MunicipalityResponseDto> {
    return MunicipalityMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMunicipalityDto,
  ): Promise<MunicipalityResponseDto> {
    return MunicipalityMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<MunicipalityResponseDto> {
    return MunicipalityMapper.toResponse(await this.service.deactivate(id));
  }
}
