import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/** Correction du brouillon d'un EventCandidate (champs proposés de l'Event). */
export class UpdateEventCandidateDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}
