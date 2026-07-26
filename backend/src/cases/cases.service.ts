import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CasePriority, CaseStatus, type Case, type CaseRoutingRule } from '@prisma/client';
import {
  DOMAIN_EVENTS,
  type CaseAssignedPayload,
  type CaseCreatedPayload,
  type CaseStatusChangedPayload,
} from '../platform/event-bus/domain-event';
import { EVENT_BUS, makeDomainEvent, type EventBus } from '../platform/event-bus/event-bus';
import { canTransition, CASE_TYPES, type CaseOrigin } from './case-catalog';
import { decideRouting, type RoutingContext, type RoutingRuleDef } from './case-routing';
import { CaseFilter, CasesRepository } from './cases.repository';

/** Données d'ouverture d'une Case (§7-8). */
export interface OpenCaseInput {
  type: string;
  subject: string;
  description: string;
  origin: CaseOrigin;
  requesterId: string | null;
  organizationId?: string | null;
  eventId?: string | null;
  priority?: CasePriority;
  metadata?: Record<string, unknown>;
}

/**
 * Domaine Case Management (FSPEC.21) : point d'entrée unique des demandes adressées aux Operators.
 * Ouverture + routage déterministe (§9), cycle de vie contrôlé (§11), affectation unique (CASE-005),
 * commentaires et **historique immuable** (§20 / CASE-006). Une Case n'est jamais supprimée
 * (CASE-007). Les autres domaines (import, RGPD, IA…) ouvrent des Cases via `open`.
 */
@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(
    private readonly repository: CasesRepository,
    @Inject(EVENT_BUS) private readonly bus: EventBus,
  ) {}

  /** Ouvre une Case, l'oriente via les Routing Rules (repli catalogue) et historise sa création (§7-9). */
  async open(input: OpenCaseInput): Promise<Case> {
    const type = CASE_TYPES.includes(input.type as never) ? input.type : 'OTHER';
    const context: RoutingContext = {
      type,
      origin: input.origin,
      organizationId: input.organizationId ?? null,
      eventId: input.eventId ?? null,
      aiConfidence: typeof input.metadata?.['aiConfidence'] === 'number'
        ? (input.metadata['aiConfidence'] as number)
        : null,
      priority: input.priority ?? null,
    };
    const routing = decideRouting(await this.loadRules(), context);
    const reference = await this.uniqueReference();
    const created = await this.repository.create({
      reference,
      type,
      domain: routing.domain,
      workQueue: routing.workQueue,
      priority: routing.priority,
      subject: input.subject,
      description: input.description,
      origin: input.origin,
      requesterId: input.requesterId,
      organizationId: input.organizationId ?? null,
      eventId: input.eventId ?? null,
      metadata: input.metadata as never,
    });
    // Statut / assignation initiaux issus d'une règle applicable (§14 §Résultat).
    if (routing.initialStatus !== CaseStatus.NEW || routing.defaultAssigneeId) {
      await this.repository.update(created.id, {
        status: routing.initialStatus,
        ...(routing.defaultAssigneeId ? { assigneeId: routing.defaultAssigneeId } : {}),
      });
    }
    await this.repository.recordEvent({
      caseId: created.id,
      kind: 'CREATED',
      actorId: input.requesterId,
      metadata: {
        type,
        domain: routing.domain,
        workQueue: routing.workQueue,
        origin: input.origin,
        matchedRuleId: routing.matchedRuleId,
      } as never,
    });
    this.logger.log(
      `CaseOpened ${reference} type=${type} → ${routing.domain}/${routing.workQueue}` +
        (routing.matchedRuleId ? ` (règle ${routing.matchedRuleId})` : ' (repli catalogue)'),
    );
    // Fait métier « Case ouverte » (§19) : les Operators de la file sont alertés via le bus.
    this.bus.publish(
      makeDomainEvent<CaseCreatedPayload>(DOMAIN_EVENTS.CASE_CREATED, {
        caseId: created.id,
        reference: created.reference,
        subject: created.subject,
        domain: created.domain,
        requesterId: created.requesterId,
      }),
    );
    return created;
  }

  private async loadRules(): Promise<RoutingRuleDef[]> {
    const rows = await this.repository.activeRoutingRules();
    return rows.map((r: CaseRoutingRule) => ({
      id: r.id,
      name: r.name,
      orderIndex: r.orderIndex,
      criteria: r.criteria as unknown as RoutingRuleDef['criteria'],
      result: r.result as unknown as RoutingRuleDef['result'],
    }));
  }

  list(filter: CaseFilter) {
    return this.repository.list(filter);
  }

  dashboard() {
    return this.repository.dashboard();
  }

  detail(id: string) {
    return this.detailOrThrow(id);
  }

  /** Les Cases dont l'utilisateur est le demandeur (suivi de ses propres demandes). */
  listMine(userId: string) {
    return this.repository.listForRequester(userId);
  }

  /** Détail d'une Case pour son demandeur (échanges internes masqués). */
  async detailForRequester(id: string, userId: string) {
    const detail = await this.detailOrThrow(id);
    if (detail.requesterId !== userId) {
      throw new ForbiddenException('Cette demande ne vous appartient pas.');
    }
    return { ...detail, events: detail.events.filter((e) => e.visibility === 'PUBLIC') };
  }

  /** Affecte (ou réaffecte) une Case à un Operator (CASE-005/010). NEW → ASSIGNED. */
  async assign(id: string, assigneeId: string, actorId: string): Promise<Case> {
    const current = await this.getOrThrow(id);
    const status = current.status === CaseStatus.NEW ? CaseStatus.ASSIGNED : current.status;
    const updated = await this.repository.update(id, { assigneeId, status });
    await this.repository.recordEvent({ caseId: id, kind: 'ASSIGNED', actorId, metadata: { assigneeId } as never });
    // N'informer que sur une affectation à autrui (une prise en charge personnelle est explicite).
    if (assigneeId !== actorId) {
      this.bus.publish(
        makeDomainEvent<CaseAssignedPayload>(DOMAIN_EVENTS.CASE_ASSIGNED, {
          caseId: id,
          reference: updated.reference,
          subject: updated.subject,
          assigneeId,
        }),
      );
    }
    return updated;
  }

  /** L'Operator prend en charge la Case lui-même. */
  claim(id: string, actorId: string): Promise<Case> {
    return this.assign(id, actorId, actorId);
  }

  /** Change le statut en respectant les transitions autorisées (§11). Clôture → date + motif (§22). */
  async changeStatus(id: string, to: CaseStatus, actorId: string, closeReason?: string): Promise<Case> {
    const current = await this.getOrThrow(id);
    if (current.status === to || !canTransition(current.status, to)) {
      throw new BadRequestException(`Transition de statut invalide : ${current.status} → ${to}.`);
    }
    const updated = await this.repository.update(id, {
      status: to,
      ...(to === CaseStatus.CLOSED ? { closedAt: new Date(), closeReason: closeReason ?? null } : {}),
    });
    await this.repository.recordEvent({
      caseId: id,
      kind: 'STATUS_CHANGED',
      actorId,
      body: to === CaseStatus.CLOSED ? (closeReason ?? null) : null,
      metadata: { from: current.status, to } as never,
    });
    // Le demandeur est informé des étapes qui le concernent (§19). Le subscriber filtre les statuts.
    this.bus.publish(
      makeDomainEvent<CaseStatusChangedPayload>(DOMAIN_EVENTS.CASE_STATUS_CHANGED, {
        caseId: id,
        reference: updated.reference,
        subject: updated.subject,
        status: to,
        requesterId: updated.requesterId,
      }),
    );
    return updated;
  }

  // --- Routing Rules configurables (§14) — administration Operator ---

  listRoutingRules(): Promise<CaseRoutingRule[]> {
    return this.repository.listRoutingRules();
  }

  createRoutingRule(input: {
    name: string;
    orderIndex: number;
    isActive?: boolean;
    criteria: Record<string, unknown>;
    result: Record<string, unknown>;
  }): Promise<CaseRoutingRule> {
    return this.repository.createRoutingRule({
      name: input.name,
      orderIndex: input.orderIndex,
      isActive: input.isActive ?? true,
      criteria: input.criteria as never,
      result: input.result as never,
    });
  }

  updateRoutingRule(
    id: string,
    input: Partial<{ name: string; orderIndex: number; isActive: boolean; criteria: Record<string, unknown>; result: Record<string, unknown> }>,
  ): Promise<CaseRoutingRule> {
    return this.repository.updateRoutingRule(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.criteria !== undefined ? { criteria: input.criteria as never } : {}),
      ...(input.result !== undefined ? { result: input.result as never } : {}),
    });
  }

  async deleteRoutingRule(id: string): Promise<void> {
    if ((await this.repository.deleteRoutingRule(id)) === 0) {
      throw new NotFoundException(`Règle de routage introuvable : ${id}.`);
    }
  }

  /** Réévalue la priorité (§12). Historisé. */
  async changePriority(id: string, priority: CasePriority, actorId: string): Promise<Case> {
    const current = await this.getOrThrow(id);
    const updated = await this.repository.update(id, { priority });
    await this.repository.recordEvent({
      caseId: id,
      kind: 'PRIORITY_CHANGED',
      actorId,
      metadata: { from: current.priority, to: priority } as never,
    });
    return updated;
  }

  /** Escalade (§16) : porte la priorité à CRITICAL et historise (CASE-011). */
  async escalate(id: string, actorId: string, reason?: string): Promise<Case> {
    await this.getOrThrow(id);
    const updated = await this.repository.update(id, { priority: CasePriority.CRITICAL });
    await this.repository.recordEvent({ caseId: id, kind: 'ESCALATED', actorId, body: reason ?? null });
    return updated;
  }

  /** Enregistre un événement d'historique typé sur une Case (usage inter-domaine, ex. modération). */
  async logEvent(id: string, actorId: string, kind: string, body?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.getOrThrow(id);
    await this.repository.recordEvent({ caseId: id, kind, actorId, body: body ?? null, metadata: metadata as never });
  }

  /** Lecture d'une Case sans exposition (usage inter-domaine). */
  getCase(id: string): Promise<Case> {
    return this.getOrThrow(id);
  }

  /** Ajoute un commentaire à l'historique (§13). `internal=false` = échange visible du demandeur. */
  async addComment(id: string, actorId: string, body: string, internal: boolean): Promise<void> {
    await this.getOrThrow(id);
    await this.repository.recordEvent({
      caseId: id,
      kind: 'COMMENT',
      actorId,
      body,
      visibility: internal ? 'INTERNAL' : 'PUBLIC',
    });
  }

  // --- Helpers ---

  private async getOrThrow(id: string): Promise<Case> {
    const found = await this.repository.findById(id);
    if (!found) {
      throw new NotFoundException(`Case introuvable : ${id}.`);
    }
    return found;
  }

  private async detailOrThrow(id: string) {
    const detail = await this.repository.detail(id);
    if (!detail) {
      throw new NotFoundException(`Case introuvable : ${id}.`);
    }
    return detail;
  }

  /** Référence lisible et unique (ex. C-LMØ3K7A2). */
  private async uniqueReference(): Promise<string> {
    for (let i = 0; i < 6; i++) {
      const candidate = `C-${randomBytes(4).toString('hex').toUpperCase()}`;
      if (!(await this.repository.referenceExists(candidate))) {
        return candidate;
      }
    }
    throw new BadRequestException('Impossible de générer une référence de Case unique.');
  }
}
