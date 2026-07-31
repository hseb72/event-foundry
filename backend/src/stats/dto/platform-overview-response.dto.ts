import { ApiProperty } from '@nestjs/swagger';

/**
 * Vision globale de l'état de la plateforme (UISPEC.03 OPE-001). Indicateurs clés et alertes pour
 * la supervision Operator. Lecture seule, agrégée depuis les domaines existants.
 */
export class PlatformOverviewDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  suspendedUsers!: number;

  @ApiProperty()
  organizations!: number;

  @ApiProperty()
  totalEvents!: number;

  @ApiProperty({ description: 'Répartition des événements par statut catalogue.' })
  eventsByStatus!: Record<string, number>;

  @ApiProperty({ description: "Candidats d'import en attente de validation (alerte si > 0)." })
  pendingValidations!: number;

  @ApiProperty({ description: "Imports en échec (alerte si > 0)." })
  failedImports!: number;
}
