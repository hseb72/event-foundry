import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ProvisionalCurationService } from './provisional-curation.service';
import type { ProvisionalType } from './provisional-curation.repository';

const PROVISIONAL_TYPES = ['activity', 'eventType', 'eventFormat', 'organizer', 'venue'] as const;

/** Une entrée de la file de curation (référentiel provisoire). */
export class ProvisionalEntryDto {
  @ApiProperty({ enum: PROVISIONAL_TYPES })
  type!: ProvisionalType;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, description: 'Contexte (activité parente pour un type/format).' })
  context!: string | null;

  @ApiProperty()
  createdAt!: string;
}

/** Cible d'une action de curation. */
export class CurationTargetDto {
  @ApiProperty({ enum: PROVISIONAL_TYPES })
  @IsIn(PROVISIONAL_TYPES)
  type!: ProvisionalType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

/**
 * File de curation des référentiels provisoires (ADR.24), écran Operator. Réservée à
 * `reference.manage`. Lister / confirmer / supprimer les entrées auto-créées lors des imports.
 */
@ApiTags('reference-provisioning')
@ApiBearerAuth()
@RequirePermissions('reference.manage')
@Controller('admin/reference/provisional')
export class ProvisionalCurationController {
  constructor(private readonly service: ProvisionalCurationService) {}

  @Get()
  @ApiOkResponse({ type: [ProvisionalEntryDto] })
  list(): Promise<ProvisionalEntryDto[]> {
    return this.service.list();
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Body() dto: CurationTargetDto): Promise<void> {
    return this.service.confirm(dto.type, dto.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  remove(@Body() dto: CurationTargetDto): Promise<void> {
    return this.service.remove(dto.type, dto.id);
  }
}
