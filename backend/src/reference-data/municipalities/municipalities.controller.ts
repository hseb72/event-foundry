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
  MunicipalityGeoDto,
  MunicipalityResponseDto,
  PaginatedMunicipalitiesDto,
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

  /**
   * Liste paginée / triée / filtrée côté serveur (référentiel volumineux : communes GeoNames).
   * Déclarée avant `:id/...` pour ne pas être capturée par une route paramétrée.
   */
  @Get('page')
  async page(
    @Query('includeInactive') includeInactive?: string,
    @Query('regionId') regionId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<PaginatedMunicipalitiesDto> {
    const skipN = skip !== undefined ? Number(skip) : 0;
    const takeN = take !== undefined ? Number(take) : 25;
    const { items, total } = await this.service.listPaged({
      includeInactive: includeInactive === 'true',
      regionId,
      search,
      sort,
      order,
      skip: skipN,
      take: takeN,
    });
    return { items: items.map(MunicipalityMapper.toResponse), total, skip: skipN, take: takeN };
  }

  /**
   * Résolution « pays + code postal → commune(s) » (Localisation V3, chantier §8.1). La région est
   * dérivée (jamais saisie). Déclaré avant `:id` pour ne pas être capturé par la route paramétrée.
   */
  @Get('resolve')
  async resolve(
    @Query('countryId', ParseUUIDPipe) countryId: string,
    @Query('postalCode') postalCode: string,
  ): Promise<MunicipalityGeoDto[]> {
    if (!postalCode || !postalCode.trim()) {
      return [];
    }
    const municipalities = await this.service.resolveByPostalCode(countryId, postalCode);
    return municipalities.map(MunicipalityMapper.toGeo);
  }

  /** Vue géographique d'une commune (région/pays dérivés) — préremplissage en édition. */
  @Get(':id/geo')
  async geo(@Param('id', ParseUUIDPipe) id: string): Promise<MunicipalityGeoDto> {
    return MunicipalityMapper.toGeo(await this.service.getGeoOrThrow(id));
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
