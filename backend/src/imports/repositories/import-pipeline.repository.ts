import { Injectable } from '@nestjs/common';
import { EventCandidateStatus, ImportJobStatus, Prisma } from '@prisma/client';
import type { RawEvent } from '@event-foundry/contracts';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { NormalizedEvent } from '../pipeline/pipeline.types';

/** Volumétrie d'un import, historisée pour la supervision (FSPEC.01 §Statistiques). */
export interface PipelineStats {
  objectsRead: number;
  rawEventCount: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  rejectedCount: number;
}

/**
 * Accès PostgreSQL du pipeline d'import unifié (Prisma confiné au Repository — ADR.02) : Raw Events
 * conservés (immuables), rapprochement d'idempotence, et écriture transactionnelle du résultat
 * (candidates + volumétrie + transition finale de l'ImportJob). Distinct de `EventCandidateRepository`
 * pour éviter un couplage circulaire entre les modules `imports` et `event-candidates`.
 */
@Injectable()
export class ImportPipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Persiste les Raw Events (immuables — RG-IMP-02) et renvoie leur représentation contractuelle. */
  async createRawEvents(
    importJobId: string,
    correlationId: string,
    drafts: {
      providerId: string;
      providerKey: string | null;
      connectorVersion: string;
      payload: Record<string, unknown>;
      mediaRefs: string[];
    }[],
  ): Promise<RawEvent[]> {
    const acquiredAt = new Date();
    const rows = drafts.map((draft) => ({
      id: randomUUID(),
      importJobId,
      providerId: draft.providerId,
      providerKey: draft.providerKey,
      connectorVersion: draft.connectorVersion,
      acquiredAt,
      payload: draft.payload as Prisma.InputJsonValue,
      mediaRefs: draft.mediaRefs,
      correlationId,
    }));
    if (rows.length > 0) {
      await this.prisma.rawEvent.createMany({ data: rows });
    }
    return rows.map((row) => ({
      id: row.id,
      importJobId: row.importJobId,
      providerId: row.providerId,
      providerKey: row.providerKey,
      connectorVersion: row.connectorVersion,
      acquiredAt: row.acquiredAt.toISOString(),
      payload: row.payload as Record<string, unknown>,
      mediaRefs: row.mediaRefs,
      correlationId: row.correlationId,
    }));
  }

  /** Raw Events conservés d'un import (rejeu — RG-IMP-03 : Validate→Persist sans Fetch/Extract). */
  async findRawEventsByJob(importJobId: string): Promise<RawEvent[]> {
    const rows = await this.prisma.rawEvent.findMany({
      where: { importJobId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      importJobId: row.importJobId,
      providerId: row.providerId,
      providerKey: row.providerKey,
      connectorVersion: row.connectorVersion,
      acquiredAt: row.acquiredAt.toISOString(),
      payload: row.payload as Record<string, unknown>,
      mediaRefs: row.mediaRefs,
      correlationId: row.correlationId,
    }));
  }

  /**
   * Clés déjà acquises pour un fournisseur (idempotence entre exécutions — RG-IMP : un même objet
   * source ne recrée pas de doublon). Format `providerId:providerKey` pour l'étape de déduplication.
   */
  async findKnownProviderKeys(providerId: string, excludeJobId: string): Promise<Set<string>> {
    const rows = await this.prisma.rawEvent.findMany({
      where: { providerId, providerKey: { not: null }, importJobId: { not: excludeJobId } },
      select: { providerKey: true },
      distinct: ['providerKey'],
    });
    return new Set(rows.map((row) => `${providerId}:${row.providerKey}`));
  }

  /**
   * Écrit le résultat du pipeline en une transaction (écriture multi-cohérente — CLAUDE.md §6) :
   * EventCandidates (PENDING, validation humaine — RG-IMP-06 sources REVIEW), volumétrie et
   * transition finale de l'ImportJob avec sa ligne d'audit (`import_job_events`).
   */
  async persistResult(input: {
    importJobId: string;
    correlationId: string;
    candidates: NormalizedEvent[];
    stats: PipelineStats;
    finalStatus: ImportJobStatus;
    /** Rejeu (RG-IMP-03) : remplace les EventCandidates encore en attente au lieu d'en ajouter. */
    replaceExisting?: boolean;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (input.replaceExisting) {
        await tx.eventCandidate.deleteMany({
          where: { importJobId: input.importJobId, status: EventCandidateStatus.PENDING },
        });
      }
      if (input.candidates.length > 0) {
        await tx.eventCandidate.createMany({
          data: input.candidates.map((candidate) => ({
            importJobId: input.importJobId,
            status: EventCandidateStatus.PENDING,
            payload: candidate.fields as unknown as Prisma.InputJsonValue,
            confidence: candidate.confidence as unknown as Prisma.InputJsonValue,
          })),
        });
      }
      await tx.importJob.update({
        where: { id: input.importJobId },
        data: {
          status: input.finalStatus,
          finishedAt: new Date(),
          objectsRead: input.stats.objectsRead,
          rawEventCount: input.stats.rawEventCount,
          createdCount: input.stats.createdCount,
          updatedCount: input.stats.updatedCount,
          duplicateCount: input.stats.duplicateCount,
          rejectedCount: input.stats.rejectedCount,
        },
      });
      await tx.importJobEvent.create({
        data: {
          importJobId: input.importJobId,
          status: input.finalStatus,
          correlationId: input.correlationId,
        },
      });
    });
  }
}
