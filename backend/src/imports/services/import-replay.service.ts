import { BadRequestException, Injectable } from '@nestjs/common';
import { generateCorrelationId } from '@event-foundry/libraries';
import { ImportJobNotFoundException } from '../exceptions/import-job-not-found.exception';
import { ImportJobRepository } from '../repositories/import-job.repository';
import { ImportPipelineRepository } from '../repositories/import-pipeline.repository';
import { PipelineRunnerService } from './pipeline-runner.service';

/**
 * Rejeu d'un import (RG-IMP-03) : ré-exécute **Validate → Persist** à partir des Raw Events
 * conservés d'un `ImportJob`, **sans** solliciter à nouveau le fournisseur (ni Fetch ni Extract).
 * Utile après l'amélioration d'un mapping ou la correction d'une règle. Remplace les EventCandidates
 * encore en attente pour éviter les doublons.
 */
@Injectable()
export class ImportReplayService {
  constructor(
    private readonly jobs: ImportJobRepository,
    private readonly pipeline: ImportPipelineRepository,
    private readonly runner: PipelineRunnerService,
  ) {}

  async replay(importJobId: string): Promise<{ importJobId: string; rawEventCount: number }> {
    const job = await this.jobs.findByIdWithAttachment(importJobId);
    if (!job) {
      throw new ImportJobNotFoundException(importJobId);
    }
    const rawEvents = await this.pipeline.findRawEventsByJob(importJobId);
    if (rawEvents.length === 0) {
      throw new BadRequestException(
        'Aucun Raw Event conservé pour cet import : rejeu impossible (canal OCR V2 non rejouable).',
      );
    }
    const providerId = job.providerId ?? rawEvents[0].providerId;
    const correlationId = generateCorrelationId();

    await this.runner.run({
      importJobId,
      providerId,
      correlationId,
      rawEvents,
      objectsRead: rawEvents.length,
      replaceExisting: true,
    });

    return { importJobId, rawEventCount: rawEvents.length };
  }
}
