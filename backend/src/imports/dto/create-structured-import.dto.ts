import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Import structuré par copier-coller (canal CSV/JSON déterministe — ADR.13/14). Le format est
 * détecté automatiquement (ou forcé par `format`). Aucun OCR, aucune IA.
 */
export class CreateStructuredImportDto {
  @ApiProperty({ description: 'Contenu CSV ou JSON à importer (collé).' })
  @IsString()
  @MinLength(1)
  @MaxLength(1_000_000)
  content!: string;

  @ApiPropertyOptional({ description: 'Format explicite (sinon détecté).', enum: ['csv', 'json'] })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json';
}
