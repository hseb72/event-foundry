import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateActivityFamilyDto {
  @ApiProperty({ example: 'TCG' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ description: "Activité parente (Axe A)." })
  @IsUUID()
  activityId!: string;
}

export class UpdateActivityFamilyDto {
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

export class ActivityFamilyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() activityId!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() provisional!: boolean;
  @ApiProperty({ description: 'ISO 8601, UTC.' }) createdAt!: string;
}
