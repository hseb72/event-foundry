import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Création d'une adresse d'organisation (Localisation V3, chantier §8.2). */
export class CreateOrganizationAddressDto {
  @ApiProperty({ example: 'Boutique centre-ville' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiProperty({ description: 'UUID du pays.' })
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: '75000' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  postalCode!: string;

  @ApiPropertyOptional({ description: 'UUID de la commune résolue (région dérivée).' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiProperty({ example: '12 rue des Lilas' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  streetLines!: string;

  @ApiPropertyOptional({ description: 'Adresse principale de l’organisation.' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/** Réponse : adresse d'organisation, région/commune/pays dérivés (lecture seule). */
export class OrganizationAddressDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  countryId!: string;

  @ApiProperty()
  countryName!: string;

  @ApiProperty()
  postalCode!: string;

  @ApiProperty({ nullable: true })
  municipalityId!: string | null;

  @ApiProperty({ nullable: true })
  municipalityName!: string | null;

  @ApiProperty({ nullable: true, description: 'Région dérivée de la commune (lecture seule).' })
  regionName!: string | null;

  @ApiProperty()
  streetLines!: string;

  @ApiProperty()
  isPrimary!: boolean;
}
