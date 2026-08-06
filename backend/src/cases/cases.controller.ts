import {
  Body,
  Controller,
  Delete,
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
import {
  CASE_DOMAINS,
  CASE_ORIGINS,
  CASE_TYPES,
  workQueueFor,
  type CaseDomain,
  type CaseOrigin,
} from './case-catalog';
import { CASE_SORT_FIELDS, type CaseSortField } from './cases.repository';
import { CasesService } from './cases.service';
import type { CaseRoutingRule } from '@prisma/client';
import { ReferenceSuggestionService } from './reference-suggestion.service';
import {
  AcceptReferenceSuggestionDto,
  AssignCaseDto,
  ChangePriorityDto,
  ChangeStatusDto,
  CommentDto,
  EscalateDto,
  OpenCaseDto,
  OpenReferenceSuggestionDto,
  RequesterReplyDto,
  RerouteCaseDto,
  RoutingRuleDto,
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
  constructor(
    private readonly service: CasesService,
    private readonly suggestions: ReferenceSuggestionService,
  ) {}

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
    origins: string[];
    workQueues: string[];
    statuses: string[];
    priorities: string[];
  } {
    return {
      types: [...CASE_TYPES],
      domains: [...CASE_DOMAINS],
      // Origines exposées pour l'édition des règles de routage (§14) : le critère `origins`
      // s'appuie sur ces valeurs, qui doivent être proposées plutôt que saisies à la main.
      origins: [...CASE_ORIGINS],
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

  /** Le demandeur apporte un élément supplémentaire à sa demande (§19). Relance une Case en attente. */
  @Post('mine/:id/replies')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Élément ajouté à ma demande.' })
  async reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequesterReplyDto,
  ): Promise<{ added: boolean }> {
    await this.service.addRequesterComment(id, user.userId, dto.body);
    return { added: true };
  }

  /**
   * Propose l'ajout d'une référence manquante (§4). Ouvert à tout utilisateur authentifié : proposer
   * n'écrit **rien** au référentiel, cela ouvre une Case vers la modération. L'utilisateur poursuit
   * sa qualification sans attendre la décision.
   */
  @Post('reference-suggestions')
  @ApiOkResponse({ description: 'Proposition transmise à la modération.' })
  proposeReference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OpenReferenceSuggestionDto,
  ): Promise<Case> {
    return this.suggestions.open({
      suggestion: { kind: dto.kind, label: dto.label, context: dto.context },
      requesterId: user.userId,
      origin: user.activeExperience ?? 'EXPLORER',
      eventId: dto.eventId ?? null,
      organizationId: user.activeOrganizationId ?? null,
    });
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
  @ApiOkResponse({ description: 'File des Cases : filtrable, triable, paginée (serveur).' })
  list(
    @Query('status') status?: CaseStatus,
    @Query('domain') domain?: string,
    @Query('workQueue') workQueue?: string,
    @Query('priority') priority?: CasePriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('unassigned') unassigned?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<unknown> {
    // Tri : seule une colonne de la liste blanche est acceptée (sinon tri par défaut).
    const sortField = (CASE_SORT_FIELDS as readonly string[]).includes(sort ?? '')
      ? (sort as CaseSortField)
      : undefined;
    return this.service.list({
      status,
      domain,
      workQueue,
      priority,
      assigneeId,
      unassigned: unassigned === 'true',
      search,
      sort: sortField,
      order: order === 'desc' ? 'desc' : order === 'asc' ? 'asc' : undefined,
      skip: Math.max(0, Number(skip) || 0),
      take: Math.min(100, Math.max(1, Number(take) || 25)),
    });
  }

  // --- Routing Rules configurables (§14) ---

  @Get('routing-rules')
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'Règles de routage (ordre d’évaluation).' })
  routingRules(): Promise<CaseRoutingRule[]> {
    return this.service.listRoutingRules();
  }

  @Post('routing-rules')
  @RequirePermissions('case.manage')
  @ApiOkResponse({ description: 'Règle de routage créée.' })
  createRule(@Body() dto: RoutingRuleDto): Promise<CaseRoutingRule> {
    return this.service.createRoutingRule(dto);
  }

  @Patch('routing-rules/:ruleId')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Règle de routage mise à jour.' })
  updateRule(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: RoutingRuleDto,
  ): Promise<CaseRoutingRule> {
    return this.service.updateRoutingRule(ruleId, dto);
  }

  @Delete('routing-rules/:ruleId')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Règle de routage supprimée.' })
  async deleteRule(@Param('ruleId', ParseUUIDPipe) ruleId: string): Promise<{ deleted: boolean }> {
    await this.service.deleteRoutingRule(ruleId);
    return { deleted: true };
  }

  /**
   * Accepte une proposition d'ajout : crée l'entrée du référentiel — libellé et parent tels que
   * tranchés par la modération, pas nécessairement tels que proposés — puis résout la Case. Un
   * refus passe par le changement de statut ordinaire, motif à l'appui.
   */
  @Post(':id/reference-suggestion/accept')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Référence créée, Case résolue.' })
  acceptSuggestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptReferenceSuggestionDto,
  ): Promise<Case> {
    return this.suggestions.accept(
      id,
      { kind: dto.kind, name: dto.name, parentId: dto.parentId, comment: dto.comment },
      user.userId,
    );
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
    return this.service.changeStatus(id, dto.status, user.userId, dto.comment);
  }

  @Post(':id/reroute')
  @RequirePermissions('case.manage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Case re-routée vers un autre domaine / file (routage incorrect).' })
  reroute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RerouteCaseDto,
  ): Promise<Case> {
    return this.service.reroute(id, dto.domain, user.userId, dto.comment);
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
