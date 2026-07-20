import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventMediaDto } from './event-media.dto';

/** État de participation de l'utilisateur courant pour un Event (FSPEC.06). */
export class ParticipationStateDto {
  @ApiProperty()
  interested!: boolean;

  @ApiProperty({ enum: ['NONE', 'RESERVED', 'WAITLIST', 'CANCELLED'] })
  reservationStatus!: string;

  @ApiProperty({ enum: ['NONE', 'PENDING', 'PAID', 'REFUNDED'] })
  paymentStatus!: string;
}

/** Représentation publique d'un Event (les référentiels sont exposés par leur nom). */
export class EventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['IMPORT', 'MANUAL'], description: 'Provenance, non modifiable.' })
  source!: string;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], description: 'Statut catalogue.' })
  status!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  activity!: string;

  @ApiPropertyOptional({ nullable: true })
  eventType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  eventFormat!: string | null;

  @ApiPropertyOptional({ nullable: true })
  category!: string | null;

  @ApiPropertyOptional({ nullable: true })
  organizer!: string | null;

  @ApiPropertyOptional({ nullable: true })
  venue!: string | null;

  @ApiProperty({ description: "Identifiant de l'activité (pour le suivi — Follow)." })
  activityId!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Identifiant de la catégorie (pour le suivi).' })
  categoryId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: "Identifiant de l'organisateur (pour le suivi)." })
  organizerId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Identifiant du lieu (pour le suivi).' })
  venueId!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Commune (référentiel géographique).' })
  municipality!: string | null;

  @ApiPropertyOptional({ nullable: true })
  region!: string | null;

  @ApiPropertyOptional({ nullable: true })
  country!: string | null;

  @ApiProperty({ type: [String], description: 'Tags de classification.' })
  tags!: string[];

  @ApiProperty({ type: [EventMediaDto], description: 'Galerie (peuplée sur la fiche détaillée).' })
  media!: EventMediaDto[];

  @ApiPropertyOptional({ nullable: true, description: 'Ville en texte libre du lieu (legacy).' })
  city!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  startsAt!: string;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  endsAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  price!: number | null;

  @ApiPropertyOptional({ nullable: true })
  currency!: string | null;

  @ApiPropertyOptional({
    type: ParticipationStateDto,
    nullable: true,
    description: "Participation de l'utilisateur courant (null si aucune ou non contextualisé).",
  })
  participation!: ParticipationStateDto | null;
}
