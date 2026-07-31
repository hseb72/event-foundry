import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type ImportRequest, type OCRResult, QUEUES } from '@event-foundry/contracts';
import { Queue } from 'bullmq';

/**
 * Producteur BullMQ. Le Backend publie uniquement des Jobs (TSPEC.06) : il ne consomme
 * jamais les files (rôle des Workers). Deux files : OCR_QUEUE et CLASSIFICATION_QUEUE.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly ocrQueue: Queue;
  private readonly classificationQueue: Queue;

  constructor(config: ConfigService) {
    const connection = {
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(config.get<string>('REDIS_PORT', '6379')),
    };
    const defaultJobOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    };
    this.ocrQueue = new Queue(QUEUES.OCR, { connection, defaultJobOptions });
    this.classificationQueue = new Queue(QUEUES.CLASSIFICATION, { connection, defaultJobOptions });
  }

  /** Import image : publie une demande d'OCR (le Worker rechargera le document). */
  async enqueueImport(request: ImportRequest): Promise<void> {
    await this.ocrQueue.add('import', request, { jobId: request.importJobId });
  }

  /**
   * Publie vers la classification. Import texte : le Backend fabrique un OCRResult de
   * substitution (pas d'OCR). Import image : l'OCR Worker publiera le vrai OCRResult.
   */
  async enqueueClassification(result: OCRResult): Promise<void> {
    await this.classificationQueue.add('classify', result, { jobId: result.importJobId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.ocrQueue.close();
    await this.classificationQueue.close();
  }
}
