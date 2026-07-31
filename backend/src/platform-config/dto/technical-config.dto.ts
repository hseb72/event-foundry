import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { DEFAULT_MAX_UPLOAD_BYTES } from '../../imports/imports.constants';

/**
 * Limites techniques configurables par l'Operator (OPE-005 §Technique). Valeurs non secrètes,
 * stockées en PlatformSetting. `maxUploadBytes` est borné par le plafond dur Multer.
 */
export class UpdateTechnicalConfigDto {
  @ApiProperty({
    description: 'Taille maximale d’un document importé (octets). Bornée par le plafond dur.',
    minimum: 1024,
    maximum: DEFAULT_MAX_UPLOAD_BYTES,
  })
  @IsInt()
  @Min(1024)
  @Max(DEFAULT_MAX_UPLOAD_BYTES)
  maxUploadBytes!: number;

  @ApiProperty({ description: 'Plafond quotidien d’imports (plateforme). 0 = illimité.', minimum: 0 })
  @IsInt()
  @Min(0)
  maxImportsPerDay!: number;

  @ApiPropertyOptional({
    description: 'Auto-provisioning des référentiels manquants (état provisoire — ADR.24). Défaut : off.',
  })
  @IsOptional()
  @IsBoolean()
  autoProvisionReferentials?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Domaine par défaut pour une activité auto-créée. Requis pour auto-créer des activités.',
  })
  @IsOptional()
  @IsUUID()
  provisioningDefaultDomainId?: string;
}

/** Vue des limites techniques (aucune donnée secrète). */
export class TechnicalConfigDto {
  @ApiProperty()
  maxUploadBytes!: number;

  @ApiProperty()
  maxImportsPerDay!: number;

  @ApiProperty({ description: 'Plafond dur (octets) au-delà duquel une limite n’est pas configurable.' })
  hardMaxUploadBytes!: number;

  @ApiProperty({ description: 'Auto-provisioning des référentiels manquants activé (ADR.24).' })
  autoProvisionReferentials!: boolean;

  @ApiProperty({ nullable: true, description: 'Domaine par défaut pour les activités auto-créées.' })
  provisioningDefaultDomainId!: string | null;
}
