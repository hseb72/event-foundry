import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
