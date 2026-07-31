import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { type OCRResult, QUEUES } from '@event-foundry/contracts';
import { Queue } from 'bullmq';
import { redisConnection } from '../config';

/**
 * Publie l'OCRResult sur OCR_RESULT_QUEUE, à destination du Backend (et non du Classifier).
 * Le Backend orchestre l'étape suivante et enregistre la transition d'état : les Workers ne
 * se chaînent jamais directement entre eux (règle d'or 4).
 */
@Injectable()
export class OcrResultPublisher implements OnModuleDestroy {
  private readonly queue = new Queue(QUEUES.OCR_RESULT, { connection: redisConnection() });

  async publish(result: OCRResult): Promise<void> {
    await this.queue.add('ocr-result', result, { jobId: result.importJobId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
