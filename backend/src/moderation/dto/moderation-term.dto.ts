import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModerationTermKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateModerationTermDto {
  @ApiProperty({ example: 'arnaque' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  term!: string;

  @ApiPropertyOptional({ enum: ModerationTermKind, default: ModerationTermKind.BANNED })
  @IsOptional()
  @IsEnum(ModerationTermKind)
  kind?: ModerationTermKind;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateModerationTermDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  term?: string;

  @ApiPropertyOptional({ enum: ModerationTermKind })
  @IsOptional()
  @IsEnum(ModerationTermKind)
  kind?: ModerationTermKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
