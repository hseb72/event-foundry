import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  organizer!: string | null;

  @ApiPropertyOptional({ nullable: true })
  venue!: string | null;

  @ApiPropertyOptional({ nullable: true })
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
