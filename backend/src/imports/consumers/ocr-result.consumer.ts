import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImportJobStatus } from '@prisma/client';
import { type OCRResult, QUEUES } from '@event-foundry/contracts';
import { type Job, Worker } from 'bullmq';
import { QueueService } from '../../infra/queue/queue.service';
import { ImportJobRepository } from '../repositories/import-job.repository';

/**
 * Consomme OCR_RESULT_QUEUE (OCRResult renvoyé par l'OCR Worker). Le Backend orchestre
 * l'étape suivante (règle d'or 4) : il conserve l'OCRResult sur l'ImportJob, historise la
 * transition OCR_DONE, puis publie la demande de classification et passe en
 * CLASSIFICATION_RUNNING. Les Workers ne se chaînent jamais directement (TSPEC.06).
 */
@Injectable()
export class OcrResultConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OcrResultConsumer.name);
  private worker: Worker | null = null;

  constructor(
    private readonly importJobs: ImportJobRepository,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(QUEUES.OCR_RESULT, (job: Job) => this.handle(job), {
      connection: {
        host: this.config.get<string>('REDIS_HOST', 'localhost'),
        port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      },
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Traitement OCRResult échec job=${job?.id ?? '?'} : ${error.message}`);
    });
    this.logger.log(`Consommateur à l'écoute de ${QUEUES.OCR_RESULT}`);
  }

  private async handle(job: Job): Promise<void> {
    const ocr = job.data as OCRResult;

    // OCR terminé : conservation de l'OCRResult source (traçabilité) + historisation.
    await this.importJobs.transition(ocr.importJobId, ImportJobStatus.OCR_DONE, ocr.correlationId, {
      ocrText: ocr.rawText,
      ocrConfidence: ocr.confidence,
      ocrLanguage: ocr.language,
      ocrEngine: ocr.engine,
      ocrEngineVersion: ocr.engineVersion,
      ocrPageCount: ocr.pageCount,
      ocrProcessingTimeMs: ocr.processingTimeMs,
    });

    // Étape suivante orchestrée par le Backend : classification.
    await this.queue.enqueueClassification(ocr);
    await this.importJobs.transition(
      ocr.importJobId,
      ImportJobStatus.CLASSIFICATION_RUNNING,
      ocr.correlationId,
    );

    this.logger.log(
      `OCR_DONE -> CLASSIFICATION_RUNNING importJob=${ocr.importJobId} ` +
        `correlationId=${ocr.correlationId}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
