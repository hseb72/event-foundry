import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Activation / désactivation d'un compte utilisateur (admin). */
export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Activer (true) ou désactiver (false) le compte.' })
  @IsBoolean()
  isActive!: boolean;
}
