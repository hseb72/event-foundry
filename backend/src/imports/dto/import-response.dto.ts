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

  @ApiPropertyOptional({
    nullable: true,
    description: "Pseudo de l'auteur de la soumission (vue d'organisation, FSPEC.22). Absent en vue personnelle.",
  })
  createdByName?: string | null;
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

export class OcrMetadataDto {
  @ApiPropertyOptional({ nullable: true, description: 'Confiance OCR globale (0..1).' })
  confidence!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Langue détectée / utilisée.' })
  language!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Moteur OCR (ex. "tesseract", "text-passthrough").' })
  engine!: string | null;

  @ApiPropertyOptional({ nullable: true })
  engineVersion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  pageCount!: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Durée du traitement OCR (ms).' })
  processingTimeMs!: number | null;
}

export class ImportJobEventDto {
  @ApiProperty({ description: 'État atteint lors de la transition.' })
  status!: string;

  @ApiProperty({ description: 'Horodatage de la transition (ISO 8601, UTC).' })
  occurredAt!: string;

  @ApiProperty()
  correlationId!: string;
}

export class ImportDetailResponseDto extends ImportResponseDto {
  @ApiProperty({ type: ImportAttachmentDto })
  attachment!: ImportAttachmentDto;

  @ApiPropertyOptional({ nullable: true, description: 'Texte OCR (ou texte importé).' })
  ocrText!: string | null;

  @ApiProperty({ type: [ImportJobEventDto], description: 'Journal des transitions d’état.' })
  timeline!: ImportJobEventDto[];

  @ApiPropertyOptional({ type: OcrMetadataDto, nullable: true, description: "Métadonnées de l'OCRResult source (null tant que l'OCR n'a pas abouti)." })
  ocr!: OcrMetadataDto | null;
}
