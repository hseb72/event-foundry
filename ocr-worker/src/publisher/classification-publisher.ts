import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { type OCRResult, QUEUES } from '@event-foundry/contracts';
import { Queue } from 'bullmq';
import { redisConnection } from '../config';

/** Publie l'OCRResult sur CLASSIFICATION_QUEUE (unique sortie du worker OCR). */
@Injectable()
export class ClassificationPublisher implements OnModuleDestroy {
  private readonly queue = new Queue(QUEUES.CLASSIFICATION, { connection: redisConnection() });

  async publish(result: OCRResult): Promise<void> {
    await this.queue.add('classify', result, { jobId: result.importJobId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
