import { ApiProperty } from '@nestjs/swagger';

/** Valeur de facette : un référentiel et le nombre d'événements publiés associés. */
export class FacetCountDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  count!: number;
}

/** Facettes de navigation de la découverte (comptes par référentiel, événements publiés). */
export class FacetsDto {
  @ApiProperty({ type: [FacetCountDto] })
  activities!: FacetCountDto[];

  @ApiProperty({ type: [FacetCountDto] })
  categories!: FacetCountDto[];

  @ApiProperty({ type: [FacetCountDto] })
  municipalities!: FacetCountDto[];

  @ApiProperty({ type: [FacetCountDto] })
  tags!: FacetCountDto[];
}
