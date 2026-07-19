import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from '../../events/dto/event-response.dto';

/**
 * Entrée du planning personnel : un événement du catalogue relié à l'utilisateur (via sa
 * participation), assorti des conflits temporels détectés avec ses autres entrées (TSPEC.03).
 */
export class PlanningEntryDto {
  @ApiProperty({ type: EventResponseDto })
  event!: EventResponseDto;

  @ApiProperty({
    type: [String],
    description: "Identifiants des autres entrées en conflit d'horaire avec celle-ci.",
  })
  conflictsWith!: string[];
}
