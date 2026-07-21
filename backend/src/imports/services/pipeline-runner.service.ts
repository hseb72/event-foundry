import { Injectable } from '@nestjs/common';
import { ImportJobStatus } from '@prisma/client';
import type { RawEvent } from '@event-foundry/contracts';
import { TechnicalConfigService } from '../../platform-config/technical-config.service';
import { DeduplicateStage } from '../pipeline/deduplicate.stage';
import { NormalizeStage } from '../pipeline/normalize.stage';
import { ValidateStage } from '../pipeline/validate.stage';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository, type PipelineStats } from '../repositories/import-pipeline.repository';
import { ReferentialProvisioningService } from './referential-provisioning.service';

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
    private readonly technical: TechnicalConfigService,
    private readonly provisioning: ReferentialProvisioningService,
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
  }): Promise<PipelineStats> {
    const { importJobId, providerId, correlationId, rawEvents, objectsRead } = input;

    await this.jobs.transition(importJobId, ImportJobStatus.VALIDATING, correlationId);
    const { valid, rejected } = this.validateStage.validate(rawEvents);

    await this.jobs.transition(importJobId, ImportJobStatus.NORMALIZING, correlationId);
    const normalized = valid.map((rawEvent) => this.normalizeStage.normalize(rawEvent));

    await this.jobs.transition(importJobId, ImportJobStatus.DEDUPLICATING, correlationId);
    const knownKeys = await this.pipeline.findKnownProviderKeys(providerId, importJobId);
    const { kept, duplicates } = this.dedupeStage.dedupe(normalized, { keys: knownKeys });

    // Auto-provisioning opt-in (ADR.24) : matérialise les référentiels manquants (état provisoire)
    // avant la persistance, pour que la validation ne bute plus sur des libellés inconnus.
    const provisioningConfig = await this.technical.getProvisioning();
    if (provisioningConfig.autoProvisionReferentials) {
      for (const event of kept) {
        await this.provisioning.provision(event.fields, provisioningConfig);
      }
    }

    await this.jobs.transition(importJobId, ImportJobStatus.PERSISTING, correlationId);
    const stats: PipelineStats = {
      objectsRead,
      rawEventCount: rawEvents.length,
      createdCount: kept.length,
      updatedCount: 0,
      duplicateCount: duplicates.length,
      rejectedCount: rejected.length,
    };
    await this.pipeline.persistResult({
      importJobId,
      correlationId,
      candidates: kept,
      finalStatus: ImportJobStatus.READY_FOR_VALIDATION,
      replaceExisting: input.replaceExisting,
      stats,
    });
    return stats;
  }
}
