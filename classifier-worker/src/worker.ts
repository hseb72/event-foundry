import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { type OCRResult, QUEUES } from '@event-foundry/contracts';
import { runWithCorrelationId } from '@event-foundry/libraries';
import { type Job, Worker } from 'bullmq';
import { ClassifierProcessor } from './classifier.processor';
import { redisConnection } from './config';
import { ResultPublisher } from './publisher/result-publisher';

/**
 * Consommateur BullMQ de CLASSIFICATION_QUEUE. Stateless, idempotent, répliquable.
 * Retry/backoff gérés par BullMQ.
 */
@Injectable()
export class ClassifierWorker implements OnModuleDestroy {
  private readonly logger = new Logger(ClassifierWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly processor: ClassifierProcessor,
    private readonly publisher: ResultPublisher,
  ) {}

  start(): void {
    this.worker = new Worker(QUEUES.CLASSIFICATION, (job: Job) => this.handle(job), {
      connection: redisConnection(),
      concurrency: Number(process.env.CLASSIFIER_CONCURRENCY ?? '2'),
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Classification échec job=${job?.id ?? '?'} : ${error.message}`);
    });
    this.logger.log(`Classifier Worker à l'écoute de ${QUEUES.CLASSIFICATION}`);
  }

  private handle(job: Job): Promise<{ importJobId: string }> {
    const ocr = job.data as OCRResult;
    // Contexte de corrélation du Job : les logs de ce traitement portent le correlationId.
    return runWithCorrelationId(ocr.correlationId, async () => {
      const startedAt = Date.now();
      const result = await this.processor.process(ocr);
      await this.publisher.publish(result);
      this.logger.log(
        `Classification ok importJob=${result.importJobId} durée=${Date.now() - startedAt}ms ` +
          `champs=${Object.keys(result.extractedFields).length}`,
      );
      return { importJobId: result.importJobId };
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
