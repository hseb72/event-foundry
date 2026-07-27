import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Vue d'édition d'un Event (espace Organizer) : les référentiels sont exposés par leur **identifiant**
 * (et non par leur nom comme dans la réponse publique), afin de préremplir fidèlement le formulaire
 * de correction. La localisation inclut la cascade pays / région / commune. Réservé à `event.update`.
 */
export class EventEditDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'ARCHIVED'] })
  status!: string;

  @ApiProperty({ description: 'Un événement non éditable (publié / archivé) doit être dépublié / restauré.' })
  editable!: boolean;

  @ApiProperty({ format: 'uuid' })
  activityId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  eventTypeId!: string | null;

  @ApiProperty({ type: [String], format: 'uuid', description: 'Formats (cardinalité N — TAX-003).' })
  eventFormatIds!: string[];

  @ApiProperty({ type: [String], format: 'uuid', description: 'Catégories (cardinalité N — TAX-004).' })
  categoryIds!: string[];

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organizerId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  venueId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  countryId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  regionId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  municipalityId!: string | null;

  @ApiProperty({ type: [String], format: 'uuid' })
  tagIds!: string[];

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  startsAt!: string;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  endsAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  price!: number | null;

  @ApiPropertyOptional({ nullable: true })
  currency!: string | null;
}
