import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Pokémon' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Family parente (Axe A).' })
  @IsUUID()
  familyId!: string;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Rattacher à une autre Family.' })
  @IsOptional()
  @IsUUID()
  familyId?: string;

  @ApiPropertyOptional({ description: 'Réactiver (true) ou désactiver (false).' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SubjectResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() familyId!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() provisional!: boolean;
  @ApiProperty({ description: 'ISO 8601, UTC.' }) createdAt!: string;
}
