import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMunicipalityDto {
  @ApiProperty({ example: 'Paris' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'UUID de la région parente.' })
  @IsUUID()
  regionId!: string;

  @ApiPropertyOptional({ example: '75000' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  postalCode?: string;
}

export class UpdateMunicipalityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '75000' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MunicipalityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  regionId!: string;

  @ApiProperty({ nullable: true })
  postalCode!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}

/** Page de communes (référentiel volumineux) : pagination / tri / filtre côté serveur. */
export class PaginatedMunicipalitiesDto {
  @ApiProperty({ type: [MunicipalityResponseDto] })
  items!: MunicipalityResponseDto[];

  @ApiProperty({ description: 'Nombre total de communes correspondant au filtre.' })
  total!: number;

  @ApiProperty()
  skip!: number;

  @ApiProperty()
  take!: number;
}

/**
 * Vue géographique d'une commune (Localisation V3, chantier §8.1) : la commune reste l'unité de
 * localisation ; la **région est dérivée** (jamais saisie) et exposée en lecture seule.
 */
export class MunicipalityGeoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  postalCode!: string | null;

  @ApiProperty()
  regionId!: string;

  @ApiProperty({ description: 'Région dérivée de la commune (lecture seule).' })
  regionName!: string;

  @ApiProperty()
  countryId!: string;

  @ApiProperty()
  countryName!: string;
}
