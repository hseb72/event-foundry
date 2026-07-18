import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import type { DatePeriod } from '../date-range.util';

const PERIODS: DatePeriod[] = ['today', 'this-week', 'this-month', 'next-7-days', 'next-30-days'];

/** Filtres de recherche cumulables (FSPEC.04). */
export class SearchEventsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  activityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventTypeId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  eventFormatId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  venueId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Recherche plein texte (titre, description).' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: ['all', 'mine', 'none'],
    description: 'Filtre de participation : tous, mes événements, sans participation.',
  })
  @IsOptional()
  @IsIn(['all', 'mine', 'none'])
  participation?: 'all' | 'mine' | 'none';

  @ApiPropertyOptional({ enum: PERIODS, description: 'Filtre temporel rapide.' })
  @IsOptional()
  @IsIn(PERIODS)
  period?: DatePeriod;

  @ApiPropertyOptional({ description: 'Début de période personnalisée (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fin de période personnalisée (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
