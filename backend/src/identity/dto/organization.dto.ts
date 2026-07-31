import { ApiProperty } from '@nestjs/swagger';

/** Représentation d'une organisation pour l'administration. */
export class OrganizationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  subscription!: string | null;

  @ApiProperty()
  memberCount!: number;
}
