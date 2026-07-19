import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Création d'une organisation (administration). */
export class CreateOrganizationDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ma-boutique', description: 'Identifiant URL (minuscules, chiffres, tirets).' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug invalide : minuscules, chiffres et tirets uniquement.',
  })
  @MaxLength(120)
  slug!: string;
}
