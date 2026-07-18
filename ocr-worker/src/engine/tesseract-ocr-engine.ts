import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/**
 * Moteur OCR Tesseract (via tesseract.js). Le worker Tesseract est créé paresseusement et
 * réutilisé entre les Jobs, puis terminé à l'arrêt.
 */
@Injectable()
export class TesseractOcrEngine implements OcrEngine, OnModuleDestroy {
  private worker: TesseractWorker | null = null;
  private readonly languages = process.env.OCR_LANGUAGES ?? 'eng';

  private async getWorker(): Promise<TesseractWorker> {
    if (!this.worker) {
      this.worker = await createWorker(this.languages);
    }
    return this.worker;
  }

  async recognize(image: Buffer): Promise<OcrEngineResult> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(image);
    return {
      text: data.text,
      confidence: Math.max(0, Math.min(1, data.confidence / 100)),
      language: this.languages,
      engine: 'tesseract',
      engineVersion: 'tesseract.js@7',
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
