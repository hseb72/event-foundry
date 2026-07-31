import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ModalityResponseDto } from '../modalities/modality.dto';

export class CreateModalityDimensionDto {
  @ApiProperty({ example: 'Format de jeu' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

export class UpdateModalityDimensionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ModalityDimensionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ description: 'ISO 8601, UTC.' }) createdAt!: string;
  @ApiProperty({ type: [ModalityResponseDto], description: 'Modalités de la dimension.' })
  modalities!: ModalityResponseDto[];
}
