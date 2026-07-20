import { Injectable } from '@nestjs/common';
import { EventCandidateStatus, EventSource, EventStatus, ImportJobStatus } from '@prisma/client';
import { ImportStatsResponseDto } from '../dto/import-stats-response.dto';
import { PlatformOverviewDto } from '../dto/platform-overview-response.dto';
import { ImportStatsRepository, StatusCount } from '../repositories/import-stats.repository';

/**
 * Statistiques du pipeline d'import pour le tableau de bord Admin (EPIC 11). S'appuie sur le
 * journal des transitions (import_job_events) pour les passages entre états et les durées.
 */
@Injectable()
export class StatsService {
  constructor(private readonly repository: ImportStatsRepository) {}

  /** Vision globale de l'état de la plateforme pour la supervision Operator (OPE-001). */
  async platformOverview(): Promise<PlatformOverviewDto> {
    const counts = await this.repository.platformCounts();
    const eventsByStatus = fill(counts.eventsByStatus, Object.values(EventStatus));
    return {
      totalUsers: counts.users,
      activeUsers: counts.activeUsers,
      suspendedUsers: counts.users - counts.activeUsers,
      organizations: counts.organizations,
      totalEvents: sum(eventsByStatus),
      eventsByStatus,
      pendingValidations: counts.pendingValidations,
      failedImports: counts.failedImports,
    };
  }

  async importStats(): Promise<ImportStatsResponseDto> {
    const [importsByStatus, transitionsByStatus, candidatesByStatus, eventsBySource, avgOcr, durations] =
      await Promise.all([
        this.repository.importJobsByStatus(),
        this.repository.transitionsByStatus(),
        this.repository.candidatesByStatus(),
        this.repository.eventsBySource(),
        this.repository.avgOcrProcessingMs(),
        this.repository.completedDurations(),
      ]);

    const imports = fill(importsByStatus, Object.values(ImportJobStatus));
    const candidates = fill(candidatesByStatus, Object.values(EventCandidateStatus));
    const events = fill(eventsBySource, Object.values(EventSource));

    const totalMs = durations.reduce(
      (sum, d) => sum + (d.finishedAt.getTime() - d.startedAt.getTime()),
      0,
    );
    const avgTotalMs = durations.length > 0 ? Math.round(totalMs / durations.length) : null;

    return {
      totalImports: sum(imports),
      importsByStatus: imports,
      transitionsByStatus: fill(transitionsByStatus, Object.values(ImportJobStatus)),
      durations: {
        avgOcrProcessingMs: avgOcr === null ? null : Math.round(avgOcr),
        avgTotalMs,
        sampleCount: durations.length,
      },
      totalCandidates: sum(candidates),
      candidatesByStatus: candidates,
      totalEvents: sum(events),
      eventsBySource: events,
    };
  }
}

/** Projette des comptages sur l'ensemble des valeurs attendues (0 pour les absents). */
function fill<T extends string>(counts: StatusCount<T>[], keys: T[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of keys) {
    result[key] = 0;
  }
  for (const { status, count } of counts) {
    result[status] = count;
  }
  return result;
}

function sum(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0);
}
