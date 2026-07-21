import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'Magic' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  domainId!: string;
}

export class UpdateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  domainId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [String], description: 'Alias actifs (libellés alternatifs reconnus).' })
  aliases!: string[];

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
