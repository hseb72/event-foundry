import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CasePriority, CaseStatus, type Case } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CASE_DOMAINS, CASE_TYPES, workQueueFor, type CaseDomain, type CaseOrigin } from './case-catalog';
import { CasesService } from './cases.service';
import {
  AssignCaseDto,
  ChangePriorityDto,
  ChangeStatusDto,
  CommentDto,
  EscalateDto,
  OpenCaseDto,
} from './dto/case.dto';

/**
 * API Case Management (FSPEC.21). L'ouverture est ouverte à tout utilisateur authentifié (support,
 * signalement) ; la consultation/traitement des files est réservée à `case.manage` (Operator). Un
 * demandeur ne voit que ses propres demandes (échanges internes masqués).
 */
@ApiTags('cases')
@ApiBearerAuth()
@Controller('cases')
export class CasesController {
  constructor(private readonly service: CasesService) {}

  @Post()
  @ApiOkResponse({ description: 'Demande créée et orientée automatiquement.' })
  open(@CurrentUser() user: AuthenticatedUser, @Body() dto: OpenCaseDto): Promise<Case> {
    const origin = (user.activeExperience ?? 'EXPLORER') as CaseOrigin;
    return this.service.open({
      type: dto.type,
      subject: dto.subject,
      description: dto.description,
      origin,
      requesterId: user.userId,
      organizationId: dto.organizationId ?? null,
      eventId: dto.eventId ?? null,
      metadata: dto.metadata,
    });
  }

  /** Catalogue (types, domaines, files, statuts, priorités) pour peupler les filtres. */
  @Get('catalog')
  @ApiOkResponse({ description: 'Catalogue Case Management.' })
  catalog(): {
    types: string[];
    domains: string[];
    workQueues: string[];
    statuses: string[];
    priorities: string[];
  } {
    return {
      types: [...CASE_TYPES],
      domains: [...CASE_DOMAINS],
      workQueues: CASE_DOMAINS.map((d: CaseDomain) => workQueueFor(d)),
      statuses: Object.values(CaseStatus),
      priorities: Object.values(CasePriority),
    };
  }

  @Get('mine')
  @ApiOkResponse({ description: 'Mes demandes (en tant que demandeur).' })
  mine(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.service.listMine(user.userId);
  }

  @Get('mine/:id')
  @ApiOkResponse({ description: 'Détail d’une de mes demandes (échanges publics uniquement).' })
  myCase(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<unknown> {
    return this.service.detailForRequester(id, user.userId);
  }

  // --- Console Operator (case.manage) ---

  @Get('dashboard')
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'Indicateurs opérationnels (§21).' })
  dashboard(): Promise<unknown> {
    return this.service.dashboard();
  }

  @Get()
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'File des Cases (filtres configurables).' })
  list(
    @Query('status') status?: CaseStatus,
    @Query('domain') domain?: string,
    @Query('workQueue') workQueue?: string,
    @Query('priority') priority?: CasePriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('unassigned') unassigned?: string,
  ): Promise<unknown> {
    return this.service.list({
      status,
      domain,
      workQueue,
      priority,
      assigneeId,
      unassigned: unassigned === 'true',
    });
  }

  @Get(':id')
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'Détail d’une Case avec son historique complet.' })
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<unknown> {
    return this.service.detail(id);
  }

  @Post(':id/assign')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Case affectée à un Operator.' })
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCaseDto,
  ): Promise<Case> {
    return this.service.assign(id, dto.operatorId, user.userId);
  }

  @Post(':id/claim')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Prise en charge par l’Operator courant.' })
  claim(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<Case> {
    return this.service.claim(id, user.userId);
  }

  @Patch(':id/status')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Statut mis à jour (transitions contrôlées).' })
  status(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<Case> {
    return this.service.changeStatus(id, dto.status, user.userId);
  }

  @Patch(':id/priority')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Priorité réévaluée.' })
  priority(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePriorityDto,
  ): Promise<Case> {
    return this.service.changePriority(id, dto.priority, user.userId);
  }

  @Post(':id/escalate')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Case escaladée (priorité critique).' })
  escalate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateDto,
  ): Promise<Case> {
    return this.service.escalate(id, user.userId, dto.reason);
  }

  @Post(':id/comments')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Commentaire ajouté à l’historique.' })
  async comment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CommentDto,
  ): Promise<{ added: boolean }> {
    await this.service.addComment(id, user.userId, dto.body, dto.internal ?? true);
    return { added: true };
  }
}
