import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'France' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'FR', description: 'Code ISO 3166-1 alpha-2.' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  code?: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'FR' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  code?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CountryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
