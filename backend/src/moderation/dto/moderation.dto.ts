import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MODERATION_DECISIONS, MODERATION_OBJECTS, REPORT_REASONS } from '../moderation-catalog';

export class ReportDto {
  @ApiProperty({ enum: MODERATION_OBJECTS })
  @IsIn(MODERATION_OBJECTS as unknown as string[])
  objectType!: string;

  @ApiProperty()
  @IsUUID()
  objectId!: string;

  @ApiProperty({ enum: REPORT_REASONS })
  @IsIn(REPORT_REASONS as unknown as string[])
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

export class ModerationDecisionDto {
  @ApiProperty({ enum: MODERATION_DECISIONS })
  @IsIn(MODERATION_DECISIONS as unknown as string[])
  decision!: string;

  @ApiPropertyOptional({ description: 'Justification (obligatoire pour les décisions importantes — MOD-004).' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  justification?: string;
}
