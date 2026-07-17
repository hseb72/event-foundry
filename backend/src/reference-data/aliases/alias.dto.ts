import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiProperty({ format: 'uuid' })
  activityId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
