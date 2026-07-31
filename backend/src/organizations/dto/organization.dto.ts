import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ORG_FUNCTIONS, type OrgFunction } from '../organizations.service';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'La Cave aux Cartes' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class ChangeMemberFunctionDto {
  @ApiProperty({ enum: ORG_FUNCTIONS })
  @IsIn(ORG_FUNCTIONS as unknown as string[])
  function!: OrgFunction;
}

export class TransferOwnershipDto {
  @ApiProperty({ description: 'Membre qui devient Owner.' })
  @IsUUID()
  userId!: string;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'collaborateur@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ORG_FUNCTIONS })
  @IsIn(ORG_FUNCTIONS as unknown as string[])
  function!: OrgFunction;
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Jeton du lien d’invitation.' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class UpdateGeneralInfoDto {
  @ApiPropertyOptional({ example: 'La Cave aux Cartes' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'contact@cave.fr' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://cave.fr' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @ApiPropertyOptional({ example: 'https://cave.fr/logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class SetCoveredActivitiesDto {
  @ApiProperty({ type: [String], description: 'Identifiants des activités couvertes.' })
  @IsArray()
  @IsUUID('4', { each: true })
  activityIds!: string[];
}

export class SetOrganizerLinkDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Fiche Organizer représentée (FSPEC.22 §16), ou null pour retirer le lien.',
  })
  @IsOptional()
  @IsUUID()
  organizerId?: string | null;
}
