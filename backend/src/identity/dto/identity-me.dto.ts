import { ApiProperty } from '@nestjs/swagger';
import { Experience } from '@prisma/client';

/** Organisation à laquelle l'utilisateur appartient, avec ses rôles d'organisation. */
export class IdentityOrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: [String], description: "Rôles de l'utilisateur dans cette organisation." })
  roles!: string[];

  @ApiProperty({ nullable: true, description: "Clé de l'offre commerciale de l'organisation." })
  subscription!: string | null;
}

/**
 * Vue « moi » de l'identité (TSPEC.06) : profil, rôles/permissions effectifs, expériences
 * disponibles et contexte actif. Le front adapte l'affichage ; le backend reste seul juge des
 * permissions (ADR.08).
 */
export class IdentityMeDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty({ enum: Experience, isArray: true })
  experiences!: Experience[];

  @ApiProperty({ enum: Experience, nullable: true })
  activeExperience!: Experience | null;

  @ApiProperty({ nullable: true })
  activeOrganizationId!: string | null;

  @ApiProperty({ nullable: true, description: "Offre de l'organisation active." })
  subscription!: string | null;

  @ApiProperty({ type: [IdentityOrganizationDto] })
  organizations!: IdentityOrganizationDto[];

  @ApiProperty({
    type: Object,
    description: 'Préférences personnelles (thème, langue, notifications…). Source : User Preferences.',
  })
  preferences!: Record<string, unknown>;
}
