import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDomainDto {
  @ApiProperty({ example: 'TCG' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

export class UpdateDomainDto {
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

export class DomainResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;
}
