import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { GeoImportService } from './geo-import.service';

/** Déclenche une ingestion GeoNames pour un pays (code ISO 3166-1 alpha-2). */
export class GeoImportRequestDto {
  @ApiProperty({ example: 'FR', description: 'Code pays ISO 3166-1 alpha-2.' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/, { message: 'country doit être un code pays ISO alpha-2 (ex. FR).' })
  country!: string;

  @ApiPropertyOptional({ description: 'URL de base GeoNames (par défaut download.geonames.org).' })
  @IsOptional()
  @IsString()
  baseUrl?: string;
}

/**
 * Administration du référentiel géographique (TSPEC.03) : déclenche l'ingestion **GeoNames** et
 * expose son statut. Réservé à `reference.manage`. L'ingestion est un traitement batch en
 * arrière-plan ; le référentiel local sert le runtime (aucune dépendance GeoNames en ligne).
 */
@ApiTags('reference-geo-import')
@ApiBearerAuth()
@RequirePermissions('reference.manage')
@Controller('admin/reference/geo-import')
export class GeoImportController {
  constructor(private readonly service: GeoImportService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  start(@Body() dto: GeoImportRequestDto) {
    return this.service.start(dto.country, dto.baseUrl);
  }

  @Get('status')
  @ApiOkResponse({ description: 'Statut de la dernière ingestion + volumétrie du référentiel.' })
  status() {
    return this.service.getStatus();
  }
}
