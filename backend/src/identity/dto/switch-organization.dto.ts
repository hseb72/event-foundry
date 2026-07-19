import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

/**
 * Change l'organisation active. `null` sort de tout contexte d'organisation (seuls les rôles
 * plateforme s'appliquent alors).
 */
export class SwitchOrganizationDto {
  @ApiProperty({ type: String, nullable: true, description: 'UUID de l’organisation, ou null.' })
  @ValidateIf((dto: SwitchOrganizationDto) => dto.organizationId !== null)
  @IsUUID()
  organizationId!: string | null;
}
