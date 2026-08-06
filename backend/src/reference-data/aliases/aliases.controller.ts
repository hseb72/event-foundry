import {
  BadRequestException,
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
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AliasesService } from './aliases.service';
import { ALIAS_TARGETS, isAliasTarget, type AliasTarget } from './alias-target';
import { AliasResponseDto, CreateAliasDto, UpdateAliasDto } from './alias.dto';
import { AliasMapper } from './alias.mapper';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller()
export class AliasesController {
  constructor(private readonly service: AliasesService) {}

  /**
   * Tous les alias actifs, avec leur cible. Un seul appel suffit au Classifier pour indexer les
   * libellés alternatifs des cinq référentiels — là où un chargement par entrée aurait multiplié
   * les requêtes.
   */
  @Get('aliases')
  async listAll(): Promise<AliasResponseDto[]> {
    const aliases = await this.service.listAllActive();
    return aliases.map(AliasMapper.toResponse);
  }

  // Routes historiques (activités) : conservées, l'API étant versionnée et déjà consommée par le
  // Classifier et le formulaire de qualification.
  @Get('activities/:activityId/aliases')
  async listByActivity(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<AliasResponseDto[]> {
    const aliases = await this.service.listByTarget(
      'ACTIVITY',
      activityId,
      includeInactive === 'true',
    );
    return aliases.map(AliasMapper.toResponse);
  }

  @Post('activities/:activityId/aliases')
  @RequirePermissions('reference.manage')
  async create(
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body() dto: CreateAliasDto,
  ): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.create('ACTIVITY', activityId, dto));
  }

  /**
   * Alias d'une entrée de **n'importe quel** référentiel aliasable (Activity, EventType, Subject,
   * Organizer, Venue) : un même libellé abrégé peut désigner un sujet (« MTG ») aussi bien qu'un type.
   */
  @Get('aliases/:target/:targetId')
  @ApiParam({ name: 'target', enum: ALIAS_TARGETS })
  async listByTarget(
    @Param('target') target: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<AliasResponseDto[]> {
    const aliases = await this.service.listByTarget(
      this.parseTarget(target),
      targetId,
      includeInactive === 'true',
    );
    return aliases.map(AliasMapper.toResponse);
  }

  @Post('aliases/:target/:targetId')
  @RequirePermissions('reference.manage')
  @ApiParam({ name: 'target', enum: ALIAS_TARGETS })
  async createForTarget(
    @Param('target') target: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @Body() dto: CreateAliasDto,
  ): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(
      await this.service.create(this.parseTarget(target), targetId, dto),
    );
  }

  private parseTarget(value: string): AliasTarget {
    const upper = value.toUpperCase();
    if (!isAliasTarget(upper)) {
      throw new BadRequestException(`Référentiel « ${value} » inconnu pour un alias.`);
    }
    return upper;
  }

  @Put('aliases/:id')
  @RequirePermissions('reference.manage')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAliasDto,
  ): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete('aliases/:id')
  @RequirePermissions('reference.manage')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<AliasResponseDto> {
    return AliasMapper.toResponse(await this.service.deactivate(id));
  }
}
