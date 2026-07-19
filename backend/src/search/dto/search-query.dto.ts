import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export type SearchSort = 'relevance' | 'upcoming' | 'newest' | 'title';
export const SEARCH_SORTS: SearchSort[] = ['relevance', 'upcoming', 'newest', 'title'];

/**
 * Critères de recherche (TSPEC.09). Le domaine Search interroge une projection technique des
 * événements publiés : texte libre pondéré + filtres indexés (activité, catégorie, commune, tag)
 * + bornes temporelles + tri + pagination. Aucune logique métier n'est portée ici.
 */
export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Recherche plein texte pondérée (titre > classification > détails).' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  activityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tagId?: string;

  @ApiPropertyOptional({
    enum: SEARCH_SORTS,
    description: 'Tri : pertinence (défaut si texte), à venir, nouveautés, alphabétique.',
  })
  @IsOptional()
  @IsIn(SEARCH_SORTS)
  sort?: SearchSort;

  @ApiPropertyOptional({ description: 'Début de période (ISO 8601, UTC).' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Fin de période (ISO 8601, UTC).' })
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
