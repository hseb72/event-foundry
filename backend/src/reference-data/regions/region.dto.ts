import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Île-de-France' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'UUID du pays parent.' })
  @IsUUID()
  countryId!: string;
}

export class UpdateRegionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RegionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  countryId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
