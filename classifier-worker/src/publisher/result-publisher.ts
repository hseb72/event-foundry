import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { type ClassificationResult, QUEUES } from '@event-foundry/contracts';
import { Queue } from 'bullmq';
import { redisConnection } from '../config';

/** Publie le ClassificationResult sur RESULT_QUEUE, consommé par le Backend (EPIC 8). */
@Injectable()
export class ResultPublisher implements OnModuleDestroy {
  private readonly queue = new Queue(QUEUES.RESULT, { connection: redisConnection() });

  async publish(result: ClassificationResult): Promise<void> {
    await this.queue.add('result', result, { jobId: result.importJobId });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
