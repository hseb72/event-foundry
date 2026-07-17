import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OcrModule } from './ocr.module';
import { OcrWorker } from './worker';

/**
 * Point d'entrée de l'OCR Worker : consomme OCR_QUEUE, produit un OCRResult et publie
 * sur CLASSIFICATION_QUEUE. Aucune connaissance métier, aucun accès à PostgreSQL.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(OcrModule);
  app.enableShutdownHooks();

  app.get(OcrWorker).start();

  const shutdown = (): void => {
    void app.close().then(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  new Logger('bootstrap').log('OCR Worker démarré.');
}

void bootstrap();
