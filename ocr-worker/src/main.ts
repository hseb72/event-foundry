import 'reflect-metadata';
import { QUEUES } from '@event-foundry/contracts';

/**
 * Point d'entrée de l'OCR Worker.
 *
 * Pipeline interne cible (TSPEC.04) :
 *   Document Loader -> Image Preprocessor -> OCR Engine -> OCR Post Processor -> OCRResult
 *
 * Le Worker consomme QUEUES.OCR, produit un OCRResult et publie sur QUEUES.CLASSIFICATION.
 * Il est stateless, idempotent, et ne dépend jamais du Backend, de Prisma ni des
 * référentiels métier. Les technologies (Tesseract, OpenCV) restent derrière des
 * abstractions (OCREngine, ImageProcessor) — ADR.07.
 */
async function bootstrap(): Promise<void> {
  // TODO(EPIC 6) : instancier le Worker BullMQ sur QUEUES.OCR.
  console.log(`OCR Worker : à implémenter (consommation de ${QUEUES.OCR}).`);
}

void bootstrap();
