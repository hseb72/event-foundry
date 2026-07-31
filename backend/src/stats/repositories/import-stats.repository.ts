import { Injectable } from '@nestjs/common';
import {
  EventCandidateStatus,
  EventSource,
  EventStatus,
  ImportJobStatus,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface StatusCount<T extends string> {
  status: T;
  count: number;
}

/** Comptes transverses de l'état de la plateforme (tableau de bord Operator — OPE-001). */
export interface PlatformCounts {
  users: number;
  activeUsers: number;
  organizations: number;
  eventsByStatus: StatusCount<EventStatus>[];
  pendingValidations: number;
  failedImports: number;
}

/**
 * Agrégations de lecture pour le tableau de bord d'administration. Confiné à la couche
 * Repository (CLAUDE.md §2/§6) : seul point d'accès Prisma pour les statistiques.
 */
@Injectable()
export class ImportStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async importJobsByStatus(): Promise<StatusCount<ImportJobStatus>[]> {
    const groups = await this.prisma.importJob.groupBy({ by: ['status'], _count: { _all: true } });
    return groups.map((g) => ({ status: g.status, count: g._count._all }));
  }

  /** Occurrences de chaque état dans le journal des transitions (débit par étape). */
  async transitionsByStatus(): Promise<StatusCount<ImportJobStatus>[]> {
    const groups = await this.prisma.importJobEvent.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return groups.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async candidatesByStatus(): Promise<StatusCount<EventCandidateStatus>[]> {
    const groups = await this.prisma.eventCandidate.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return groups.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async eventsBySource(): Promise<StatusCount<EventSource>[]> {
    const groups = await this.prisma.event.groupBy({
      by: ['source'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return groups.map((g) => ({ status: g.source, count: g._count._all }));
  }

  async avgOcrProcessingMs(): Promise<number | null> {
    const agg = await this.prisma.importJob.aggregate({ _avg: { ocrProcessingTimeMs: true } });
    return agg._avg.ocrProcessingTimeMs;
  }

  /** Durées totales (finishedAt - startedAt) des imports aboutis, pour moyenne côté service. */
  async completedDurations(): Promise<{ startedAt: Date; finishedAt: Date }[]> {
    const rows = await this.prisma.importJob.findMany({
      where: { startedAt: { not: null }, finishedAt: { not: null } },
      select: { startedAt: true, finishedAt: true },
    });
    return rows.filter(
      (r): r is { startedAt: Date; finishedAt: Date } => r.startedAt !== null && r.finishedAt !== null,
    );
  }

  /** Vision globale de l'état de la plateforme (comptes séquentiels : une requête par connexion). */
  async platformCounts(): Promise<PlatformCounts> {
    const users = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({ where: { isActive: true } });
    const organizations = await this.prisma.organization.count();
    const eventGroups = await this.prisma.event.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const pendingValidations = await this.prisma.eventCandidate.count({
      where: { status: EventCandidateStatus.PENDING },
    });
    const failedImports = await this.prisma.importJob.count({
      where: { status: ImportJobStatus.FAILED },
    });
    return {
      users,
      activeUsers,
      organizations,
      eventsByStatus: eventGroups.map((g) => ({ status: g.status, count: g._count._all })),
      pendingValidations,
      failedImports,
    };
  }
}
