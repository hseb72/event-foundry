import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateModalityDto {
  @ApiProperty({ example: 'Draft' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ description: 'Dimension parente (Axe C).' })
  @IsUUID()
  dimensionId!: string;
}

export class UpdateModalityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Rattacher à une autre dimension.' })
  @IsOptional()
  @IsUUID()
  dimensionId?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ModalityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() dimensionId!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() provisional!: boolean;
  @ApiProperty({ description: 'ISO 8601, UTC.' }) createdAt!: string;
}
