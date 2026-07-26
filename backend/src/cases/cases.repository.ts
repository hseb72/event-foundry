import { Injectable } from '@nestjs/common';
import { CasePriority, CaseStatus, Prisma, type Case, type CaseEvent } from '@prisma/client';
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

export interface CaseFilter {
  status?: CaseStatus;
  domain?: string;
  workQueue?: string;
  priority?: CasePriority;
  assigneeId?: string;
  unassigned?: boolean;
}

const REQUESTER_SELECT = { select: { id: true, displayName: true, email: true } };

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

  list(filter: CaseFilter, limit = 100) {
    const where: Prisma.CaseWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.domain ? { domain: filter.domain } : {}),
      ...(filter.workQueue ? { workQueue: filter.workQueue } : {}),
      ...(filter.priority ? { priority: filter.priority } : {}),
      ...(filter.assigneeId ? { assigneeId: filter.assigneeId } : {}),
      ...(filter.unassigned ? { assigneeId: null } : {}),
    };
    return this.prisma.case.findMany({
      where,
      include: { requester: REQUESTER_SELECT, assignee: REQUESTER_SELECT },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
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
