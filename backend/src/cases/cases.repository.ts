import { Injectable } from '@nestjs/common';
import {
  CasePriority,
  CaseStatus,
  Prisma,
  type Case,
  type CaseEvent,
  type CaseRoutingRule,
} from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

export interface CreateCaseInput {
  reference: string;
  type: string;
  domain: string;
  workQueue: string;
  priority: CasePriority;
  subject: string;
  description: string;
  origin: string;
  requesterId: string | null;
  organizationId: string | null;
  eventId: string | null;
  metadata?: Prisma.InputJsonValue;
}

/** Colonnes triables de la file des Cases (liste blanche — jamais de champ arbitraire). */
export const CASE_SORT_FIELDS = [
  'reference',
  'subject',
  'domain',
  'workQueue',
  'priority',
  'status',
  'createdAt',
  'updatedAt',
] as const;
export type CaseSortField = (typeof CASE_SORT_FIELDS)[number];

export interface CaseFilter {
  status?: CaseStatus;
  domain?: string;
  workQueue?: string;
  priority?: CasePriority;
  assigneeId?: string;
  unassigned?: boolean;
  /** Recherche texte (référence ou objet). */
  search?: string;
  sort?: CaseSortField;
  order?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

const REQUESTER_SELECT = { select: { id: true, displayName: true, email: true } };

/** Case avec ses parties (demandeur + assignee) chargées, pour la file Operator. */
export type CaseWithParties = Prisma.CaseGetPayload<{
  include: { requester: typeof REQUESTER_SELECT; assignee: typeof REQUESTER_SELECT };
}>;

/**
 * Accès PostgreSQL du domaine Cases (Prisma confiné — ADR.02). Écritures + journal immuable
 * (case_events). Aucune décision : les transitions/routages sont décidés par le Service.
 */
@Injectable()
export class CasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateCaseInput): Promise<Case> {
    return this.prisma.case.create({ data: input });
  }

  /** Ajoute une entrée d'historique (immuable — CASE-006). */
  recordEvent(input: {
    caseId: string;
    kind: string;
    actorId: string | null;
    body?: string | null;
    visibility?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<CaseEvent> {
    return this.prisma.caseEvent.create({
      data: {
        caseId: input.caseId,
        kind: input.kind,
        actorId: input.actorId,
        body: input.body ?? null,
        visibility: input.visibility ?? 'INTERNAL',
        metadata: input.metadata,
      },
    });
  }

  findById(id: string): Promise<Case | null> {
    return this.prisma.case.findUnique({ where: { id } });
  }

  detail(id: string) {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        requester: REQUESTER_SELECT,
        assignee: REQUESTER_SELECT,
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
  }

  async list(filter: CaseFilter): Promise<{ items: CaseWithParties[]; total: number }> {
    const search = filter.search?.trim();
    const where: Prisma.CaseWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.domain ? { domain: filter.domain } : {}),
      ...(filter.workQueue ? { workQueue: filter.workQueue } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.assigneeId ? { assigneeId: filter.assigneeId } : {}),
      ...(filter.unassigned ? { assigneeId: null } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    // Tri : colonne de la liste blanche + sens ; départage stable par créationDate puis id.
    const sortField = filter.sort ?? 'priority';
    const order = filter.order ?? (filter.sort ? 'asc' : 'desc');
    const orderBy: Prisma.CaseOrderByWithRelationInput[] = [
      { [sortField]: order } as Prisma.CaseOrderByWithRelationInput,
      { createdAt: 'asc' },
      { id: 'asc' },
    ];
    const [items, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: { requester: REQUESTER_SELECT, assignee: REQUESTER_SELECT },
        orderBy,
        skip: filter.skip ?? 0,
        take: filter.take ?? 25,
      }),
      this.prisma.case.count({ where }),
    ]);
    return { items, total };
  }

  listForRequester(requesterId: string) {
    return this.prisma.case.findMany({
      where: { requesterId },
      include: { assignee: REQUESTER_SELECT },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  update(id: string, data: Prisma.CaseUncheckedUpdateInput): Promise<Case> {
    return this.prisma.case.update({ where: { id }, data });
  }

  referenceExists(reference: string): Promise<boolean> {
    return this.prisma.case
      .findUnique({ where: { reference }, select: { id: true } })
      .then((c) => c != null);
  }

  // --- Routing Rules configurables (§14) ---

  activeRoutingRules(): Promise<CaseRoutingRule[]> {
    return this.prisma.caseRoutingRule.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  listRoutingRules(): Promise<CaseRoutingRule[]> {
    return this.prisma.caseRoutingRule.findMany({ orderBy: { orderIndex: 'asc' } });
  }

  createRoutingRule(data: {
    name: string;
    orderIndex: number;
    isActive: boolean;
    criteria: Prisma.InputJsonValue;
    result: Prisma.InputJsonValue;
  }): Promise<CaseRoutingRule> {
    return this.prisma.caseRoutingRule.create({ data });
  }

  updateRoutingRule(id: string, data: Prisma.CaseRoutingRuleUpdateInput): Promise<CaseRoutingRule> {
    return this.prisma.caseRoutingRule.update({ where: { id }, data });
  }

  async deleteRoutingRule(id: string): Promise<number> {
    const result = await this.prisma.caseRoutingRule.deleteMany({ where: { id } });
    return result.count;
  }

  /** Indicateurs de pilotage (§21) : comptes par statut / domaine + charge par assignee + critiques. */
  async dashboard(): Promise<{
    open: number;
    critical: number;
    byStatus: { status: string; count: number }[];
    byDomain: { domain: string; count: number }[];
  }> {
    const openStatuses: CaseStatus[] = [
      CaseStatus.NEW,
      CaseStatus.ASSIGNED,
      CaseStatus.IN_PROGRESS,
      CaseStatus.WAITING_FOR_USER,
      CaseStatus.WAITING_FOR_ORGANIZER,
    ];
    const [open, critical, byStatus, byDomain] = await Promise.all([
      this.prisma.case.count({ where: { status: { in: openStatuses } } }),
      this.prisma.case.count({ where: { priority: CasePriority.CRITICAL, status: { in: openStatuses } } }),
      this.prisma.case.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.case.groupBy({ by: ['domain'], where: { status: { in: openStatuses } }, _count: { _all: true } }),
    ]);
    return {
      open,
      critical,
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byDomain: byDomain.map((r) => ({ domain: r.domain, count: r._count._all })),
    };
  }
}
