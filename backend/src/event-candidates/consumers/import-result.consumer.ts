import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportJobStatus, Prisma } from '@prisma/client';
import { type ClassificationResult, QUEUES } from '@event-foundry/contracts';
import { type Job, Worker } from 'bullmq';
import { ImportJobRepository } from '../../imports/repositories/import-job.repository';
import { EventCandidateRepository } from '../repositories/event-candidate.repository';

/**
 * Consomme RESULT_QUEUE (ClassificationResult) : crée l'EventCandidate (PENDING) et fait
 * passer l'ImportJob en READY_FOR_VALIDATION. C'est ici que le Backend reprend la main sur
 * la persistance après le pipeline des Workers (TSPEC.06).
 */
@Injectable()
export class ImportResultConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImportResultConsumer.name);
  private worker: Worker | null = null;

  constructor(
    private readonly candidates: EventCandidateRepository,
    private readonly importJobs: ImportJobRepository,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(QUEUES.RESULT, (job: Job) => this.handle(job), {
      connection: {
        host: this.config.get<string>('REDIS_HOST', 'localhost'),
        port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      },
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Création candidate échec job=${job?.id ?? '?'} : ${error.message}`);
    });
    this.logger.log(`Consommateur à l'écoute de ${QUEUES.RESULT}`);
  }

  private async handle(job: Job): Promise<void> {
    const result = job.data as ClassificationResult;
    await this.candidates.createFromClassification({
      importJobId: result.importJobId,
      payload: result.extractedFields as unknown as Prisma.InputJsonValue,
      confidence: result.confidenceByField as unknown as Prisma.InputJsonValue,
    });
    // Conservation du texte OCR pour les imports image : les Workers n'accèdent jamais à
    // PostgreSQL, le texte source est donc repropagé via le ClassificationResult et persisté
    // ici (traçabilité / rejouabilité, TSPEC.06). Pour un import texte il est déjà stocké.
    await this.importJobs.update(result.importJobId, {
      status: ImportJobStatus.READY_FOR_VALIDATION,
      ocrText: result.ocrText,
    });
    this.logger.log(
      `EventCandidate créé importJob=${result.importJobId} correlationId=${result.correlationId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
