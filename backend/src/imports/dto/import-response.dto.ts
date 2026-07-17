import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['IMAGE', 'TEXT'] })
  type!: string;

  @ApiProperty({ description: 'Statut du pipeline (ImportJobStatus).' })
  status!: string;

  @ApiProperty({ description: "Nombre d'EventCandidate produits (0 tant que le pipeline n'a pas abouti)." })
  candidateCount!: number;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  startedAt!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  finishedAt!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}

export class ImportAttachmentDto {
  @ApiProperty({ enum: ['IMAGE', 'TEXT'] })
  type!: string;

  @ApiPropertyOptional({ nullable: true })
  originalName!: string | null;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  sizeBytes!: number;
}

export class ImportDetailResponseDto extends ImportResponseDto {
  @ApiProperty({ type: ImportAttachmentDto })
  attachment!: ImportAttachmentDto;

  @ApiPropertyOptional({ nullable: true, description: 'Texte OCR (ou texte importé).' })
  ocrText!: string | null;
}
