import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'famille' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
