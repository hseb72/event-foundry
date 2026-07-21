import { Injectable } from '@nestjs/common';
import { ImportJobStatus } from '@prisma/client';
import type { RawEvent } from '@event-foundry/contracts';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';

/**
 * Cœur commun du pipeline d'import (ADR.14) : étapes **déterministes** Validate → Normalize →
 * Deduplicate → Persist, exécutées par le Backend sur des Raw Events déjà acquis. Partagé par tous
 * les canaux (structuré, URL) et par le **rejeu** (RG-IMP-03 : Validate→Persist depuis les Raw
 * Events conservés, sans Fetch/Extract). Historise chaque transition d'`ImportJob`.
 */
@Injectable()
export class PipelineRunnerService {
  constructor(
    private readonly jobs: ImportJobRepository,
    private readonly pipeline: ImportPipelineRepository,
    private readonly validateStage: ValidateStage,
    private readonly normalizeStage: NormalizeStage,
    private readonly dedupeStage: DeduplicateStage,
  ) {}

  /**
   * Exécute Validate → Normalize → Deduplicate → Persist et clôt l'`ImportJob`
   * (READY_FOR_VALIDATION). `objectsRead` = nombre d'objets lus en amont (extraction ou rejeu).
   */
  async run(input: {
    importJobId: string;
    providerId: string;
    correlationId: string;
    rawEvents: RawEvent[];
    objectsRead: number;
    /** Rejeu : remplace les candidates en attente au lieu d'en ajouter (RG-IMP-03). */
    replaceExisting?: boolean;
  }): Promise<void> {
    const { importJobId, providerId, correlationId, rawEvents, objectsRead } = input;

    await this.jobs.transition(importJobId, ImportJobStatus.VALIDATING, correlationId);
    const { valid, rejected } = this.validateStage.validate(rawEvents);

    await this.jobs.transition(importJobId, ImportJobStatus.NORMALIZING, correlationId);
    const normalized = valid.map((rawEvent) => this.normalizeStage.normalize(rawEvent));

    await this.jobs.transition(importJobId, ImportJobStatus.DEDUPLICATING, correlationId);
    const knownKeys = await this.pipeline.findKnownProviderKeys(providerId, importJobId);
    const { kept, duplicates } = this.dedupeStage.dedupe(normalized, { keys: knownKeys });

    await this.jobs.transition(importJobId, ImportJobStatus.PERSISTING, correlationId);
    await this.pipeline.persistResult({
      importJobId,
      correlationId,
      candidates: kept,
      finalStatus: ImportJobStatus.READY_FOR_VALIDATION,
      replaceExisting: input.replaceExisting,
      stats: {
        objectsRead,
        rawEventCount: rawEvents.length,
        createdCount: kept.length,
        updatedCount: 0,
        duplicateCount: duplicates.length,
        rejectedCount: rejected.length,
      },
    });
  }
}
