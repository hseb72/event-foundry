import { ApiProperty } from '@nestjs/swagger';

export class DurationsDto {
  @ApiProperty({ nullable: true, description: "Durée OCR moyenne (ms), issue de l'OCRResult." })
  avgOcrProcessingMs!: number | null;

  @ApiProperty({ nullable: true, description: 'Durée totale moyenne du pipeline (ms).' })
  avgTotalMs!: number | null;

  @ApiProperty({ description: "Nombre d'imports aboutis pris en compte pour avgTotalMs." })
  sampleCount!: number;
}

export class ImportStatsResponseDto {
  @ApiProperty({ description: "Nombre total d'ImportJob." })
  totalImports!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'ImportJob par état courant (tous les états présents, 0 inclus).',
  })
  importsByStatus!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Occurrences par état dans le journal des transitions (import_job_events).',
  })
  transitionsByStatus!: Record<string, number>;

  @ApiProperty({ type: DurationsDto })
  durations!: DurationsDto;

  @ApiProperty({ description: "Nombre total d'EventCandidate." })
  totalCandidates!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  candidatesByStatus!: Record<string, number>;

  @ApiProperty({ description: "Nombre total d'Events (hors supprimés)." })
  totalEvents!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  eventsBySource!: Record<string, number>;
}
