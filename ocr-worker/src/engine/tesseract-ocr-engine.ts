import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, OEM, PSM, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/**
 * Moteur OCR Tesseract (via tesseract.js). Le worker est créé paresseusement, réglé, réutilisé
 * entre les Jobs, puis terminé à l'arrêt. Réglages (TSPEC.04) :
 *  - OEM LSTM et modèles « best » (nettement plus précis que le « fast » par défaut) ;
 *  - PSM adapté aux affiches (texte épars par défaut) ;
 *  - `preserve_interword_spaces` pour ne pas coller les mots.
 * Tout est surchargeable par variables d'environnement.
 */
@Injectable()
export class TesseractOcrEngine implements OcrEngine, OnModuleDestroy {
  private worker: TesseractWorker | null = null;
  private readonly languages = process.env.OCR_LANGUAGES ?? 'eng';
  private readonly oem = Number(process.env.OCR_OEM ?? OEM.LSTM_ONLY);
  private readonly psm = (process.env.OCR_PSM ?? PSM.SPARSE_TEXT) as PSM;
  // Modèles « best » par défaut (précision) ; « fast » possible via OCR_TESSDATA=fast.
  private readonly langPath =
    process.env.OCR_LANG_PATH ??
    (process.env.OCR_TESSDATA === 'fast'
      ? 'https://tessdata.projectnaptha.com/4.0.0'
      : 'https://tessdata.projectnaptha.com/4.0.0_best');
  // Modèles distants (CDN) = .traineddata.gz ; modèles locaux (paquet système) = non gzippés.
  private readonly gzip = process.env.OCR_LANG_GZIP !== 'false';

  private async getWorker(): Promise<TesseractWorker> {
    if (!this.worker) {
      this.worker = await createWorker(this.languages, this.oem, {
        langPath: this.langPath,
        gzip: this.gzip,
      });
      await this.worker.setParameters({
        tessedit_pageseg_mode: this.psm,
        preserve_interword_spaces: '1',
      });
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
