import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { startHealthServer, StructuredLogger } from '@event-foundry/libraries';
import Redis from 'ioredis';
import { redisConnection } from './config';
import { OcrModule } from './ocr.module';
import { OcrWorker } from './worker';

/**
 * Point d'entrée de l'OCR Worker : consomme OCR_QUEUE, produit un OCRResult et le renvoie
 * au Backend sur OCR_RESULT_QUEUE. Aucune connaissance métier, aucun accès à PostgreSQL.
 * Expose des sondes de santé (liveness/readiness) pour Kubernetes (TSPEC.07).
 */
async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('ocr-worker');
  const app = await NestFactory.createApplicationContext(OcrModule, { logger });
  app.enableShutdownHooks();

  app.get(OcrWorker).start();

  const health = startHealthServer({
    port: Number(process.env.OCR_HEALTH_PORT ?? '3001'),
    component: 'ocr-worker',
    readiness: () => pingRedis(),
  });

  const shutdown = (): void => {
    health.close();
    void app.close().then(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.log('OCR Worker démarré.', 'bootstrap');
}

/** Readiness : Redis joignable. Client éphémère borné (aucune reconnexion, échec rapide). */
async function pingRedis(): Promise<boolean> {
  const client = new Redis({
    ...redisConnection(),
    lazyConnect: true,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  try {
    await client.connect();
    return (await client.ping()) === 'PONG';
  } catch {
    return false;
  } finally {
    client.disconnect();
  }
}

void bootstrap();
