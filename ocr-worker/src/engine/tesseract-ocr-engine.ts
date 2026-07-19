import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createWorker, OEM, PSM, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/** URL des modèles Tesseract selon la variante (défaut : « standard », entier, sûr en WASM). */
function tessdataUrl(variant?: string): string {
  const base = 'https://tessdata.projectnaptha.com/4.0.0';
  if (variant === 'best') return `${base}_best`;
  if (variant === 'fast') return `${base}_fast`;
  return base;
}

/**
 * Moteur OCR Tesseract (via tesseract.js). Le worker est créé paresseusement, réglé, réutilisé
 * entre les Jobs, puis terminé à l'arrêt. Réglages (TSPEC.04) :
 *  - OEM LSTM et modèles « best » (nettement plus précis que le « fast » par défaut) ;
 *  - PSM adapté aux affiches (texte épars par défaut) ;
 *  - `preserve_interword_spaces` pour ne pas coller les mots.
 * Tout est surchargeable par variables d'environnement.
 *
 * Note : l'apport des référentiels (levier 3) se fait par **correction lexicale post-OCR**
 * (voir OcrProcessor / LexiconCorrector), et non par `user_words` Tesseract : cette dernière
 * voie est instable avec le core WASM sur modèles LSTM « best » (crash `DotProductSSE`) et
 * n'apporte quasiment rien au moteur LSTM.
 */
@Injectable()
export class TesseractOcrEngine implements OcrEngine, OnModuleDestroy {
  private worker: TesseractWorker | null = null;
  private readonly languages = process.env.OCR_LANGUAGES ?? 'eng';
  private readonly oem = Number(process.env.OCR_OEM ?? OEM.LSTM_ONLY);
  private readonly psm = (process.env.OCR_PSM ?? PSM.SPARSE_TEXT) as PSM;
  // Modèles « standard » (entiers) par défaut : sûrs avec le core WASM de tesseract.js.
  // Les modèles « best » (flottants) sont plus précis mais appellent des fonctions SIMD
  // absentes de certains cores (crash `DotProductSSE`) : à n'activer que si le core le
  // supporte, via OCR_TESSDATA=best.
  private readonly langPath = process.env.OCR_LANG_PATH ?? tessdataUrl(process.env.OCR_TESSDATA);
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
