import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventCandidateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ format: 'uuid' })
  importJobId!: string;

  @ApiProperty({ enum: ['PENDING', 'CORRECTED', 'VALIDATED', 'REJECTED'] })
  status!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, description: "Brouillon d'Event." })
  payload!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Score de confiance par champ (aucun score global).',
  })
  confidence!: Record<string, number>;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  correctedAt!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;

  @ApiPropertyOptional({
    nullable: true,
    description:
      "Pseudo de l'auteur de la soumission. Exposé dans la vue d'organisation (FSPEC.22) ; absent en vue personnelle.",
  })
  createdByName?: string | null;
}

export class EventCandidateDetailResponseDto extends EventCandidateResponseDto {
  @ApiPropertyOptional({ nullable: true, description: "Texte OCR de l'import source." })
  ocrText!: string | null;
}
