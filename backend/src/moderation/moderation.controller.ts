import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ModerationLog } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  MODERATION_DECISIONS,
  MODERATION_OBJECTS,
  REPORT_REASONS,
  type ModerationDecision,
  type ModerationObject,
  type ReportReason,
} from './moderation-catalog';
import { ModerationDecisionDto, ReportDto } from './dto/moderation.dto';
import { ModerationService } from './moderation.service';

/**
 * API Modération (FSPEC.20). Le signalement est ouvert à tout utilisateur authentifié ; les décisions
 * et l'historique de modération sont réservés à `case.manage` (Operator de modération).
 */
@ApiTags('moderation')
@ApiBearerAuth()
@Controller('moderation')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Post('reports')
  @ApiOkResponse({ description: 'Signalement enregistré (Case ouverte dans la file Moderation).' })
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReportDto,
  ): Promise<{ caseId: string; reference: string }> {
    const origin = user.activeExperience ?? 'EXPLORER';
    return this.service.report(
      user.userId,
      origin,
      { objectType: dto.objectType as ModerationObject, objectId: dto.objectId },
      dto.reason as ReportReason,
      dto.details,
    );
  }

  @Get('catalog')
  @ApiOkResponse({ description: 'Objets, motifs et décisions de modération.' })
  catalog(): { objects: string[]; reasons: string[]; decisions: string[] } {
    return {
      objects: [...MODERATION_OBJECTS],
      reasons: [...REPORT_REASONS],
      decisions: [...MODERATION_DECISIONS],
    };
  }

  @Post('cases/:caseId/decision')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Décision de modération appliquée et historisée.' })
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: ModerationDecisionDto,
  ): Promise<ModerationLog> {
    return this.service.decide(caseId, user.userId, dto.decision as ModerationDecision, dto.justification);
  }

  @Get('history')
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'Historique de modération d’un objet.' })
  history(
    @Query('objectType') objectType: string,
    @Query('objectId', ParseUUIDPipe) objectId: string,
  ): Promise<ModerationLog[]> {
    return this.service.history(objectType, objectId);
  }
}
