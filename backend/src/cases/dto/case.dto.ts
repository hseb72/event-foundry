import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CasePriority, CaseStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CASE_DOMAINS, CASE_TYPES } from '../case-catalog';

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

  @ApiProperty({ description: 'Commentaire de motivation, **obligatoire** pour tout changement de statut.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment!: string;
}

export class RerouteCaseDto {
  @ApiProperty({ enum: CASE_DOMAINS, description: 'Nouveau domaine (Work Queue dérivée).' })
  @IsIn(CASE_DOMAINS as unknown as string[])
  domain!: string;

  @ApiProperty({ description: 'Motif du re-routage (routage incorrect), **obligatoire**.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment!: string;
}

/** Réponse d'un demandeur à sa propre demande (élément supplémentaire). */
export class RequesterReplyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

export class RoutingRuleDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ description: 'Ordre d’évaluation (croissant ; première règle applicable gagne).' })
  @IsInt()
  @Min(0)
  orderIndex!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: Object, description: 'Critères (types, origins, organizationId, requiresEvent, aiConfidenceBelow).' })
  @IsObject()
  criteria!: Record<string, unknown>;

  @ApiProperty({ type: Object, description: 'Résultat (domain, workQueue, priority, initialStatus, defaultAssigneeId).' })
  @IsObject()
  result!: Record<string, unknown>;
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
