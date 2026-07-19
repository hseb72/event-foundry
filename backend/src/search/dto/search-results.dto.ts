import { ApiProperty } from '@nestjs/swagger';
import { EventResponseDto } from '../../events/dto/event-response.dto';

/** Valeur de facette de recherche : un référentiel et le nombre de résultats correspondants. */
export class SearchFacetCountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  count!: number;
}

/** Facettes contextuelles : répartition des résultats de la recherche courante par référentiel. */
export class SearchFacetsDto {
  @ApiProperty({ type: [SearchFacetCountDto] })
  activities!: SearchFacetCountDto[];

  @ApiProperty({ type: [SearchFacetCountDto] })
  categories!: SearchFacetCountDto[];

  @ApiProperty({ type: [SearchFacetCountDto] })
  municipalities!: SearchFacetCountDto[];

  @ApiProperty({ type: [SearchFacetCountDto] })
  tags!: SearchFacetCountDto[];
}

/** Page de résultats de recherche : événements du catalogue classés par pertinence, + total. */
export class SearchResultsDto {
  @ApiProperty({ type: [EventResponseDto] })
  items!: EventResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  skip!: number;

  @ApiProperty()
  take!: number;
}

/** Résultat d'une reconstruction d'index (opérateur). */
export class ReindexResultDto {
  @ApiProperty({ description: "Nombre de documents indexés après reconstruction." })
  indexed!: number;
}
