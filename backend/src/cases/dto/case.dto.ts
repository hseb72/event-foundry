import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CasePriority, CaseStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CASE_TYPES } from '../case-catalog';

export class OpenCaseDto {
  @ApiProperty({ enum: CASE_TYPES })
  @IsIn(CASE_TYPES as unknown as string[])
  type!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AssignCaseDto {
  @ApiProperty({ description: 'Operator responsable.' })
  @IsUUID()
  operatorId!: string;
}

export class ChangeStatusDto {
  @ApiProperty({ enum: CaseStatus })
  @IsEnum(CaseStatus)
  status!: CaseStatus;
}

export class ChangePriorityDto {
  @ApiProperty({ enum: CasePriority })
  @IsEnum(CasePriority)
  priority!: CasePriority;
}

export class CommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;

  @ApiPropertyOptional({ description: 'Commentaire interne (true) ou échange visible du demandeur (false).' })
  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}

export class EscalateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
