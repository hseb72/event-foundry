import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ALIAS_TARGETS, type AliasTarget } from './alias-target';

export class CreateAliasDto {
  @ApiProperty({ example: 'MTG' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  value!: string;
}

export class UpdateAliasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AliasResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty({ enum: ALIAS_TARGETS, description: 'Référentiel portant l’alias.' })
  target!: AliasTarget;

  @ApiProperty({ format: 'uuid', description: 'Entrée de référentiel désignée.' })
  targetId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Compatibilité : renseigné si cible = Activité.' })
  activityId!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
