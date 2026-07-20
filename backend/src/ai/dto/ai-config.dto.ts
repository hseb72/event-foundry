import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecretScope, SecretStatus } from '@prisma/client';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Cas d'usage IA activables (ADR.16). L'IA n'assiste jamais la décision métier. */
export const AI_USE_CASES = ['OCR', 'DOC_UNDERSTANDING', 'TRANSLATE', 'SUMMARIZE', 'REPHRASE', 'ENRICH'] as const;
export type AiUseCase = (typeof AI_USE_CASES)[number];

/** Mise à jour d'une configuration IA. La clé (`apiKey`) est stockée comme secret, jamais renvoyée. */
export class UpdateAiConfigDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  provider!: string;

  @ApiProperty({ example: 'gpt-4o-mini' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  model!: string;

  @ApiProperty({ description: 'Opt-in global de l’IA pour cette portée.' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ description: 'Cas d’usage activés, ex. { "OCR": true, "TRANSLATE": false }.' })
  @IsObject()
  useCases!: Record<string, boolean>;

  @ApiPropertyOptional({ description: 'Nouvelle clé API (stockée comme secret). Omise = clé inchangée.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  apiKey?: string;
}

/** Métadonnées masquées d'un secret (jamais la valeur). */
export class SecretMetadataDto {
  @ApiProperty()
  reference!: string;

  @ApiProperty({ example: '••••abcd' })
  masked!: string;

  @ApiProperty({ enum: SecretStatus })
  status!: SecretStatus;
}

/** Vue d'une configuration IA (sans la clé — seulement des métadonnées masquées). */
export class AiConfigDto {
  @ApiProperty({ enum: SecretScope })
  scope!: SecretScope;

  @ApiProperty()
  scopeKey!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  model!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  useCases!: Record<string, boolean>;

  @ApiProperty({ enum: SecretStatus })
  status!: SecretStatus;

  @ApiPropertyOptional({ nullable: true, type: SecretMetadataDto })
  secret!: SecretMetadataDto | null;
}
