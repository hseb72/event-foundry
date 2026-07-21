import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { TextAssistUseCase } from '../assistant.service';

const USE_CASES: TextAssistUseCase[] = ['TRANSLATE', 'SUMMARIZE', 'REPHRASE'];

/** Demande d'assistance IA « texte » (assistance à l'affichage). */
export class AssistRequestDto {
  @ApiProperty({ enum: USE_CASES })
  @IsIn(USE_CASES)
  useCase!: TextAssistUseCase;

  @ApiProperty({ description: 'Texte source (ex. description d’un événement).' })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  text!: string;

  @ApiPropertyOptional({ description: 'Langue cible (traduction). Défaut : français.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  targetLanguage?: string;
}

/** Résultat : texte assisté, ou `assisted=false` si aucune IA n'est activée (repli déterministe). */
export class AssistResponseDto {
  @ApiProperty({ enum: USE_CASES })
  useCase!: TextAssistUseCase;

  @ApiProperty()
  assisted!: boolean;

  @ApiProperty({ nullable: true })
  text!: string | null;

  @ApiProperty({ nullable: true })
  provider!: string | null;
}
