import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from '../../events/dto/event-response.dto';

/**
 * Recommandation explicable (ADR.09) : un événement du Catalog, son score de pertinence déterministe
 * et les justifications (raisons) l'ayant fait sélectionner. L'utilisateur comprend toujours pourquoi.
 */
export class RecommendationDto {
  @ApiProperty({ type: EventResponseDto })
  event!: EventResponseDto;

  @ApiProperty({ description: 'Score de pertinence déterministe (somme des contributions des règles).' })
  score!: number;

  @ApiProperty({ type: [String], description: 'Justifications compréhensibles de la recommandation.' })
  reasons!: string[];
}
