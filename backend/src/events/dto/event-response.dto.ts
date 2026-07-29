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

  @ApiProperty({
    enum: ['PUBLIC', 'PRIVATE'],
    description: 'Visibilité : PRIVATE = événement personnel, visible du seul créateur (FSPEC.22).',
  })
  visibility!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  activity!: string;

  @ApiPropertyOptional({ nullable: true })
  eventType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  organizer!: string | null;

  @ApiPropertyOptional({ nullable: true })
  venue!: string | null;

  @ApiProperty({ description: "Identifiant de l'activité (pour le suivi — Follow)." })
  activityId!: string;

  @ApiProperty({ type: [String], description: 'Identifiants des sujets (pour le suivi — Follow, DATA.01 v2.0).' })
  subjectIds!: string[];

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

  @ApiProperty({ type: [String], description: 'Sujets (Axe A — DATA.01 v2.0).' })
  subjects!: string[];

  @ApiProperty({ type: [String], description: 'Modalités (Axe C — DATA.01 v2.0).' })
  modalities!: string[];

  @ApiProperty({ type: [EventMediaDto], description: 'Galerie (peuplée sur la fiche détaillée).' })
  media!: EventMediaDto[];

  @ApiPropertyOptional({
    nullable: true,
    description:
      "URL présignée de l'image de couverture (première image de la galerie), peuplée aussi dans " +
      'les vues en liste. `null` si l’événement n’a aucune image : l’interface applique son dégradé de repli.',
  })
  coverUrl!: string | null;

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

  @ApiPropertyOptional({
    description:
      "Vrai si l'événement privé mentionne un organisateur enregistré, notifiable par le créateur (FSPEC.22 §16).",
  })
  canNotifyOrganizer?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description:
      "Pseudo de l'auteur de l'événement. Exposé uniquement dans la vue d'organisation (FSPEC.22) " +
      "pour permettre à l'équipe d'agir sur l'événement d'un collègue ; absent en découverte.",
  })
  createdByName?: string | null;
}
