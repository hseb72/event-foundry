import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** Active (true) ou désactive (false) le mode organisateur autonome de l'utilisateur courant. */
export class OrganizerModeDto {
  @ApiProperty({ description: "Se déclarer organisateur (autonome), ou y renoncer." })
  @IsBoolean()
  enabled!: boolean;
}
