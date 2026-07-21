import { ApiProperty } from '@nestjs/swagger';

/** Agrégat d'appels IA par fournisseur (supervision Operator). Aucun contenu ni secret. */
export class AiProviderStatDto {
  @ApiProperty()
  provider!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  failures!: number;

  @ApiProperty({ description: 'Durée moyenne d’appel (ms).' })
  avgDurationMs!: number;
}

/** Agrégat d'appels IA par cas d'usage (supervision Operator). */
export class AiUseCaseStatDto {
  @ApiProperty()
  useCase!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  failures!: number;
}

/**
 * Statistiques d'appels IA pour la supervision Operator (Observabilité). Ne renvoie que des
 * métadonnées agrégées : volumes, taux d'échec, durée moyenne. Aucun contenu, aucune clé (RG-AI-04).
 */
export class AiCallStatsDto {
  @ApiProperty({ description: 'Nombre total d’appels IA tracés.' })
  total!: number;

  @ApiProperty({ description: 'Nombre d’appels en échec.' })
  failures!: number;

  @ApiProperty({ description: 'Taux d’échec global (0..1).' })
  failureRate!: number;

  @ApiProperty({ type: [AiProviderStatDto] })
  byProvider!: AiProviderStatDto[];

  @ApiProperty({ type: [AiUseCaseStatDto] })
  byUseCase!: AiUseCaseStatDto[];
}
