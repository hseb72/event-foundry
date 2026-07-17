import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClassifierModule } from './classifier.module';
import { ClassifierWorker } from './worker';

/**
 * Point d'entrée du Classifier Worker (moteur expert). Consomme CLASSIFICATION_QUEUE,
 * applique une chaîne de règles déterministes et publie un ClassificationResult.
 * Aucune IA générative, aucune persistance, aucun accès PostgreSQL.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(ClassifierModule);
  app.enableShutdownHooks();

  app.get(ClassifierWorker).start();

  const shutdown = (): void => {
    void app.close().then(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  new Logger('bootstrap').log('Classifier Worker démarré.');
}

void bootstrap();
