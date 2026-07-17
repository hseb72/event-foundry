import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { type ImportRequest, QUEUES } from '@event-foundry/contracts';
import { type Job, Worker } from 'bullmq';
import { redisConnection } from './config';
import { OcrProcessor } from './ocr.processor';
import { ClassificationPublisher } from './publisher/classification-publisher';

/**
 * Consommateur BullMQ de OCR_QUEUE. Stateless, idempotent, répliquable. Le retry et le
 * backoff sont gérés par BullMQ (options définies à la publication côté Backend).
 */
@Injectable()
export class OcrWorker implements OnModuleDestroy {
  private readonly logger = new Logger(OcrWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly processor: OcrProcessor,
    private readonly publisher: ClassificationPublisher,
  ) {}

  start(): void {
    this.worker = new Worker(QUEUES.OCR, (job: Job) => this.handle(job), {
      connection: redisConnection(),
      concurrency: Number(process.env.OCR_CONCURRENCY ?? '2'),
    });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`OCR échec job=${job?.id ?? '?'} : ${error.message}`);
    });
    this.logger.log(`OCR Worker à l'écoute de ${QUEUES.OCR}`);
  }

  private async handle(job: Job): Promise<{ importJobId: string }> {
    const request = job.data as ImportRequest;
    const startedAt = Date.now();
    const result = await this.processor.process(request);
    await this.publisher.publish(result);
    this.logger.log(
      `OCR ok importJob=${result.importJobId} correlationId=${request.correlationId} ` +
        `durée=${Date.now() - startedAt}ms confiance=${result.confidence.toFixed(2)}`,
    );
    return { importJobId: result.importJobId };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
