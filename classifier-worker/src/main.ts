import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { startHealthServer, StructuredLogger } from '@event-foundry/libraries';
import Redis from 'ioredis';
import { ClassifierModule } from './classifier.module';
import { redisConnection } from './config';
import { ClassifierWorker } from './worker';

/**
 * Point d'entrée du Classifier Worker (moteur expert). Consomme CLASSIFICATION_QUEUE,
 * applique une chaîne de règles déterministes et publie un ClassificationResult.
 * Aucune IA générative, aucune persistance, aucun accès PostgreSQL. Expose des sondes de
 * santé (liveness/readiness) pour Kubernetes (TSPEC.07).
 */
async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('classifier-worker');
  const app = await NestFactory.createApplicationContext(ClassifierModule, { logger });
  app.enableShutdownHooks();

  app.get(ClassifierWorker).start();

  const health = startHealthServer({
    port: Number(process.env.CLASSIFIER_HEALTH_PORT ?? '3002'),
    component: 'classifier-worker',
    readiness: () => pingRedis(),
  });

  const shutdown = (): void => {
    health.close();
    void app.close().then(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.log('Classifier Worker démarré.', 'bootstrap');
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
